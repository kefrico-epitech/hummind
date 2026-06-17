"use client";

import DeleteOrgModal from "../../../../../../src/components/user/organisation/DeleteOrgModal";
import { useParams, useRouter } from "next/navigation";

export default function DeletePage() {
  const { organisationId } = useParams<{ organisationId: string }>();
  const router = useRouter();

  return (
    <DeleteOrgModal
      id={organisationId}
      onClose={() => router.back()}
      onDeleted={() => router.replace("/user/organisation")}
    />
  );
}
