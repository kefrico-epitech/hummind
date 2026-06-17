"use client";

import { X, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Button } from "../../../ui/button";
import { toast } from "../../../../lib/notify";
import { EntityService } from "../../../../services/entity.service";
import type { CreateEntityInput } from "../../../../dto/entity.dto";
import type { Member, MemberRole } from "../../../../dto/usersdto";
import { MemberRoleEnum } from "../../../../dto/usersdto";
import ShareRoom from "../../../common/ShareRoom";

export interface RecordSalleProps {
  backTo?: string | null;
  parentId?: string | null;
  type?: "ORGANISATION" | "DEPARTEMENT" | "SALLE" | "INDEPENDANT";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erreur reseau";
}

function getMemberUser(member: Member): Record<string, unknown> {
  return member.user && typeof member.user === "object"
    ? (member.user as Record<string, unknown>)
    : {};
}

export default function RecordSalleModal({
  backTo = null,
  parentId = null,
  type = "SALLE",
}: RecordSalleProps) {
  const router = useRouter();
  const close = () => (backTo ? router.replace(backTo) : router.back());

  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [entityId, setEntityId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("ADMIN");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const step = useMemo(() => (entityId ? "members" : "create"), [entityId]);

  const fetchMembers = useCallback(async (id: string) => {
    const res = await EntityService.listMembers(id);
    if (res.data) setMembers(res.data);
    else toast.error(res.error || "Impossible de charger les membres");
  }, []);

  useEffect(() => {
    if (!entityId) return;
    void fetchMembers(entityId);
  }, [entityId, fetchMembers]);

  const handleCreateSalle = async () => {
    setErrors({});
    if (!name.trim()) {
      setErrors({ name: ["Le nom est obligatoire"] });
      return;
    }

    setLoading(true);
    try {
      const payload: CreateEntityInput = {
        name: name.trim(),
        description: "",
        type,
        ...(parentId && { parentId }),
      };
      const res = await EntityService.create(payload);

      if (!res.data) {
        toast.error(res.error || "Erreur lors de la creation de la salle");
        return;
      }

      toast.success("Salle creee avec succes");
      setEntityId(res.data.id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMember = async () => {
    if (!entityId) return;

    if (!email.trim()) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }

    setLoading(true);
    try {
      if (editingMember) {
        const res = await EntityService.updateMemberRole(
          entityId,
          editingMember.id,
          role,
        );
        if (!res.data) {
          toast.error(res.error || "Erreur lors de la mise a jour");
          return;
        }
        toast.success("Role mis a jour");
      } else {
        const result = await EntityService.addMemberOrInvite(entityId, {
          email: email.trim(),
          role,
        });

        if (result.kind === "member") {
          toast.success("Membre ajoute");
          await fetchMembers(entityId);
        } else if (result.kind === "invitation") {
          toast.success(
            "Invitation envoyee. Cette personne pourra rejoindre apres inscription et acceptation de l'invitation.",
          );
        } else {
          toast.error(result.error);
          return;
        }
      }

      setEmail("");
      setRole("ADMIN");
      setEditingMember(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: Member) => {
    const user = getMemberUser(member);
    setEmail(typeof user.email === "string" ? user.email : "");
    setRole(member.role);
    setEditingMember(member);
  };

  const handleDelete = async (member: Member) => {
    if (!entityId) return;

    setLoading(true);
    try {
      const res = await EntityService.deleteMember(entityId, member.id);
      if (res.status !== 200) {
        toast.error(res.error || "Erreur lors de la suppression");
        return;
      }
      toast.success("Membre supprime");
      await fetchMembers(entityId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-4xl bg-[#151515] p-6 text-sm text-white shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex-1 text-center text-lg font-semibold">
            {step === "create"
              ? "Creer votre salle"
              : "Salle creee - Gerer les membres"}
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "create" && (
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la salle</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Entrez le nom de votre salle"
              />
              {errors?.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.join(", ")}</p>
              )}
            </div>

            <Button
              type="button"
              disabled={loading}
              className="h-11 w-full rounded-2xl bg-[#7C6BF5] px-6 text-sm font-medium hover:bg-[#6955eb]"
              onClick={handleCreateSalle}
            >
              {loading ? "Creation..." : "Creer la salle"}
            </Button>
          </div>
        )}

        {step === "members" && entityId && (
          <div className="mt-6">
            <h3 className="mb-4 text-base font-semibold">Gerer les membres</h3>

            <div className="mb-5 flex items-stretch gap-3">
              <div className="flex flex-1 overflow-hidden rounded-2xl border border-[#363636] bg-transparent">
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Entrer l'adresse email"
                  className="h-11 flex-1 border-0 bg-transparent text-sm placeholder:text-[#7C7C7C] focus-visible:ring-0"
                />
                <div className="flex items-center border-l border-[#363636]">
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value as MemberRole)}
                    className="h-11 bg-transparent px-3 text-sm outline-none"
                  >
                    {MemberRoleEnum.options.map((option) => (
                      <option
                        key={option}
                        value={option}
                        className="bg-[#151515] text-sm"
                      >
                        {option.charAt(0) + option.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="button"
                disabled={loading}
                className="h-11 rounded-2xl bg-[#7C6BF5] px-6 text-sm font-medium hover:bg-[#6955eb]"
                onClick={handleSubmitMember}
              >
                {editingMember ? "Mettre a jour" : "Ajouter"}
              </Button>
            </div>

            <div className="space-y-3">
              {members.map((member) => {
                const user = getMemberUser(member);
                const firstname = typeof user.firstname === "string" ? user.firstname : "";
                const lastname = typeof user.lastname === "string" ? user.lastname : "";
                const memberEmail = typeof user.email === "string" ? user.email : "";

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-full bg-white/2 px-4 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B4C7A] text-xs font-semibold">
                        {(firstname || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">
                        {firstname} {lastname} ({memberEmail})
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[#CCCCCC]">
                        {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                      </span>

                      <button
                        type="button"
                        className="opacity-80 hover:opacity-100"
                        onClick={() => handleEdit(member)}
                        title="Modifier"
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        className="opacity-80 hover:opacity-100"
                        onClick={() => handleDelete(member)}
                        title="Supprimer"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {members.length === 0 && (
                <p className="text-xs text-[#9A9A9A]">Aucun membre pour le moment.</p>
              )}
            </div>

            <div className="mt-8">
              <ShareRoom entityId={entityId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

