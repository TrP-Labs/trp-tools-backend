import { dataRedis } from "../utils/redis";
import prisma from "../utils/prisma";
import { session } from "../utils/sessionVerifier";
import { RoomModel } from "./model";
import { status } from "elysia";
import UserHasRank from "../utils/groupPermission";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

export function generateSecureToken(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const token = encodeBase32LowerCaseNoPadding(bytes);
    return token;
}

async function generateRoom(groupID : string, creatorID : string) {
    const roomID = generateSecureToken()

    dataRedis.hset(`room:${roomID}`, {
        groupID : groupID,
        createdAt : new Date().getUTCSeconds().toString(),
        creatorID : creatorID,
        expires : 1 // will be true end date of the shift once implemented
    })
    dataRedis.expire(`room:${roomID}`, 3600 * 2) // see above

    return roomID
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
        if (!(await UserHasRank(session.user.userId, event.groupID, 3)) ) throw status(403)

        return generateRoom(event.groupID, session.user.userId)
    }
}