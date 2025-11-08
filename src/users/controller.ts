import { Elysia } from 'elysia'
import { UserModel } from './model'
import { UserService } from './service'
import { globalModel } from '../utils/globalModel'

export const users = new Elysia({ prefix: "/users", tags : ["Users"] })
    .get('/:UserID/short', async ({ params : { UserID }}) => {
        const ShortUserInfo = await UserService.GetShortUserInfo(UserID)

        return ShortUserInfo
    }, {
        response : {
            200: UserModel.ShortUserBody,
            404: globalModel.notFound
        }
    })