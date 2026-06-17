import { z } from "zod";

// Type Entity aligné avec Prisma
export type Entity = {
    id: string;
    name: string;
    description?: string | null;
    picture?: string | null;   // ✅ image de l’entité
    createdById: string;       // ✅ correspond au créateur
    parentId?: string | null;
    createdAt: string;
    updatedAt: string;
    myRole: "OWNER" | "ADMIN" | "INSTRUCTOR" | "LEARNER" | "VIEWER" | null;  // ✅ rôle de l’utilisateur actuel dans cette entité
    type: "ORGANISATION" | "DEPARTEMENT" | "SALLE" | "INDEPENDANT"; // ✅ type de l’entité

    // Relations enrichies
    children?: Entity[]; // ✅ enfants de premier niveau
    members?: {
        id: string;
        role: string;
        user: {
            id: string;
            firstname: string;
            lastname: string;
            email: string;
        };
    }[];
};

export type EntityAncestor = {
    id: string;
    name: string;
    parentId?: string | null;
    type: Entity["type"];
};

// Schéma Zod pour la validation des données d'une organisation
export const createEntitySchema = z.object({
    name: z.string().min(3, "Le nom doit comporter au moins 3 caractères."),
    description: z.string().min(5, "La description doit comporter au moins 5 caractères.").optional(),
    type: z.enum(["ORGANISATION", "DEPARTEMENT", "SALLE", "INDEPENDANT"]), // ✅ type de l’entité
    picture: z.string().url().optional(), // ✅ image optionnelle, doit être une URL valide si fournie
    parentId: z.string().uuid().optional(), // ✅ UUID optionnel
});

// Type pour les données de l'organisation
export type CreateEntityInput = z.infer<typeof createEntitySchema>;
