import { Elysia } from 'elysia'
import GetSession from '../utils/sessionVerifier'
import { RoomModel } from './model'
import { RoomControls } from './service'

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
            200 : RoomModel.RoomResponse
        }
    })
