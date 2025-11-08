import { Elysia, status, sse } from 'elysia'
import { Vehicles } from './model'
import { DispatchControls } from './service'
import GetSession from '../../utils/sessionVerifier'

export const dispatch = new Elysia({ prefix: "/dispatch", tags : ["Dispatch"]})
    .derive(async ({ cookie : { access_token } }) => {
        if (!access_token || !access_token.value) return { session : {authenticated : false, user : undefined} }
        const session = await GetSession(access_token.value as string)
        return { session }
    })
    .group('/:roomID', (app) => app
        .get('/connect', async ({ cookie : { access_token }, params : { roomID }, session }) => {
            if (session.authenticated == false || session.user == undefined) throw status(401)
            if (!(await DispatchControls.CanUserIdDispatchOnRoom(session.user.userId, roomID))) throw status(403)
            
            const Stream = await DispatchControls.CreateDispatchStream(roomID, session.user.userId)
            return sse(Stream)
        })

        .group('/vehicle/:vehicleID', (app) => app
            .patch('/', async ({ body, params : {roomID, vehicleID}, session }) => {
                if (session.authenticated == false || session.user == undefined) throw status(401)
                if (!(await DispatchControls.CanUserIdDispatchOnRoom(session.user.userId, roomID))) throw status(403)
                
                await DispatchControls.ModifyVehicle(vehicleID, roomID, body)
            }, {
                body : Vehicles.VehicleModificationBody
            })
            .delete('/', async ({ params : {roomID, vehicleID}, session }) => {
                if (session.authenticated == false || session.user == undefined) throw status(401)
                if (!(await DispatchControls.CanUserIdDispatchOnRoom(session.user.userId, roomID))) throw status(403)

                await DispatchControls.DeleteVehicle(roomID, vehicleID)
            })
        )

        .post('/vehicles', async ({ body, params : { roomID }, session }) => {
            if (session.authenticated == false || session.user == undefined) throw status(401)
            if (!(await DispatchControls.CanUserIdDispatchOnRoom(session.user.userId, roomID))) throw status(403)

            await DispatchControls.UpdateList(roomID, body)
        }, {
            body : Vehicles.UpdateBody
        })
    )