import { t } from 'elysia'

export namespace  Vehicles {
    export const UpdateBody = t.Array(t.Object({
        Id : t.Integer(),
        OwnerId : t.Integer(),
        Name : t.String(),
        Depot : t.String()
    }))
    export type UpdateBody = typeof UpdateBody.static

    export const VehicleModificationBody = t.Object({
        route : t.Optional(t.String()), // UUID of TrPTools route!
        towing : t.Optional(t.Boolean()),
        assigned : t.Optional(t.Boolean()),
    })
    export type VehicleModificationBody = typeof VehicleModificationBody.static
}

// ownerid 0 = decorative