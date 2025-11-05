import { Elysia, redirect, status } from 'elysia'

import { AuthModel } from './model'
import { Session } from './service'
import GetSession from '../utils/sessionVerifier'
import { globalModel } from '../utils/globalModel'

export const auth = new Elysia({ prefix: "/auth", tags : ["Authentication"] })
    .get('/login', async ({cookie: {roblox_oauth_state, roblox_code_verifier}}) => {
        const { url, state, codeVerifier } = await Session.GenerateLogin()
        const ExpiryDate = new Date()
        ExpiryDate.setTime(ExpiryDate.getTime() + 1000 * 60 * 10) // 10 minutes in the future

        roblox_oauth_state.value = state
        roblox_oauth_state.expires = ExpiryDate
        roblox_code_verifier.value = codeVerifier
        roblox_code_verifier.expires = ExpiryDate

        return redirect(url, 303)
    })
    .get('/callback', async ({cookie: {roblox_oauth_state, roblox_code_verifier, access_token}, query : { code, state }}) => {
        const new_access_token = await Session.VerifyOAuth(code, state, roblox_code_verifier.value, roblox_oauth_state.value)

        access_token.sameSite = 'none'
        access_token.path = '/'
        access_token.secure = true
        access_token.httpOnly = true
        access_token.value = new_access_token

        return redirect(process.env.FRONTEND_URL as string, 303)
    }, {
        query : AuthModel.OauthCallbackQuery,
        cookie : AuthModel.OauthCallbackCookies
    })
    .get('/session', async ({cookie : { access_token }}) => {
        const session = await GetSession(access_token.value)

        if (session.authenticated == false) {
            throw status(401, "Unauthorized" satisfies globalModel.unauthorized)
        }

        return {
            authenticated : true,
            user : session.user
        }
    }, {
        cookie : AuthModel.SessionInspectionCookies,
        body : AuthModel.SessionInspectionResponse,
        response : {
            200 : AuthModel.SessionInspectionResponse,
            401 : globalModel.unauthorized
        }
    })