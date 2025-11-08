import { dataRedis } from "../utils/redis";
import prisma from "../utils/prisma";
import { session } from "../utils/sessionVerifier";
import { RoomModel } from "./model";
import { status } from "elysia";
import UserHasRank from "../utils/groupPermission";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";
import { RRule } from "rrule";

type RoomInfo = {
    groupID : string,
    createdAt : Date,
    creatorID : string,
    expires : Date
}

export function generateSecureToken(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const token = encodeBase32LowerCaseNoPadding(bytes);
    return token;
}

function EventAvailable(rrulestr: string) {
  const rule = RRule.fromString(rrulestr)
  const now = new Date()
  const past = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const future = new Date(now.getTime() + 30 * 60 * 1000)
  const upcoming = rule.between(past, future, true)
  return Boolean(upcoming.length)
}

async function generateRoom(groupID : string, creatorID : string) {
    const roomID = generateSecureToken()

    const index = await dataRedis.set(`groupindex:${groupID}`, roomID, "NX")
    if (!index) throw status(409, "This group already has a room open")
    dataRedis.expire(`groupindex:${groupID}`, 3600 * 2)

    dataRedis.hset(`room:${roomID}`, {
        groupID : groupID,
        createdAt : Date.now(),
        creatorID : creatorID,
        expires : 1 // will be true end date of the shift once implemented
    })
    dataRedis.expire(`room:${roomID}`, 3600 * 2) // see above

    return roomID
}

async function deleteRoomKeys(id : string) {
  const stream = dataRedis.scanStream({ match: `${id}*`, count: 1000 });
  for await (const keys of stream) {
    if (keys.length) await dataRedis.unlink(...keys); // non-blocking delete
  }
}

export abstract class RoomControls {
    static async createRoom(body : RoomModel.OpenBody, session : session) {
        if (!session.user) throw status(401)

        const event = await prisma.event.findUnique({
            where : {
                eventId : body.EventID
            }
        })

        if (!event) throw status(404)
        if(!EventAvailable(event.rrule)) throw status(409, "This event is not scheduled for the current time")
        if (!(await UserHasRank(session.user.userId, event.groupID, 3)) ) throw status(403)

        return generateRoom(event.groupID, session.user.userId)
    }

    static async getId(groupID : string, session : session) : Promise<RoomModel.RoomResponse> {
        if (!session.user) throw status(401)

        const RoomID = await dataRedis.get(`groupindex:${groupID}`)
        if (!RoomID) throw status(404)
        const roomInfo = await dataRedis.hgetall(`room:${RoomID}`)
        if (!(await UserHasRank(session.user.userId, roomInfo.groupID, 1)) ) throw status(403)

        return { RoomID : RoomID}
    }

    static async getRoomInfo(roomID : string, session : session) : Promise<RoomModel.ActiveRoomResponse> {
        if (!session.user) throw status(401)

        const [roomInfo, dispatchUsers, vehicleAmount] = await Promise.all([
            dataRedis.hgetall(`room:${roomID}`) as unknown as Promise<RoomInfo>,
            dataRedis.smembers(`dispatchroom:${roomID}:users`),
            dataRedis.llen(`dispatchroom:${roomID}:vehicles`)
        ])

        if (Object.keys(roomInfo).length === 0) throw status(404)
        if (!(await UserHasRank(session.user.userId, roomInfo.groupID, 2)) ) throw status(403)

        roomInfo.createdAt = new Date(Number(roomInfo.createdAt))
        roomInfo.expires = new Date(Number(roomInfo.expires))

        return {
            ...roomInfo,
            users : Object.values(dispatchUsers),
            vehicles : vehicleAmount
        }
    }

    static async closeRoom(RoomID : string, session : session) {
        if (!session.user) throw status(401)
        const roomInfo = await dataRedis.hgetall(`room:${RoomID}`)
        if (Object.keys(roomInfo).length === 0) throw status(404)
        if (!(await UserHasRank(session.user.userId, roomInfo.groupID, 2)) ) throw status(403)
        await Promise.all([
            dataRedis.del(`groupindex:${roomInfo.groupID}`),
            deleteRoomKeys(`room:${RoomID}`),
            deleteRoomKeys(`dispatchroom:${RoomID}`)
        ])
    }
}