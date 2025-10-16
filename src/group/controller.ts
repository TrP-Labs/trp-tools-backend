import { Elysia } from 'elysia'

import { GroupModel } from './model'
import { Group, Rank } from './service'
import { globalModel } from '../utils/globalModel'

export const group = new Elysia({ prefix: "/groups" })
    .post('/', async ({ body }) => {
        const id = await Group.createGroup(body)

        return { id }
    }, {
        body: GroupModel.group.createGroupBody,
        response: {
            200: GroupModel.group.createGroupResponse,
            400: GroupModel.group.groupInvalid,
            409: GroupModel.group.groupExists
        }
    })
    .get('/:groupId', async ({ params: { groupId } }) => {
        const group = await Group.getGroup(groupId)

        return group
    }, {
        response: {
            200: GroupModel.group.groupResponse,
            404: GroupModel.group.groupInvalid
        }
    })
    .group('/:groupId/ranks', (app) => app
        .get('/', async ({ params : { groupId } }) => {
            const ranks = await Rank.getAllRanks(groupId)

            return ranks
        }, {
            response: {
                200: GroupModel.ranks.rankListResponse,
                404: GroupModel.group.groupInvalid,
            }
        })
        .get('/:rankId', async ({ params : { groupId, rankId } }) => {
            const rank = await Rank.getRank(groupId, rankId)

            return rank
        }, {
            response: {
                200: GroupModel.ranks.rankItemResponse,
                404: GroupModel.group.groupInvalid,
            }
        })
        .post('/', async ({ body, params : { groupId } }) => {
            console.log(body)
            const rank = await Rank.bindRank(groupId, body.robloxId)

            return rank
        }, {
            body : GroupModel.ranks.createRankBody,
            response : {
                200 : GroupModel.ranks.createRankResponse,
                404 : GroupModel.group.groupInvalid,
                500 : globalModel.internalError
            }
        }) 
        .patch('/:rankId', async ({ body, params: { groupId, rankId } }) => {
            const result = await Rank.editRank(groupId, rankId, body)
            return result
        }, {
            body : GroupModel.ranks.editRankBody,
            response : {
                200 : globalModel.genericSuccess,
                404 : GroupModel.ranks.rankInvalid,
                500 : globalModel.internalError,
                403 : globalModel.forbidden
            }
        })
    )
