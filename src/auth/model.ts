import { t } from 'elysia'

export namespace AuthModel {
    export const GeneratedLoginData = t.Object({
        url : t.String(), // no url type in elysia???
        state : t.String(),
        codeVerifier : t.String(),
    })
    export type GeneratedLoginData = typeof GeneratedLoginData.static

    export const OauthCallbackQuery = t.Object({
        code : t.String(),
        state : t.String()
    })
    export type OauthCallbackQuery = typeof OauthCallbackQuery.static

    export const OauthCallbackCookies = t.Object({
        roblox_oauth_state: t.String(),
        roblox_code_verifier : t.String(),
        access_token : t.Optional(t.String())
    })
    export type OauthCallbackCookies = typeof OauthCallbackCookies.static

    export const SessionInspectionCookies = t.Object({
        access_token : t.String()
    })
    export type SessionInspectionCookies = typeof SessionInspectionCookies.static

    export const SessionInspectionResponse = t.Object({
        authenticated : t.Boolean(),
        user : t.Optional(t.Object({
            userId : t.String(),
            robloxId : t.Number(),
            siteRank : t.String()
        }))
    })
    export type SessionInspectionResponse = typeof SessionInspectionResponse.static
}