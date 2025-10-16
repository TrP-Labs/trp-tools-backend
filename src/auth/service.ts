import { status } from "elysia";
import type { AuthModel } from "./model";
import type { globalModel } from "../utils/globalModel";
import prisma from "../../prisma/prisma";

import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { generateState, generateCodeVerifier, OAuth2Tokens, decodeIdToken } from "arctic";
import { Roblox } from "arctic";

export function generateSessionToken(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const token = encodeBase32LowerCaseNoPadding(bytes);
    return token;
}

interface RobloxOAuthClaims {
  sub: number;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  name?: string;
  nickname?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

export const roblox = new Roblox(
	process.env.ROBLOX_CLIENT_ID as string,
	process.env.ROBLOX_CLIENT_SECRET as string,
	(process.env.BASE_URL as string) + '/auth/callback'
);

export abstract class Session {
    static async GenerateLogin() : Promise<AuthModel.GeneratedLoginData> {
        const state = generateState();
		const codeVerifier = generateCodeVerifier();
		const url = roblox.createAuthorizationURL(state, codeVerifier, ["openid", "profile"]).toString(); // no url type in elysia

        return {
            url,
            state,
            codeVerifier
        }
    }

    static async VerifyOAuth(code : string, state : string, storedCode : string, storedState : string) : Promise<string> {
        // Verify that the request is secure and valid
        if (state !== storedState) {
			throw status(400, "Bad Request" satisfies globalModel.badRequest)
		}

        // Verify the request with Roblox
        let tokens: OAuth2Tokens;
		try {
			tokens = await roblox.validateAuthorizationCode(code, storedCode);
		} catch (e) {
            throw status(400, "Bad Request" satisfies globalModel.badRequest)
		}

        // Proccess data Roblox returned

        const claims = decodeIdToken(tokens.idToken()) as RobloxOAuthClaims;
		const robloxUserId = claims.sub;

		if (!robloxUserId) {
			throw status(400, "Bad Request" satisfies globalModel.badRequest)
		}

        // Find or create user
        let user = await prisma.user.findUnique({
            where : {
                robloxId : Number(robloxUserId)
            }
        })

        if (!user) {
            user = await prisma.user.create({
                data : {
                    robloxId : Number(robloxUserId),
                    siteRank : "user"
                }
            })
        }

        // Add session
        const sessionToken = generateSessionToken()
        const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(sessionToken)));

        const SessionExpiration = new Date()
        SessionExpiration.setTime(SessionExpiration.getTime() + 1000 * 60 * 60 * 24 * 30) // 30 day session length

        await prisma.session.create({
            data : {
                sessionId : sessionId,
                expiresAt : SessionExpiration,
                userId : user.id
            }
        })

        return sessionToken
    }
}