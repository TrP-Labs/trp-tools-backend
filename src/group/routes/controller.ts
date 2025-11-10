import Elysia from "elysia"
import GetSession, { session } from "../../utils/sessionVerifier"
import { globalModel } from "../../utils/globalModel"
import { RouteModel } from "./model"
import { Route } from "./service"

export const route = new Elysia({ prefix: "/routes", tags: ["Routes"] })
    .derive(async ({ cookie: { access_token } }): Promise<{ session: session }> => {
        if (!access_token || !access_token.value) return { session: { authenticated: false, user: undefined } }
        const session = await GetSession(access_token.value as string)
        return { session }
    })
    .post('/', async ({ body, session }) => {
        const RouteId = await Route.CreateRoute(body, session)

        return RouteId
    }, {
        body: RouteModel.BaseRouteBody,
        response: {
            200: RouteModel.RouteId,
            400: RouteModel.InvalidColor,
            401: globalModel.unauthorized,
            403: globalModel.forbidden
        }
    })
    .get('/', async ({ query }) => {
        const routes = await Route.GetAllRoutes(query.GroupId)

        return routes
    }, {
        query: RouteModel.RoutesRequest,
        response: {
            200: RouteModel.routesResponse,
            404: globalModel.notFound
        }
    })
    .group('/:RouteID', (app) => app
        .get('/', async ({ params: { RouteID } }) => {
            const route = await Route.GetRoute(RouteID)

            return route
        }, {
            response: {
                200: RouteModel.routeBody,
                401: globalModel.unauthorized,
                403: globalModel.forbidden,
                404: globalModel.notFound
            }
        })

        .delete('/', async ({ params: { RouteID }, session }) => {
            await Route.DeleteRoute(RouteID, session)

            return "Success" as globalModel.genericSuccess
        }, {
            response: {
                200: globalModel.genericSuccess,
                401: globalModel.unauthorized,
                403: globalModel.forbidden,
                404: globalModel.notFound
            }
        })

        .patch('/', async ({ body, params: { RouteID }, session }) => {
            await Route.UpdateRoute(RouteID, body, session)

            return "Success" as globalModel.genericSuccess
        }, {
            body: RouteModel.PatchRouteBody,
            response: {
                200: globalModel.genericSuccess,
                400: RouteModel.InvalidColor,
                401: globalModel.unauthorized,
                403: globalModel.forbidden,
                404: globalModel.notFound
            }
        })
    )


