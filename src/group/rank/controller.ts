import { Elysia } from 'elysia'
import { Rank } from './service'
import { GroupModel } from '../model'
import { RankModel } from './model'
import { globalModel } from '../../utils/globalModel'
import { session } from '../../utils/sessionVerifier'
import GetSession from '../../utils/sessionVerifier'

export const ranks = new Elysia({ prefix: "/ranks", tags: ["Ranks"] })
    .derive(async ({ cookie : { access_token } }) : Promise<{ session : session }> => {
        if (!access_token || !access_token.value) return { session : {authenticated : false, user : undefined} }
        const session = await GetSession(access_token.value as string)
        return { session }
    })
    .get('/group/:groupId', async ({ params: { groupId }, session }) => {
        const ranks = await Rank.getAllRanks(groupId, session)

        return ranks
    }, {
        response: {
            200: RankModel.rankListResponse,
            401: globalModel.unauthorized,
            403: globalModel.forbidden,
            404: GroupModel.group.groupInvalid,
        }
    })
    .post('/group/:groupId', async ({ body, params: { groupId }, session }) => {
        console.log(body)
        const rank = await Rank.bindRank(groupId, body.robloxId, session)

        return rank
    }, {
        body: RankModel.createRankBody,
        response: {
            200: RankModel.createRankResponse,
            401: globalModel.unauthorized,
            403: globalModel.forbidden,
            404: GroupModel.group.groupInvalid,
            500: globalModel.internalError
        }
    })
    .get('/:rankId', async ({ params: { rankId }, session }) => {
        const rank = await Rank.getRank(rankId, session)

        return rank
    }, {
        response: {
            200: RankModel.rankItemResponse,
            401: globalModel.unauthorized,
            403: globalModel.forbidden,
            404: GroupModel.group.groupInvalid,
        }
    })
    .patch('/:rankId', async ({ body, params: { rankId }, session }) => {
        const result = await Rank.editRank(rankId, body, session)
        return result
    }, {
        body: RankModel.editRankBody,
        response: {
            200: globalModel.genericSuccess,
            404: RankModel.rankInvalid,
            401: globalModel.unauthorized,
            403: globalModel.forbidden,
            500: globalModel.internalError,
        }
    })