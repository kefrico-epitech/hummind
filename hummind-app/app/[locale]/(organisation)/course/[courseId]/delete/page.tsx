"use client";

import DeleteOrgModal from "../../../../../../src/components/user/organisation/DeleteOrgModal";
import { useParams, useRouter } from "next/navigation";

export default function DeletePage() {
  const { salleId } = useParams<{ salleId: string }>();
  const router = useRouter();

  return (
    <DeleteOrgModal
      id={salleId}
      onClose={() => router.back()}
      onDeleted={() => router.replace("/user/organisation")}
    />
  );
}
