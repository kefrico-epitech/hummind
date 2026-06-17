"use client";

import { useEffect, useState } from "react";
import { toast } from "../../../lib/notify";
import { Button } from "../../ui/button";
import { X, Trash2, Users } from "lucide-react";
import { EntityService } from "../../../services/entity.service";

interface DeleteOrgModalProps {
  id: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function DeleteOrgModal({
  id,
  onClose,
  onDeleted,
}: DeleteOrgModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDelete = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const res = await EntityService.delete(id);

      if (res.status !== 200 && res.status !== 204) {
        throw new Error(res.error || "Erreur lors de la suppression");
      }

      toast.success("Organisation supprimée définitivement");
      onDeleted?.();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer l’organisation",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-2xl rounded-[28px] bg-[#1A1A1A] p-6 text-white shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-white/50 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-2">
          Supprimer cette organisation ?
        </h2>

        <p className="text-white/60 mb-6">
          Cette action entraînera la suppression définitive de :
        </p>

        {/* Consequences */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-3 text-white/80">
            <Trash2 className="h-5 w-5 text-white/60 mt-0.5" />
            <p>
              Suppression des contenus tels que les départements, les salles
              indépendantes et associées, ainsi que les cours créés.
            </p>
          </div>

          <div className="flex gap-3 text-white/80">
            <Users className="h-5 w-5 text-white/60 mt-0.5" />
            <p>
              Accès des utilisateurs et des données supprimé ainsi que la
              progression des participants perdues.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-white/70 hover:text-white"
          >
            Annuler
          </Button>

          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6"
          >
            {loading ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

