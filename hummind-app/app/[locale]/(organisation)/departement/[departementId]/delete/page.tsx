"use client";

import DeleteOrgModal from "../../../../../../src/components/user/organisation/DeleteOrgModal";
import { useParams, useRouter } from "next/navigation";

export default function DeletePage() {
  const { departementId } = useParams<{ departementId: string }>();
  const router = useRouter();

  return (
    <DeleteOrgModal
      id={departementId}
      onClose={() => router.back()}
      onDeleted={() => router.replace("/organisation")}
    />
  );
}
