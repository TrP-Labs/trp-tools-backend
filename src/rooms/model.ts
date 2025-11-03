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
}