"use client";

import MembersOrgModal from "../../../../../../src/components/user/organisation/MembersOrgModal";
import { useParams, useRouter } from "next/navigation";

export default function MembersPage() {
  const { departementId } = useParams<{ departementId: string }>();
  const router = useRouter();

  return <MembersOrgModal id={departementId} onClose={() => router.back()} />;
}
