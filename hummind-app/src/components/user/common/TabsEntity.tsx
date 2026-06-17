"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Entity } from "../../../dto/entity.dto";
import SearchArea from "../../common/SearchArea";
import OrgCardList from "./OrgCardList";
import SalleCardList from "./SalleCardList";
import { CreateCategorieDialog } from "./form/CreateCategorieDialog";
import { EntityService } from "../../../services/entity.service";
import { toast } from "../../../lib/notify";
import CourseCard from "./CourseCard";
import SalleParticipant from "./SalleParticipant";
import { CategoryDialog } from "./CategoryDialog";

type EntityType = "organisation" | "departement" | "salle";
type TabValue = "departement" | "salle" | "courses" | "participants";
type CategoryEntityLink = { entity: Entity };
type EntityCategory = {
  id: string;
  name: string;
  entityLinks: CategoryEntityLink[];
};

interface TabsEntityProps {
  organisation: Entity;
  type: EntityType;
  onEntityTreeChanged?: () => unknown | Promise<unknown>;
}

export function TabsEntity({
  type,
  organisation,
  onEntityTreeChanged,
}: TabsEntityProps) {
  const isAutorised =
    organisation.myRole === "OWNER" || organisation.myRole === "ADMIN";

  const isProfessor = organisation.myRole === "INSTRUCTOR";

  const defaultTab: TabValue =
    type === "organisation"
      ? "departement"
      : type === "departement"
        ? "salle"
        : "courses";

  const [tab, setTab] = useState<TabValue>(defaultTab);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<EntityCategory[]>([]);
  const [loadingCat, setLoadingCat] = useState(false);
  const queryText = query.trim().toLowerCase();

  const fetchCategories = useCallback(async () => {
    if (type !== "organisation" && type !== "departement") return;
    setLoadingCat(true);
    try {
      const { data, status } = await EntityService.listCategories(
        organisation.id,
      );
      if (status === 200) {
        const rawCategories = (data as { data?: EntityCategory[] } | null)
          ?.data;
        setCategories(rawCategories ?? []);
      }
    } catch {
      toast.error("Impossible de charger les categories.");
    } finally {
      setLoadingCat(false);
    }
  }, [type, organisation.id]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleStructureChanged = useCallback(async () => {
    if (onEntityTreeChanged) {
      await onEntityTreeChanged();
    }

    if (type === "organisation" || type === "departement") {
      await fetchCategories();
    }
  }, [fetchCategories, onEntityTreeChanged, type]);

  const tabConfig = useMemo<
    Record<EntityType, { value: TabValue; label: string }[]>
  >(
    () => ({
      organisation: [
        { value: "departement", label: "Departements" },
        { value: "salle", label: "Salles independantes" },
      ],
      departement: [{ value: "salle", label: "Salles" }],
      salle: [
        { value: "courses", label: "Cours" },
        { value: "participants", label: "Participants" },
      ],
    }),
    [],
  );

  const visibleTabs = useMemo(() => {
    const tabs = tabConfig[type];
    if (type === "salle" && !isAutorised && !isProfessor) {
      return tabs.filter((t) => t.value !== "participants");
    }
    return tabs;
  }, [type, isAutorised, isProfessor, tabConfig]);

  useEffect(() => {
    if (!visibleTabs.some((t) => t.value === tab)) {
      setTab(visibleTabs[0]?.value ?? defaultTab);
    }
  }, [visibleTabs, tab, defaultTab]);

  const allChildren = useMemo(
    () => organisation.children ?? [],
    [organisation.children],
  );

  const filteredChildren = useMemo(
    () =>
      allChildren.filter((child) =>
        child.name.toLowerCase().includes(queryText),
      ),
    [allChildren, queryText],
  );

  const allIndependentRooms = useMemo(
    () => allChildren.filter((c) => c.type === "INDEPENDANT"),
    [allChildren],
  );

  const allAssociatedRooms = useMemo(
    () => allChildren.filter((c) => c.type === "SALLE"),
    [allChildren],
  );

  const independentRooms = useMemo(
    () => filteredChildren.filter((c) => c.type === "INDEPENDANT"),
    [filteredChildren],
  );

  const associatedRooms = useMemo(
    () => filteredChildren.filter((c) => c.type === "SALLE"),
    [filteredChildren],
  );

  const roomPool = useMemo(
    () => (type === "organisation" ? allIndependentRooms : allAssociatedRooms),
    [type, allIndependentRooms, allAssociatedRooms],
  );

  const filteredCategories = useMemo(() => {
    if (queryText.length === 0) return categories;

    return categories
      .map((cat) => {
        const links = cat.entityLinks ?? [];
        const categoryMatch = String(cat.name ?? "")
          .toLowerCase()
          .includes(queryText);
        const linkMatches = links.filter((link: CategoryEntityLink) =>
          String(link?.entity?.name ?? "")
            .toLowerCase()
            .includes(queryText),
        );

        if (categoryMatch) {
          return { ...cat, entityLinks: links };
        }
        if (linkMatches.length > 0) {
          return { ...cat, entityLinks: linkMatches };
        }
        return null;
      })
      .filter((value): value is EntityCategory => value !== null);
  }, [categories, queryText]);

  const cta = useMemo(() => {
    if (type === "organisation") {
      return {
        label:
          tab === "departement"
            ? "Nouveau departement"
            : "Nouvelle salle independante",
        href: `/${tab === "departement" ? "organisation" : "independant"}/${organisation.id}/create`,
      };
    }
    if (type === "departement") {
      return {
        label: "Nouvelle salle",
        href: `/${type}/${organisation.id}/create`,
      };
    }
    if (type === "salle" && tab === "courses") {
      return {
        label: "Nouveau cours",
        href: `/salle/${organisation.id}/create`,
      };
    }
    return null;
  }, [type, tab, organisation.id]);

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as TabValue)}
      className="w-full"
    >
      <div className="flex flex-col gap-3 border-b bg-background px-3 pb-3 sm:flex-row sm:items-center sm:gap-0 sm:px-6 sm:pb-0">
        <TabsList className="flex gap-4 bg-transparent p-0 sm:gap-8">
          {visibleTabs.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-auto flex-none rounded-none border-0 bg-transparent px-0 pb-3 text-sm shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              {label}
            </TabsTrigger>
          ))}
          <SearchArea value={query} onSearch={setQuery} />
        </TabsList>

        <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          {cta && isAutorised && (
            <>
              {tab === "salle" && (
                <CreateCategorieDialog
                  entityId={organisation.id}
                  entities={roomPool}
                  onSaved={fetchCategories}
                />
              )}

              <Link href={cta.href}>
                <Button className="rounded-full px-5 text-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {cta.label}
                </Button>
              </Link>
            </>
          )}
          {isProfessor && type === "salle" && tab === "courses" && cta && (
            <Link href={cta.href}>
              <Button className="rounded-full px-5 text-sm">
                <Plus className="mr-2 h-4 w-4" />
                {cta.label}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <TabsContent value="departement" className="px-3 pt-5 sm:px-6 sm:pt-8">
        {filteredChildren.filter((c) => c.type === "DEPARTEMENT").length > 0 ? (
          <OrgCardList
            orgs={filteredChildren.filter((c) => c.type === "DEPARTEMENT")}
            type="departement"
            onArchived={handleStructureChanged}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {query
              ? "Aucun departement trouve."
              : "Aucun departement n'a encore ete cree."}
          </p>
        )}
      </TabsContent>

      <TabsContent value="salle" className="px-3 pt-5 sm:px-6 sm:pt-8">
        {type === "organisation" || type === "departement" ? (
          loadingCat ? (
            <p className="text-sm text-muted-foreground">
              Chargement des categories...
            </p>
          ) : filteredCategories.length > 0 ? (
            <div className="space-y-6">
              {filteredCategories.map((cat) =>
                // Use full category data for edit form to avoid losing hidden links during a filtered search.
                (() => {
                  const fullCategory =
                    categories.find((source) => source.id === cat.id) ?? cat;
                  return (
                    <div
                      key={cat.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                  <CategoryDialog
                    category={cat}
                    categoryToEdit={fullCategory}
                    entityId={organisation.id}
                    entities={roomPool}
                    onSaved={handleStructureChanged}
                  />
                    </div>
                  );
                })(),
              )}

              {(() => {
                const categorizedIds = categories.flatMap(
                  (cat) => cat.entityLinks?.map((link) => link.entity.id) ?? [],
                );
                const uncategorized = roomPool.filter(
                  (c) => !categorizedIds.includes(c.id),
                );
                const matchingUncategorized =
                  queryText.length > 0
                    ? uncategorized.filter((c) =>
                        c.name.toLowerCase().includes(queryText),
                      )
                    : uncategorized;

                return matchingUncategorized.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <CategoryDialog
                      category={{
                        id: "__uncategorized__",
                        name: "Autres",
                        entityLinks: matchingUncategorized.map((entity) => ({
                          entity,
                        })),
                      }}
                      entityId={organisation.id}
                      entities={roomPool}
                      onSaved={handleStructureChanged}
                      editable={false}
                    />
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
              type === "organisation"
                ? independentRooms.length > 0
                : associatedRooms.length > 0
            ) ? (
            <SalleCardList
              orgs={
                type === "organisation" ? independentRooms : associatedRooms
              }
              onArchived={handleStructureChanged}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {type === "organisation"
                ? query
                  ? "Aucune salle independante trouvee."
                  : "Aucune salle independante n'a encore ete creee."
                : query
                  ? "Aucune salle trouvee."
                  : "Aucune salle n'a encore ete creee."}
            </p>
          )
        ) : null}
      </TabsContent>

      <TabsContent value="courses" className="px-3 pt-5 sm:px-6 sm:pt-8">
        <CourseCard
          entityId={organisation.id}
          query={query}
          canManageCourses={isAutorised || isProfessor}
        />
      </TabsContent>

      <TabsContent value="participants" className="px-3 pt-5 sm:px-6 sm:pt-8">
        {isAutorised || isProfessor ? (
          <SalleParticipant entityId={organisation.id} query={query} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Vous n&apos;etes pas autorise a voir les participants.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}

