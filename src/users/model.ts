import { t } from "elysia";

export namespace UserModel {
    export const ShortUserBody = t.Object({
        Username : t.String(),
        DisplayName : t.String(),
        ProfilePicture : t.String()
    })
    export type ShortUserBody = typeof ShortUserBody.static
}