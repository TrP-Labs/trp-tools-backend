import { status } from "elysia";
import type { GroupModel } from "./model";
import { globalModel } from "../utils/globalModel";
import prisma from "../../prisma/prisma";
import { getRole, getGroup, getLogo } from "noblox.js";

export abstract class Group {
    static async createGroup({ robloxId } : GroupModel.group.createGroupBody) : Promise<string> {
        // Verify this group does not already exist
        const existing = await prisma.group.findFirst({ where: { robloxId: robloxId } });
        if (existing) throw status(409, "group already exists" satisfies GroupModel.group.groupExists)

        // Get owner role
        try {
            var ownerRole = await getRole(Number(robloxId), 255)
        } catch {
            throw status(400, "group does not exist" satisfies GroupModel.group.groupInvalid)
        }

        // Create group in DB
        const group = await prisma.group.create({
            data: {
                robloxId: robloxId,
                ranks: {
                    create: {
                        robloxId: ownerRole.id.toString(),
                        color: '#9b59b6',
                        visible: true,
                        permission_level: 3,

                        cached_name: ownerRole.name,
                        cached_rank: ownerRole.rank
                    },
                },
            },
        });

        return group.id
    }

    static async getGroup(id : string) : Promise<GroupModel.group.groupResponse> {
        const group = await prisma.group.findFirst({ where: { id : id } });
        if (!group) throw status(404, "group does not exist" satisfies GroupModel.group.groupInvalid)
        
        const [robloxGroup, icon] = await Promise.all([
            getGroup(Number(group.robloxId)),
            getLogo(Number(group.robloxId), "420x420"),
        ])

        if (!robloxGroup || !icon) throw status(500, "Internal Server Error" satisfies globalModel.internalError)

        return {
            id : group.id,
            created : group.createdAt,
            robloxId : Number(group.robloxId),
            
            robloxIcon : icon,
            robloxName : robloxGroup.name,
            robloxDescription : robloxGroup.description,
            robloxMembers : robloxGroup.memberCount
        }
        
    }
}

export abstract class Rank {
    static async getAllRanks(id : string) : Promise<GroupModel.ranks.rankListResponse> {
        const rankRelations = await prisma.rankRelation.findMany({
            where: { groupId: id }, 
            select: {
                id: true,
                robloxId: true,
                color: true,
                visible: true,
                permission_level: true,
                cached_name: true,
                cached_rank: true,
                max_activity: true,
                min_activity: true
            }
        })

        if (rankRelations.length == 0) throw status(404, "group does not exist" satisfies GroupModel.group.groupInvalid)

        return rankRelations
    }

    static async getRank(groupId : string, rankId : string) : Promise<GroupModel.ranks.rankItemResponse> {
        const rankRelation = await prisma.rankRelation.findFirst({
            where : {id : rankId, groupId : groupId},
            select: {
                id: true,
                robloxId: true,
                color: true,
                visible: true,
                permission_level: true,
                cached_name: true,
                cached_rank: true,
                max_activity: true,
                min_activity: true
            }
        })

        if (!rankRelation) throw status(404, "rank does not exist" satisfies GroupModel.ranks.rankInvalid)

        return rankRelation
    }

    static async bindRank(groupId : string, rankId: string) : Promise<GroupModel.ranks.createRankResponse> {
        const group = await prisma.group.findFirst({ where: { id : groupId } });
        if (!group) throw status(404, "group does not exist" satisfies GroupModel.group.groupInvalid)

        const role = await getRole(Number(group.robloxId), Number(rankId))
        if (!role) throw status(500, "Internal Server Error" satisfies globalModel.internalError)

        const alreadyExistingRank = await prisma.rankRelation.findUnique({ where : { robloxId : role.id.toString()} })
        if (alreadyExistingRank) throw status(409, "rank already exists" satisfies GroupModel.ranks.rankExists)

        const rank = await prisma.rankRelation.create({
            data : {
                robloxId : role.id.toString(),
                color : "FFFFFF",
                visible : false,
                permission_level : 0,
                cached_name : role.name,
                cached_rank : role.rank,

                groupId : group.id
            }
        })

        return {id : rank.id}
    }

    static async editRank(groupId : string, rankId : string, modification : GroupModel.ranks.editRankBody) {
        const rank = await prisma.rankRelation.findFirst({
            where : { id : rankId, groupId : groupId }
        })

        // Scrub permission change if rank is owner
        if (rank?.cached_rank == 255) {
            modification.permission_level = undefined
            throw status(403, "Forbidden" satisfies globalModel.forbidden)
        }

        try {
            await prisma.rankRelation.update({
                where : { id : rankId, groupId : groupId },
                data : modification
            })
        } catch (error : any) {
            if (error.code === "P2025") {
                throw status(404, "rank does not exist" satisfies GroupModel.ranks.rankInvalid)
            } else {
                throw status(500, "Internal Server Error" satisfies globalModel.internalError)
            }
        }
 
       return "Success" as globalModel.genericSuccess
    }
}