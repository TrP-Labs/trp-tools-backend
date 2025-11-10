import { t } from 'elysia'

export namespace RouteModel {
    export const PatchRouteBody = t.Object({
        Name : t.Optional(t.String()),
        Description : t.Optional(t.String()),
        Color : t.Optional(t.String()),
    })
    export type PatchRouteBody = typeof PatchRouteBody.static

    export const BaseRouteBody = t.Object({
        Name : t.String(),
        Description : t.String(),
        Color : t.String(),
        GroupId : t.String()
    })
    export type BaseRouteBody = typeof BaseRouteBody.static

    export const routeBody = t.Object({
        id : t.String(),
        Name : t.String(),
        Description : t.String(),
        Color : t.String(),
        GroupId : t.String()
    })
    export type routeBody = typeof routeBody.static

    export const routesResponse = t.Array(routeBody)
    export type routesResponse = typeof routesResponse.static

    export const InvalidColor = t.Literal("Invalid Color")
    export type InvalidColor = typeof InvalidColor.static

    export const RouteId = t.String()
    export type RouteId = typeof RouteId.static

    export const RoutesRequest = t.Object({
        GroupId : t.String()
    })
    export type RoutesRequest = typeof RoutesRequest.static
}