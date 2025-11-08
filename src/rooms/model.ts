import { t } from "elysia";

export namespace RoomModel {
    export const OpenBody = t.Object({
        EventID : t.String()
    })
    export type OpenBody = typeof OpenBody.static

    export const RoomResponse = t.Object({
        RoomID : t.String()
    })
    export type RoomResponse = typeof RoomResponse.static

    export const GroupQuery = t.Object({
        GroupID : t.String()
    })
    export type GroupQuery = typeof GroupQuery.static

    export const ActiveRoomResponse = t.Object({
        groupID : t.String(),
        createdAt : t.Date(),
        creatorID : t.String(),
        expires : t.Date(),
        users : t.Array(t.String()),
        vehicles : t.Number()
    })
    export type ActiveRoomResponse = typeof ActiveRoomResponse.static
}