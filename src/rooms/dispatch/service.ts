import { status } from "elysia";
import { globalModel } from "../../utils/globalModel";
import { dataRedis } from "../../utils/redis";
import { nats } from "../../utils/nats";
import { Subscription, StringCodec } from "nats";
import { getRankInGroup, getRole } from "noblox.js";
import prisma from "../../utils/prisma";
import { Vehicles } from "./model";
import UserHasRank from "../../utils/groupPermission";

const sc = StringCodec()

function normalizeVehicle(raw: Record<string, string>) {
    return {
        Id: Number(raw.Id),
        OwnerId: Number(raw.OwnerId),
        Name: raw.Name,
        Depot: raw.Depot,
        route: raw.route ?? undefined,
        towing: raw.towing === "true" ? true : raw.towing === "false" ? false : undefined,
        assigned: raw.assigned === "true" ? true : raw.assigned === "false" ? false : undefined
    }
}

export abstract class DispatchControls {

    static async CanUserIdDispatchOnRoom(userID : string, roomID : string) {
        const groupID = await dataRedis.hget(`room:${roomID}`, 'groupID')
        if (!groupID) return false
        return await UserHasRank(userID, groupID, 1)
    }

    static async CreateDispatchStream(roomID : string, SourceIdentifier : string) {
        // Verify the user is not already connected
        //if (await dataRedis.sismember(`dispatchroom:${roomID}:users`, SourceIdentifier)) throw status(409, "Conflict")

        // Verify the room exists
        const groupID = await dataRedis.hget(`room:${roomID}`, 'groupID')
        if (!groupID) throw status(404, "Not Found" satisfies globalModel.notFound)

        // Prepare connection
        const sub: Subscription = nats.subscribe(`dispatchroom.${roomID}`);
        await dataRedis.sadd(`dispatchroom:${roomID}:users`, SourceIdentifier)

        // Create and return a readablestream to sent SSE's through
        return new ReadableStream({
            async start(controller) {
                (async () => {
                    // NATS uses an iterator to listen to messages
                    const interval = setInterval(() => {
                        controller.enqueue(JSON.stringify({event : "HEARTBEAT"}));  // minimal data, keeps it alive
                    }, 10_000);
                    for await (const msg of sub) {
                        controller.enqueue(sc.decode(msg.data));
                    }
                    // EXIT A: When the NATS room closes
                    clearInterval(interval)
                    sub.unsubscribe()
                    dataRedis.srem(`dispatchroom:${roomID}:users`, SourceIdentifier)
                    controller.close();
                })().catch((err) => {
                    // EXIT B: When NATS or the server to client network encounters an error
                    sub.unsubscribe()
                    dataRedis.srem(`dispatchroom:${roomID}:users`, SourceIdentifier)
                    controller.error(err);
                });
            },

            async cancel(_reason) {
                // EXIT C: When HTTP encounters an issue (client leaves, client to server network error)
                sub.unsubscribe()
                await dataRedis.srem(`dispatchroom:${roomID}:users`, SourceIdentifier)
            },
        })
    }

    static async GetAllVehicles(roomID: string): Promise<Vehicles.FullVehicleList> {
        const vehiclesInRoom = await dataRedis.lrange(`dispatchroom:${roomID}:vehicles`, 0, -1)
        if (vehiclesInRoom.length === 0) throw status(404)
        const fullVehicleList = await Promise.all(
            vehiclesInRoom.map(async r => {
                const raw = await dataRedis.hgetall(`dispatchroom:${roomID}:vehicles:${r}`)
                return normalizeVehicle(raw)
            })
        )

        return fullVehicleList as unknown as Vehicles.FullVehicleList
    }

    static async ModifyVehicle(vehicleID : string, roomID : string, body : Vehicles.VehicleModificationBody) {
        const vehiclesInRoom = await dataRedis.lrange(`dispatchroom:${roomID}:vehicles`, 0, -1)
        if (!vehiclesInRoom.includes(vehicleID)) throw status(404)

        // Remove undefined values from the body, since redis will coerce undefined into a string
        const cleanBody = Object.fromEntries(
            Object.entries(body).filter(([_, v]) => v !== undefined)
        )

        nats.publish(`dispatchroom.${roomID}`, JSON.stringify({
            event : "UPDATE",
            data : cleanBody
        }))

        await dataRedis.hset(`dispatchroom:${roomID}:vehicles:${vehicleID}`, cleanBody)
    }

    static async DeleteVehicle(roomID : string, vehicleID : string) {
        const vehiclesInRoom = await dataRedis.lrange(`dispatchroom:${roomID}:vehicles`, 0, -1)
        if (!vehiclesInRoom.includes(vehicleID)) throw status(404)

        nats.publish(`dispatchroom.${roomID}`, JSON.stringify({
            event : "DELETE",
            data : vehicleID
        }))
        
        const remH = dataRedis.del(`dispatchroom:${roomID}:vehicles:${vehicleID}`) // Data hash
        const remL = dataRedis.lrem(`dispatchroom:${roomID}:vehicles`, 1, vehicleID) // Index list entry

        await Promise.all([ remH, remL ])
    }

    static async UpdateList(roomID : string, VehicleList : Vehicles.UpdateBody) {
        const exists = await dataRedis.exists(`room:${roomID}`)
        if (!exists) throw status(404, "Not Found" satisfies globalModel.notFound)

        const stackkey = `dispatchroom:${roomID}:vehicles`

        // Remove all vehicles currently on the stack that are not on the updated list
        const currentList = await dataRedis.lrange(stackkey, 0, -1)
        const updatedIDs = new Set(VehicleList.map(v => v.Id.toString()))
        const missing = currentList.filter(id => !updatedIDs.has(id))
        await Promise.all(
            missing.map(id => Promise.all([
                dataRedis.del(`dispatchroom:${roomID}:vehicles:${id}`),
                dataRedis.lrem(stackkey, 1, id)
            ])
        ))

        // Add all new vehicles
        await Promise.all(
            VehicleList.map(async vehicle => {
                const key = `dispatchroom:${roomID}:vehicles:${vehicle.Id}`
                const exists = await dataRedis.exists(key)

                if (!exists) { // We are intentionally not updating already existing IDs on the stack
                    nats.publish(`dispatchroom.${roomID}`, JSON.stringify({
                        event : "ADD",
                        data : vehicle
                    }))

                    await Promise.all([
                        dataRedis.hset(key, vehicle),
                        dataRedis.expire(key, 3600),
                        dataRedis.lpush(stackkey, vehicle.Id.toString())
                    ])
                }
            })
        )
    }
}
