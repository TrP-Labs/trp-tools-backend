import UserHasRank from "../utils/groupPermission";
import prisma from "../utils/prisma";
import { ScheduleModel } from "./model";
import { status } from "elysia";
import { session } from "../utils/sessionVerifier";
import { RRule } from "rrule";

function verifyRRule(ruleStr : string) : boolean {
    try {
        RRule.fromString(ruleStr)
        return true
    } catch {
        return false
    }
}

export abstract class Schedule {
    static async GetScheduleObject(ID : string, session : session) {
        if (!session.user) throw status(401)

        const event = await prisma.event.findUnique({
            where : {
                eventId : ID
            },
        })
        if (!event) throw status(404)
        
        if (!( await UserHasRank(session.user.userId, event.groupID, 3))) throw status(403)

        return event
    }

    static async CreateScheduledObject(Body : ScheduleModel.CreateBody, session : session) {
        if (!session.user) throw status(401)
        if (!(await UserHasRank(session.user.userId, Body.groupID, 3)) ) throw status(403)

        if (verifyRRule(Body.rrule) === false) throw status(400, "invalid recurrence rule" satisfies ScheduleModel.invalidRRule)

        const event = await prisma.event.create({
            data : Body
        })

        return { id : event.eventId}
    }

    static async UpdateScheduleObject(EventID : string, Body : ScheduleModel.UpdateBody, session : session) {
        if (!session.user) throw status(401)
        if (Body.rrule && verifyRRule(Body.rrule) === false) throw status(400, "invalid recurrence rule" satisfies ScheduleModel.invalidRRule)

        const currentEvent = await prisma.event.findUnique({
            where : {
                eventId : EventID
            }
        })
        if (!currentEvent) throw status(404)
        if (!(await UserHasRank(session.user.userId, currentEvent.groupID, 3)) ) throw status(403)

        await prisma.event.update({
            where : {eventId : EventID},
            data : Body,
        })

        return true
    }

    static async DeleteScheduleObject(EventID : string, session : session) {
        if (!session.user) throw status(401)
        const currentEvent = await prisma.event.findUnique({
            where : {
                eventId : EventID
            }
        })
        if (!currentEvent) throw status(404)
        if (!(await UserHasRank(session.user.userId, currentEvent.groupID, 3)) ) throw status(403)

        await prisma.event.delete({
            where : {eventId : EventID}
        })
    }
}