import { Elysia } from 'elysia'
import GetSession, { session } from '../utils/sessionVerifier'

import { Schedule } from './service'
import { ScheduleModel } from './model'
import { globalModel } from '../utils/globalModel'

export const schedule = new Elysia({ prefix: "/schedule", tags : ["Schedule"] })
    .derive(async ({ cookie : { access_token } }) : Promise<{ session : session }> => {
        if (!access_token || !access_token.value) return { session : {authenticated : false, user : undefined} }
        const session = await GetSession(access_token.value as string)
        return { session }
    })
    .post('/', async ({ body, session }) => {
            console.log("Hewwo World :3")
            const Event = await Schedule.CreateScheduledObject(body, session)

            return Event
        }, {
            body : ScheduleModel.CreateBody,
            response : {
                200 : ScheduleModel.CreateResponse,
                400 : ScheduleModel.invalidRRule,
                401 : globalModel.unauthorized,
                403 : globalModel.forbidden
            }
        })
    .get('/', async ({query, session}) => {
        const Events = await Schedule.GetSchedules(query, session)

        return Events
    }, {
        query : ScheduleModel.EventsRequest,
        response : {
            200 : ScheduleModel.EventsResponse,
            401 : globalModel.unauthorized,
            403 : globalModel.forbidden,
            404 : globalModel.notFound
        }
    })
    .group('/:EventID', (app) => app
        .get('/', async ({ params : { EventID }, session}) => {
            const EventResponse = await Schedule.GetScheduleObject(EventID, session)

            return EventResponse
        }, {
            response : {
                200 : ScheduleModel.EventResponse,
                401 : globalModel.unauthorized,
                403 : globalModel.forbidden,
                404 : globalModel.notFound
            }
        })

        .delete('/', async ({ params : { EventID }, session}) => {
            await Schedule.DeleteScheduleObject(EventID, session)

            return "Success" as globalModel.genericSuccess
        }, {
            response : {
                200 : globalModel.genericSuccess,
                401 : globalModel.unauthorized,
                403 : globalModel.forbidden,
                404 : globalModel.notFound
            }
        })

        .patch('/', async ({ body, params : { EventID }, session}) => {
            await Schedule.UpdateScheduleObject(EventID, body, session)

            return "Success" as globalModel.genericSuccess
        }, {
            body : ScheduleModel.UpdateBody,
            response : {
                200 : globalModel.genericSuccess,
                400 : ScheduleModel.invalidRRule,
                401 : globalModel.unauthorized,
                403 : globalModel.forbidden,
                404 : globalModel.notFound
            }
        })
    )