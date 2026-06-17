"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "../../../lib/notify";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Pencil, Trash2, X } from "lucide-react";
import { EntityService } from "../../../services/entity.service";
import type { Member, MemberRole } from "../../../dto/usersdto";
import { MemberRoleEnum } from "../../../dto/usersdto";

interface MembersOrgModalProps {
  id: string;
  onClose: () => void;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erreur reseau";
}

function getMemberUser(member: Member): Record<string, unknown> {
  return member.user && typeof member.user === "object"
    ? (member.user as Record<string, unknown>)
    : {};
}

export default function MembersOrgModal({ id, onClose }: MembersOrgModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("ADMIN");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const fetchMembers = useCallback(async () => {
    const res = await EntityService.listMembers(id);
    if (res.data) {
      setMembers(res.data);
    } else {
      toast.error(res.error || "Impossible de charger les membres");
    }
  }, [id]);

  useEffect(() => {
    setIsMounted(true);
    void fetchMembers();
  }, [fetchMembers]);

  if (!isMounted) return null;

  const handleSubmitLine = async () => {
    if (!email.trim()) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }

    setLoading(true);
    try {
      if (editingMember) {
        const res = await EntityService.updateMemberRole(id, editingMember.id, role);
        if (res.data) {
          toast.success("Role mis a jour");
          await fetchMembers();
        } else {
          toast.error(res.error || "Erreur lors de la mise a jour");
        }
      } else {
        // Flow v2.0 — backend gère le dual-case en un seul appel et
        // renvoie requiresInvitation. Plus besoin du fallback ancien.
        const result = await EntityService.addMember(id, {
          email: email.trim().toLowerCase(),
          role,
        });

        if (result.error || !result.data) {
          toast.error(result.error || "Erreur lors de l'ajout du membre");
        } else if (result.data.requiresInvitation) {
          toast.success(
            `Compte créé et identifiants envoyés à ${email.trim()}. La personne recevra son mot de passe temporaire par email.`,
          );
          await fetchMembers();
        } else {
          toast.success("Membre ajouté");
          await fetchMembers();
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setEmail("");
      setRole("ADMIN");
      setEditingMember(null);
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
    setLoading(true);
    try {
      const res = await EntityService.deleteMember(id, member.id);
      if (res.status === 200) {
        toast.success("Membre supprime");
        await fetchMembers();
      } else {
        toast.error(res.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-[28px] bg-[#1A1A1A] p-6 text-white shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex-1 text-center text-lg font-semibold">
            Gerer les membres
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

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
            onClick={handleSubmitLine}
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
                    onClick={() => handleEdit(member)}
                    className="text-[#BDBDBD] hover:text-white"
                    disabled={loading}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(member)}
                    className="text-[#BDBDBD] hover:text-white"
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
      </div>
    </div>
  );
}

