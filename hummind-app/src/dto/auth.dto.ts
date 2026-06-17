import z from "zod";

// signUpSchema is intentionally removed in v2 — public sign-up is no longer
// exposed. Accounts are created by ROOT (after a /demo request), by an
// organisation OWNER/ADMIN, or via the /join/[code] public salle link.
// The schema for /first-login is colocated with the FirstLoginForm component.

export const signinSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Mot de passe trop court"),
});


export const forgotSchema = z.object({
    email: z.string().email("Email invalide"),
});

export const ConfirmEmailSearchParamsSchema = z.object({
    token: z.string().uuid("Token invalide"),
});

export const ConfirmEmailApiResponseSchema = z.object({
    status: z.enum(["success", "expired", "invalid"]).default("invalid"),
    message: z.string().optional(),
});

export const recoverySchema = z
    .object({
        newPassword: z
            .string()
            .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Les mots de passe ne correspondent pas",
    });

export const signinResponseSchema = z.object({
    success: z.boolean(),
    user: z.object({
        id: z.string().uuid(),
        firstname: z.string(),
        lastname: z.string(),
        email: z.string().email(),
    }).optional(),
    token: z.string().optional(),
    tokenType: z.string().optional(),
    expiresIn: z.string().optional(),
});

export const getMeInfosResponseSchema = z.object({
    success: z.boolean(),
    user: z.object({
        id: z.string().uuid(),
        firstname: z.string(),
        lastname: z.string(),
        email: z.string().email(),
        role: z.string(), // "ROOT" | "MEMBER"
        emailVerifiedAt: z.string().datetime(), // ISO date string
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
    }).optional(),
});

export type SigninFormValues = z.infer<typeof signinSchema>;
export type ForgotFormValues = z.infer<typeof forgotSchema>;
export type RecoveryFormValues = z.infer<typeof recoverySchema>;
export type SigninResponse = z.infer<typeof signinResponseSchema>;
export type GetMeInfosResponse = z.infer<typeof getMeInfosResponseSchema>;
