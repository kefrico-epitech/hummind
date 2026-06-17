import { z } from "zod";

export const UserRoleSchema = z.enum(["ADMIN", "STAFF", "USER"]);
export const UserStatusSchema = z.enum(["ACTIVE", "INVITED", "SUSPENDED"]);
export const PlanSchema = z.enum(["FREE", "PRO", "BUSINESS"]);
export const SubStatusSchema = z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"]);

export const IsoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid ISO date");

export const UserSummarySchema = z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string().email(),
    role: UserRoleSchema,
    status: UserStatusSchema,
    joinedAt: IsoDate,
});

export const EntitySummarySchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    owner: z.string(),            // nom du propriétaire
    plan: PlanSchema,
    members: z.number().int().nonnegative(),
    status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED"]),
    createdAt: IsoDate,
});

export const SubscriptionSummarySchema = z.object({
    id: z.string().uuid(),
    entityId: z.string().uuid(),
    entityName: z.string(),
    plan: PlanSchema,
    amount: z.number().nonnegative(), // en USD pour l’exemple
    status: SubStatusSchema,
    startAt: IsoDate,
    renewAt: IsoDate,
});

export const KpiSchema = z.object({
    label: z.string(),
    value: z.number(),
    deltaPct: z.number().optional(),
});

export const PieSliceSchema = z.object({
    label: z.string(),
    value: z.number().nonnegative(),
    color: z.string().optional(),
});

export const AdminHomeSchema = z.object({
    asOf: IsoDate,
    kpis: z.array(KpiSchema).length(4),
    roleDistribution: z.array(PieSliceSchema).min(1),
    planDistribution: z.array(PieSliceSchema).min(1),
    latestUsers: z.array(UserSummarySchema).min(1),
    latestEntities: z.array(EntitySummarySchema).min(1),
    latestSubscriptions: z.array(SubscriptionSummarySchema).min(1),
});

export type AdminHome = z.infer<typeof AdminHomeSchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type EntitySummary = z.infer<typeof EntitySummarySchema>;
export type SubscriptionSummary = z.infer<typeof SubscriptionSummarySchema>;
