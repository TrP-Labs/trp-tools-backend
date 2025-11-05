import { Elysia } from 'elysia'

import GetSession, { session } from '../utils/sessionVerifier'
import { GroupModel } from './model'
import { Group, Rank } from './service'
import { globalModel } from '../utils/globalModel'

export const group = new Elysia({ prefix: "/groups", tags : ["Groups"] })
    .derive(async ({ cookie : { access_token } }) : Promise<{ session : session }> => {
        if (!access_token || !access_token.value) return { session : {authenticated : false, user : undefined} }
        const session = await GetSession(access_token.value as string)
        return { session }
    })
    .post('/', async ({ body, session }) => {
        const id = await Group.createGroup(body, session)

        return { id }
    }, {
        body: GroupModel.group.createGroupBody,
        response: {
            200: GroupModel.group.createGroupResponse,
            400: GroupModel.group.groupInvalid,
            401: globalModel.unauthorized,
            403: globalModel.forbidden,
            409: GroupModel.group.groupExists
        }
    })

    .get('/creatable', async ({ session }) => {
        const creatableGroups = await Group.getCreatableGroups(session)

        return creatableGroups
    }, {
        response : {
            200 : GroupModel.group.groupList,
            401 : globalModel.unauthorized
        }
    })

    .get('/', async ({ session }) => {
        const groups = await Group.getGroups(session)

        return groups
    }, {
        response : {
            200 : GroupModel.group.groupList,
            401 : globalModel.unauthorized
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
        .get('/', async ({ params : { groupId }, session }) => {
            const ranks = await Rank.getAllRanks(groupId, session)

            return ranks
        }, {
            response: {
                200: GroupModel.ranks.rankListResponse,
                401: globalModel.unauthorized,
                403: globalModel.forbidden,
                404: GroupModel.group.groupInvalid,
            }
        })
        .get('/:rankId', async ({ params : { groupId, rankId }, session }) => {
            const rank = await Rank.getRank(groupId, rankId, session)

            return rank
        }, {
            response: {
                200: GroupModel.ranks.rankItemResponse,
                401: globalModel.unauthorized,
                403: globalModel.forbidden,
                404: GroupModel.group.groupInvalid,
            }
        })
        .post('/', async ({ body, params : { groupId }, session }) => {
            console.log(body)
            const rank = await Rank.bindRank(groupId, body.robloxId, session)

            return rank
        }, {
            body : GroupModel.ranks.createRankBody,
            response : {
                200 : GroupModel.ranks.createRankResponse,
                401: globalModel.unauthorized,
                403: globalModel.forbidden,
                404 : GroupModel.group.groupInvalid,
                500 : globalModel.internalError
            }
        }) 
        .patch('/:rankId', async ({ body, params: { groupId, rankId }, session }) => {
            const result = await Rank.editRank(groupId, rankId, body, session)
            return result
        }, {
            body : GroupModel.ranks.editRankBody,
            response : {
                200 : globalModel.genericSuccess,
                404 : GroupModel.ranks.rankInvalid,
                401: globalModel.unauthorized,
                403 : globalModel.forbidden,
                500 : globalModel.internalError,
            }
        })
    )
