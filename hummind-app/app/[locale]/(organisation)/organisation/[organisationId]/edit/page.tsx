"use client";

import EditOrgModal from "../../../../../../src/components/user/organisation/EditOrgModal";
import { useParams, useRouter } from "next/navigation";

export default function EditPage() {
  const { organisationId } = useParams<{ organisationId: string }>();
  const router = useRouter();

  return <EditOrgModal id={organisationId} onClose={() => router.back()} />;
}
