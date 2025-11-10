import { t } from 'elysia'

export namespace  Vehicles {
    export const BaseVehicle = t.Object({
        Id : t.Integer(),
        OwnerId : t.Integer(),
        Name : t.String(),
        Depot : t.String()
    }, { additionalProperties : true })
    export type BaseVehicle = typeof BaseVehicle.static

    export const UpdateBody = t.Array(BaseVehicle)
    export type UpdateBody = typeof UpdateBody.static

    export const VehicleModificationBody = t.Object({
        route : t.Optional(t.String()), // UUID of TrPTools route!
        towing : t.Optional(t.Boolean()),
        assigned : t.Optional(t.Boolean()),
    }, { additionalProperties : true })
    export type VehicleModificationBody = typeof VehicleModificationBody.static

    export const FullVehicleList = t.Array(t.Composite([BaseVehicle, VehicleModificationBody]))
    export type FullVehicleList = typeof FullVehicleList.static

    export const StreamEventSchema = t.Union([
        t.Object({
            event : t.Literal("ADD"),
            data : BaseVehicle,
        }),
        t.Object({
            event : t.Literal("UPDATE"),
            data : VehicleModificationBody,
        }),
        t.Object({
            event : t.Literal("DELETE"),
            data : t.String(),
        }),
        t.Object({
            event : t.Literal("HEARTBEAT")
        })
    ])
    export type StreamEventSchema = typeof StreamEventSchema.static
}

// ownerid 0 = decorative