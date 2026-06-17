import type { EntityAncestor } from "../dto/entity.dto";

export type EntityPageType = "organisation" | "departement" | "salle";

export function getEntityDetailHref(
  entity: Pick<EntityAncestor, "id" | "type">,
): string {
  switch (entity.type) {
    case "ORGANISATION":
      return `/organisation/${entity.id}`;
    case "DEPARTEMENT":
      return `/departement/${entity.id}`;
    case "SALLE":
    case "INDEPENDANT":
      return `/salle/${entity.id}`;
    default:
      return "/organisation";
  }
}

export function getEntityOpenLabel(type: EntityPageType): string {
  switch (type) {
    case "organisation":
      return "Voir mes departements";
    case "departement":
      return "Voir mes salles et mes cours";
    case "salle":
      return "Voir mes cours";
    default:
      return "Voir";
  }
}

export function getEntityEditLabel(type: EntityPageType): string {
  switch (type) {
    case "organisation":
      return "Modifier l'organisation";
    case "departement":
      return "Modifier le departement";
    case "salle":
      return "Modifier la salle";
    default:
      return "Modifier";
  }
}

export function getEntityManagementLabel(
  type: EntityPageType,
  mode: "manage" | "view" = "manage",
): string {
  if (type === "salle") {
    return mode === "manage"
      ? "Gerer les participants"
      : "Voir les participants";
  }

  return "Gerer l'equipe";
}

export function getEntityRootLabel(): string {
  return "Organisations";
}
