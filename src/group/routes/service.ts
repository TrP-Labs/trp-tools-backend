import prisma from "../../utils/prisma";
import { session } from "../../utils/sessionVerifier";
import { RouteModel } from "./model";
import UserHasRank from "../../utils/groupPermission";
import { status } from "elysia";

const hexRegex = /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i; 

export abstract class Route {
    static async CreateRoute(body : RouteModel.BaseRouteBody, session : session) {
        if (!session.user) throw status(401)
        if (!(await UserHasRank(session.user.userId, body.GroupId, 3)) ) throw status(403)
        if(!hexRegex.test(body.Color)) throw status(400, "Invalid Color" satisfies RouteModel.InvalidColor)

        const route = await prisma.route.create({
            data : {
                Name : body.Name,
                Description : body.Description,
                Color : body.Color,
                GroupId : body.GroupId
            }
        })

        return route.id
    }

    static async GetRoute(id : string) : Promise<RouteModel.routeBody> {
        const route = await prisma.route.findUnique({
            where : {
                id : id
            }
        })

        if (!route) throw status(404)

        return route
    }

    static async GetAllRoutes(groupId : string) {
        const route = await prisma.route.findMany({
            where : {
                GroupId : groupId
            }
        })

        return route
    }

    static async DeleteRoute(id : string, session : session) {
        if (!session.user) throw status(401)
        const route = await prisma.route.findUnique({ where : { id : id}})
        if (!route) throw status(404)
        if (!(await UserHasRank(session.user.userId, route.GroupId, 3)) ) throw status(403)

        await prisma.route.delete({
            where : {
                id : id
            }
        })
    }

    static async UpdateRoute(id : string, body : RouteModel.PatchRouteBody, session : session) {
        if (!session.user) throw status(401)
        const route = await prisma.route.findUnique({ where : { id : id}})
        if (!route) throw status(404)
        if (!(await UserHasRank(session.user.userId, route.GroupId, 3)) ) throw status(403)
        if(!hexRegex.test(body.Color)) throw status(400, "Invalid Color" satisfies RouteModel.InvalidColor)

        await prisma.route.update({
            where : {id : id},
            data : body
        })
    }
}