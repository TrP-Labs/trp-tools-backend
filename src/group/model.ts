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
    }

    export namespace ranks {
        export const createRankBody = t.Object({
            robloxId: t.String()
        })
        export type createRankBody = typeof createRankBody.static

        export const createRankResponse = t.Object({
            id : t.String()
        })
        export type createRankResponse = typeof createRankResponse.static

        export const rankItemResponse = t.Object({
            id : t.String(),
            robloxId : t.String(),

            cached_name : t.String(),
            cached_rank : t.Number(),
            
            color : t.String(),
            visible : t.Boolean(),

            permission_level : t.Number(),
            
            max_activity: t.Union([t.Number(), t.Null()]),
            min_activity: t.Union([t.Number(), t.Null()])
        })
        export type rankItemResponse = typeof rankItemResponse.static

        export const rankListResponse = t.Array(rankItemResponse)
        export type rankListResponse = typeof rankListResponse.static

        export const rankInvalid = t.Literal("rank does not exist")
        export type rankInvalid = typeof rankInvalid.static

        export const rankExists = t.Literal("rank already exists")
        export type rankExists = typeof rankExists.static

        export const editRankBody = t.Object({
            color : t.Optional(t.String()),
            visible : t.Optional(t.Boolean()),

            permission_level : t.Optional(t.Number()),

            refresh : t.Optional(t.Boolean()),

            max_activity : t.Optional(t.Number()),
            min_activity : t.Optional(t.Number())
        })
        export type editRankBody = typeof editRankBody.static
    }

    export namespace audit {

    }
}