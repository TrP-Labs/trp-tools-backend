import { Elysia } from 'elysia'

import GetSession, { session } from '../utils/sessionVerifier'
import { GroupModel } from './model'
import { Group } from './service'
import { globalModel } from '../utils/globalModel'

export const group = new Elysia({ prefix: "/groups", tags : ["Groups"] })
    .derive(async ({ cookie : { access_token } }) : Promise<{ session : session }> => {
        if (!access_token || !access_token.value) return { session : {authenticated : false, user : undefined} }
        const session = await GetSession(access_token.value as string)
        return { session }
    })
    .post('/', async ({ body, session }) => {
        const id = await Group.createGroup(body, session)

        return { id }
    }, {
        body: GroupModel.group.createGroupBody,
        response: {
            200: GroupModel.group.createGroupResponse,
            400: GroupModel.group.groupInvalid,
            401: globalModel.unauthorized,
            403: globalModel.forbidden,
            409: GroupModel.group.groupExists
        }
    })

    .get('/creatable', async ({ session }) => {
        const creatableGroups = await Group.getCreatableGroups(session)

        return creatableGroups
    }, {
        response : {
            200 : GroupModel.group.groupList,
            401 : globalModel.unauthorized
        }
    })

    .get('/', async ({ session }) => {
        const groups = await Group.getGroups(session)

        return groups
    }, {
        response : {
            200 : GroupModel.group.groupList,
            401 : globalModel.unauthorized
        }
    })

    .get('/:groupId', async ({ params: { groupId } }) => {
        const group = await Group.getGroup(groupId)

        return group
    }, {
        response: {
            200: GroupModel.group.groupResponse,
            404: GroupModel.group.groupInvalid
        }
    })
