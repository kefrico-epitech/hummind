"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "../../../lib/notify";
import { Pencil, Trash2, MessageSquare, Book, ArrowRight } from "lucide-react";
import { CourseService } from "../../../services/course.service";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

type CourseItem = {
  id: string;
  title: string;
  domain: string;
  createdAt: string;
  description: string;
};

interface CourseCardProps {
  entityId: string;
  query?: string;
  canManageCourses?: boolean;
}

function extractCourseItems(value: unknown): CourseItem[] {
  if (Array.isArray(value)) {
    return value as CourseItem[];
  }

  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return (value as { data: CourseItem[] }).data;
  }

  return [];
}

export default function CourseCard({
  entityId,
  query = "",
  canManageCourses = false,
}: CourseCardProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, status } = await CourseService.getEntityCourse(entityId);
      const items = extractCourseItems(data);
      if (status === 200) {
        setCourses(items);
      } else {
        setCourses([]);
        toast.error("Erreur lors de la recuperation des cours");
      }
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  const handleDelete = async (courseId: string) => {
    const prevCourses = [...courses];
    setCourses((c) => c.filter((course) => course.id !== courseId));

    try {
      const res = await CourseService.delete(courseId);
      if (res.status === 200) {
        toast.success("Cours supprime avec succes");
      } else {
        throw new Error("Erreur API");
      }
    } catch {
      toast.error("Impossible de supprimer ce cours");
      setCourses(prevCourses);
    }
  };

  const handleEdit = (course: CourseItem) => {
    router.push(`/course/${course.id}/edit`);
  };

  const handleFollowCourse = (course: CourseItem) => {
    router.push(`/course/${course.id}/live`);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const queryText = query.trim().toLowerCase();
  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        if (!queryText) return true;
        return (
          course.title.toLowerCase().includes(queryText) ||
          course.domain.toLowerCase().includes(queryText) ||
          course.description.toLowerCase().includes(queryText)
        );
      }),
    [courses, queryText]
  );

  if (loading) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Chargement des cours...
      </p>
    );
  }

  if (courses.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Aucun cours associe pour le moment.
      </p>
    );
  }

  if (filteredCourses.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Aucun cours ne correspond a votre recherche.
      </p>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 p-2 sm:gap-5 sm:p-3 md:p-6 lg:gap-6">
      {filteredCourses.map((course) => (
        <div
          key={course.id}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/4 transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-purple-500/5 lg:flex-row"
        >
          <div className="relative flex h-32 w-full flex-col justify-between bg-linear-to-br from-[#5b5da7] to-[#3f4185] p-4 sm:h-40 sm:p-6 lg:h-auto lg:w-72">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
              <Book className="text-white" size={24} />
            </div>
            <div>
              <h3 className="mb-1 line-clamp-2 text-base font-bold leading-snug text-white sm:text-xl">
                {course.title}
              </h3>
              <span className="text-xs font-medium uppercase tracking-wider text-white/70">
                {course.domain}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between space-y-4 p-4 sm:space-y-6 sm:p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    A
                  </div>
                  <span>
                    Cree le{" "}
                    {format(new Date(course.createdAt), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                  </span>
                </div>
                <p className="line-clamp-2 max-w-xl text-sm text-gray-400">
                  {course.description}
                </p>
              </div>

              <span className="self-start rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-500">
                Publiee
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
              <button
                onClick={() => handleFollowCourse(course)}
                className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-[#7C6BF5] to-[#E84747] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Tester le cours
                <ArrowRight size={15} />
              </button>

              {canManageCourses && (
                <>
                  <ActionButton
                    icon={<Pencil size={16} />}
                    label="Modifier"
                    color="hover:text-blue-400"
                    onClick={() => handleEdit(course)}
                  />
                  <ActionButton
                    icon={<Trash2 size={16} />}
                    label="Supprimer"
                    color="hover:text-red-400"
                    onClick={() => {
                      if (confirm("Voulez-vous vraiment supprimer ce cours ?")) {
                        handleDelete(course.id);
                      }
                    }}
                  />
                </>
              )}

              <div className="ml-auto flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                <MessageSquare size={16} />
                <span className="font-medium">
                  250 <span className="hidden sm:inline">commentaires</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  color = "hover:text-white",
  onClick,
}: {
  icon: ReactNode;
  label: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-gray-400 transition-all ${color} hover:bg-white/10`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

