import prisma from "./prisma";
import { getRankInGroup, getRole } from "noblox.js";

export default async function UserHasRank(userID: string, groupID: string, rank : number) {
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
    if (!group || !user) { return false }

    // Ensure the given userid has permissions
    const rankNumber = await getRankInGroup(Number(group.robloxId), user.robloxId)
    const rankObject = await getRole(Number(group.robloxId), rankNumber)
    const rankRelation = group.ranks.find(u => u.robloxId == rankObject.id.toString())
    if (!(rankRelation && rankRelation.permission_level >= rank)) return false

    return true
}