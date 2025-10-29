import { status } from "elysia";
import { globalModel } from "../../utils/globalModel";
import { dataRedis } from "../../utils/redis";
import { nats } from "../../utils/nats";
import { Subscription, StringCodec } from "nats";
import { getRankInGroup, getRole } from "noblox.js";
import prisma from "../../utils/prisma";
import { Vehicles } from "./model";

const sc = StringCodec()

export abstract class DispatchControls {

    static async CanUserIdDispatchOnGroup(userID: string, groupID: string) {
        const groupPromise = prisma.group.findFirst({
            where: {
                id: groupID
            },
            include: {
                ranks: true
            }
        })

        const userPromise = prisma.user.findFirst({
            where: {
                id: userID
            }
        })

        // Await the two database queries
        const [group, user] = await Promise.all([groupPromise, userPromise]);
        if (!group || !user) { throw status(500); return false }

        // Ensure the given userid has permissions
        const rankNumber = await getRankInGroup(Number(group.robloxId), user.robloxId)
        const rankObject = await getRole(Number(group.robloxId), rankNumber)
        const rankRelation = group.ranks.find(u => u.robloxId == rankObject.id.toString())
        if (!(rankRelation && rankRelation.permission_level >= 1)) return false

        return true
    }

    static async CanUserIdDispatchOnRoom(userID : string, roomID : string) {
        const groupID = await dataRedis.hget(`dispatchroom:${roomID}`, 'groupID')
        if (!groupID) return false
        return await this.CanUserIdDispatchOnGroup(userID, groupID)
    }

    static async CreateDispatchStream(roomID : string, SourceIdentifier : string) {
        // Verify the user is not already connected
        if (await dataRedis.sismember(`dispatchroom:${roomID}:users`, SourceIdentifier)) throw status(409, "Conflict")

        // Verify the room exists
        const groupID = await dataRedis.hget(`dispatchroom:${roomID}`, 'groupID')
        if (!groupID) throw status(404, "Not Found" satisfies globalModel.notFound)

        // Prepare connection
        const sub: Subscription = nats.subscribe(`dispatchroom.${roomID}`);
        await dataRedis.sadd(`dispatchroom:${roomID}:users`, SourceIdentifier)

        // Create and return a readablestream to sent SSE's through
        return new ReadableStream({
            async start(controller) {
                (async () => {
                    // NATS uses an iterator to listen to messages
                    for await (const msg of sub) {
                        controller.enqueue(sc.decode(msg.data));
                    }
                    // EXIT A: When the NATS room closes
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

    static async ModifyVehicle(vehicleID : string, roomID : string, body : Vehicles.VehicleModificationBody) {
        const vehiclesInRoom = await dataRedis.lrange(`dispatchroom:${roomID}:vehicles`, 0, -1)
        if (!vehiclesInRoom.includes(vehicleID)) throw status(404)

        // Remove undefined values from the body, since redis will coerce undefined into a string
        const cleanBody = Object.fromEntries(
            Object.entries(body).filter(([_, v]) => v !== undefined)
        )

        await dataRedis.hset(`dispatchroom:${roomID}:vehicles:${vehicleID}`, cleanBody)
    }

    static async DeleteVehicle(roomID : string, vehicleID : string) {
        const vehiclesInRoom = await dataRedis.lrange(`dispatchroom:${roomID}:vehicles`, 0, -1)
        if (!vehiclesInRoom.includes(vehicleID)) throw status(404)

        
        const remH = dataRedis.del(`dispatchroom:${roomID}:vehicles:${vehicleID}`) // Data hash
        const remL = dataRedis.lrem(`dispatchroom:${roomID}:vehicles`, 1, vehicleID) // Index list entry

        await Promise.all([ remH, remL ])
    }

    static async UpdateList(roomID : string, VehicleList : Vehicles.UpdateBody) {
        const exists = await dataRedis.exists(`dispatchroom:${roomID}`)
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
                    await Promise.all([
                        dataRedis.hset(key, vehicle),
                        dataRedis.lpush(stackkey, vehicle.Id.toString())
                    ])
                }
            })
        )
    }
}
