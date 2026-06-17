"use client";

import MembersOrgModal from "../../../../../../src/components/user/organisation/MembersOrgModal";
import { useParams, useRouter } from "next/navigation";

export default function MembersPage() {
  const { organisationId } = useParams<{ organisationId: string }>();
  const router = useRouter();

  return <MembersOrgModal id={organisationId} onClose={() => router.back()} />;
}
