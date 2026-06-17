"use client";

import EditSalleModal from "../../../../../../src/components/user/salle/EditSalleModal";
import { useParams, useRouter } from "next/navigation";

export default function EditPage() {
  const { salleId } = useParams<{ salleId: string }>();
  const router = useRouter();

  return <EditSalleModal id={salleId} onClose={() => router.back()} />;
}
