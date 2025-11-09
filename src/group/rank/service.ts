import UserHasRank from "../../utils/groupPermission"
import prisma from "../../utils/prisma"
import { status } from "elysia"
import { session } from "../../utils/sessionVerifier"
import { globalModel } from "../../utils/globalModel"
import { GroupModel } from "../model"
import { RankModel } from "./model"
import { getRole, getRoles } from "noblox.js"

export abstract class Rank {
    static async getAllRanks(id : string, session : session) : Promise<RankModel.rankListResponse> {
        if (!session.user) throw status(401)
        if (!(await UserHasRank(session.user.userId, id, 3))) throw status(403)

        const rankRelations = await prisma.rankRelation.findMany({
            where: { groupId: id }
        })

        if (rankRelations.length == 0) throw status(404, "group does not exist" satisfies GroupModel.group.groupInvalid)

        return rankRelations
    }

    static async getRank(rankId : string, session : session) : Promise<RankModel.rankItemResponse> {
        if (!session.user) throw status(401)

        const rankRelation = await prisma.rankRelation.findUnique({
            where : {id : rankId}
        })

        if (!rankRelation) throw status(404, "rank does not exist" satisfies RankModel.rankInvalid)
        if (!(await UserHasRank(session.user.userId, rankRelation.groupId, 3))) throw status(403)

        return rankRelation
    }

    static async bindRank(groupId : string, rankId: string, session : session) : Promise<RankModel.createRankResponse> {
        if (!session.user) throw status(401)
        if (!(await UserHasRank(session.user.userId, groupId, 3))) throw status(403)

        const group = await prisma.group.findFirst({ where: { id : groupId } });
        if (!group) throw status(404, "group does not exist" satisfies GroupModel.group.groupInvalid)

        const role = await getRole(Number(group.robloxId), Number(rankId))
        if (!role) throw status(500, "Internal Server Error" satisfies globalModel.internalError)

        const alreadyExistingRank = await prisma.rankRelation.findUnique({ where : { robloxId : role.id.toString()} })
        if (alreadyExistingRank) throw status(409, "rank already exists" satisfies RankModel.rankExists)

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

    static async editRank(rankId : string, modification : RankModel.editRankBody, session : session) {
        if (!session.user) throw status(401)

        const rank = await prisma.rankRelation.findUnique({
            where : { id : rankId }
        })

        if (!rank) throw status(404)
        if (!(await UserHasRank(session.user.userId, rank.groupId, 3))) throw status(403)

        // Scrub permission change if rank is owner
        if (rank?.cached_rank == 255) {
            modification.permission_level = undefined
        }

        try {
            await prisma.rankRelation.update({
                where : { id : rankId },
                data : modification
            })
        } catch (error : any) {
            if (error.code === "P2025") {
                throw status(404, "rank does not exist" satisfies RankModel.rankInvalid)
            } else {
                throw status(500, "Internal Server Error" satisfies globalModel.internalError)
            }
        }
 
       return "Success" as globalModel.genericSuccess
    }

    static async getUnassignedRanks(groupId : string, session : session) {
        if (!session.user) throw status(401)
        if (!(await UserHasRank(session.user.userId, groupId, 3))) throw status(403) 

        const group = await prisma.group.findUnique({
            where : {id : groupId},
            include : {ranks : true}
        })

        if (!group) throw status(404, "group does not exist" satisfies GroupModel.group.groupInvalid)
        
        const ExistingRanks = await getRoles(Number(group.robloxId))

        const UnassignedRanks = ExistingRanks
            .filter(r => !group.ranks.find(gr => gr.robloxId == r.id.toString()))
            .map(r => ({
                robloxId : r.id.toString(),
                name : r.name,
                order : Math.abs(r.rank - 255)
            }))

        return UnassignedRanks
    }
}