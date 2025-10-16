import prisma from "../../prisma/prisma";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

export default async function GetSession(token: string) {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

    // Find session
    const result = await prisma.session.findUnique({
        where: {
            sessionId: sessionId
        },
        include: {
            user: true
        }
    });

    // Session does not exist
    if (!result) return {
        authenticated: false,
        user: undefined,
    }

    // Deconstruct result
    const { user, ...session } = result;

    // Session is expired
    if (Date.now() >= session.expiresAt.getTime()) {
        await prisma.session.delete({ where: { sessionId: sessionId } });
        return { authenticated: false, user: undefined };
    }

    // Extend session if halfway through
    if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
        session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
        await prisma.session.update({
            where: {
                sessionId: session.sessionId
            },
            data: {
                expiresAt: session.expiresAt
            }
        });
    }

    // We are authorized
    return {
        authenticated: true,
        user: {
            userId: user.id,
            robloxId: user.robloxId,
            siteRank: user.siteRank
        }
    }
}