import { t } from 'elysia'

export namespace GroupModel {
    export namespace group {
        export const createGroupBody = t.Object({
            robloxId : t.String()
        })
        export type createGroupBody = typeof createGroupBody.static

        export const createGroupResponse = t.Object({
            id: t.String()
        })
        export type createGroupResponse = typeof createGroupResponse.static

        export const groupResponse = t.Object({
            id : t.String(),
            created : t.Date(),

            robloxIcon : t.String(),
            robloxId : t.Number(),
            robloxName : t.String(),
            robloxDescription : t.String(),
            robloxMembers : t.Number()
        })
        export type groupResponse = typeof groupResponse.static

        export const groupInvalid = t.Literal("group does not exist")
        export const groupExists = t.Literal("group already exists")
        export type groupInvalid = typeof groupInvalid.static
        export type groupExists = typeof groupExists.static

        export const groupList = t.Array(t.String())
        export type groupList = typeof groupList.static
    }

    export namespace audit {

    }
}