import prisma from "../utils/prisma";
import { getUserInfo, getPlayerThumbnail } from "noblox.js";
import { status } from "elysia";
import { UserModel } from "./model";


export abstract class UserService {
    static async GetShortUserInfo(UserId : string) : Promise<UserModel.ShortUserBody> {
        const user = await prisma.user.findUnique({
            where : {
                id : UserId
            }
        })

        if (!user) throw status(404)
        
        const [info, picture] = await Promise.all([
            getUserInfo(user.robloxId),
            getPlayerThumbnail(user.robloxId,150,'png',false,'headshot')
        ])

        return {
            Username : info.name,
            DisplayName : info.displayName,
            ProfilePicture : picture[0].imageUrl as string
        }
    }
}