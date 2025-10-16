import { t } from 'elysia'

export namespace globalModel {
    export const internalError = t.Literal("Internal Server Error")
    export type internalError = typeof internalError.static
    export const genericSuccess = t.Literal("Success")
    export type genericSuccess = typeof genericSuccess.static
    export const forbidden = t.Literal("Forbidden")
    export type forbidden = typeof forbidden.static
    export const unauthorized = t.Literal("Unauthorized")
    export type unauthorized = typeof unauthorized.static
    export const badRequest = t.Literal("Bad Request")
    export type badRequest = typeof badRequest.static
}