import { Elysia } from 'elysia'
import GetSession from '../utils/sessionVerifier'
import { RoomModel } from './model'
import { RoomControls } from './service'
import { globalModel } from '../utils/globalModel'

export const rooms = new Elysia({ prefix: "/rooms", tags: [ "Rooms" ]})
    .derive(async ({ cookie : { access_token } }) => {
        if (!access_token || !access_token.value) return { session : {authenticated : false, user : undefined} }
        const session = await GetSession(access_token.value as string)
        return { session }
    })
    .post('/', async ({ body, session }) => {
        const id = await RoomControls.createRoom(body, session)

        return { RoomID : id } satisfies RoomModel.RoomResponse
    }, {
        body : RoomModel.OpenBody,
        response : {
            200 : RoomModel.RoomResponse,
            401 : globalModel.unauthorized,
            403 : globalModel.forbidden,
            404 : globalModel.notFound,
            409 : RoomModel.CreateRoom409
        }
    })
    .get('/', async ({ query, session}) => {
        const response = await RoomControls.getId(query.GroupID, session)

        return response
    }, {
        query : RoomModel.GroupQuery,
        response : {
            200 : RoomModel.RoomResponse,
            401 : globalModel.unauthorized,
            403 : globalModel.forbidden,
            404 : globalModel.notFound
        }
    })
    .get('/:RoomID', async ({ params : { RoomID }, session}) => {
        const roominfo = await RoomControls.getRoomInfo(RoomID, session)

        return roominfo
    }, {
        response : {
            200 : RoomModel.ActiveRoomResponse,
            401 : globalModel.unauthorized,
            403 : globalModel.forbidden,
            404 : globalModel.notFound
        }
    })
    .delete('/:RoomID', async ({params : {RoomID}, session}) => {
        await RoomControls.closeRoom(RoomID, session)

        return "Success" as globalModel.genericSuccess
    }, {
        response : {
            200 : globalModel.genericSuccess,
            401 : globalModel.unauthorized,
            403 : globalModel.forbidden,
            404 : globalModel.notFound
        }
    })