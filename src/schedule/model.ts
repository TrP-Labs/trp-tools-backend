import { t } from 'elysia'

export namespace ScheduleModel {
    export const CreateBody = t.Object({
        groupID : t.String(),
        name : t.String(),
        startTime : t.Date(),
        rrule : t.String()
    })
    export type CreateBody = typeof CreateBody.static

    export const UpdateBody = t.Object({
        name : t.Optional(t.String()),
        startTime : t.Optional(t.Date()),
        rrule : t.Optional(t.String())
    })
    export type UpdateBody = typeof UpdateBody.static

    export const EventResponse = t.Composite([
        CreateBody,
        t.Object({
            eventId : t.String(),
            createdAt : t.Date()
        })
    ])
    export type EventResponse = typeof EventResponse.static

    export const CreateResponse = t.Object({
        id : t.String(),
    })
    export type CreateResponse = typeof CreateResponse.static

    export const invalidRRule= t.Literal("invalid recurrence rule")
    export type invalidRRule = typeof invalidRRule.static
}