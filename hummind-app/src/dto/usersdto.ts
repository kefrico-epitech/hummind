import { z } from "zod";


export const RoleEnum = z.enum(["ADMIN", "MANAGER", "USER"]);
export const MemberRoleEnum = z.enum(["OWNER", "ADMIN", "INSTRUCTOR", "LEARNER", "VIEWER"]);
export const StatusEnum = z.enum(["ACTIVE", "SUSPENDED", "INVITED"]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const UserDTO = z.object({
  id: z.string().uuid().or(z.string()), // selon ton schema réel
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.string().email(),
  role: RoleEnum,
  status: StatusEnum,
  emailVerifiedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type AppUser = z.infer<typeof UserDTO>;


export const ProfileSchema = z.object({
  firstname: z.string().min(1, "Le prénom est requis").max(60),
  lastname: z.string().min(1, "Le nom est requis").max(60),
  email: z.string().email("Email invalide").max(120),
});
export type ProfileFormValues = z.infer<typeof ProfileSchema>;

type SortBy = "createdAt" | "updatedAt" | "firstname" | "lastname" | "email";
type Order = "asc" | "desc";

export type GetUsersQuery = Partial<{
  search: string;
  role: string;
  page: number;
  limit: number;
  sortBy: SortBy;
  order: Order;
}>;

export type Paginated<T> = {
  items: T[];
  meta: {
    [x: string]: number;
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

// Member related types
export type MemberRole = z.infer<typeof MemberRoleEnum>;

export const MemberSchema = z.object({
  id: z.string().uuid().or(z.string()),
  email: z.string().uuid().or(z.string()),
  organisationId: z.string().uuid().or(z.string()),
  role: MemberRoleEnum,
  user:z.object(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Member = z.infer<typeof MemberSchema>;


