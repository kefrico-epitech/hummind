"use client";

import MemberSalleModal from "../../../../../../src/components/user/salle/MemberSalleModal";
import { useParams, useRouter } from "next/navigation";

export default function MembersPage() {
  const { salleId } = useParams<{ salleId: string }>();
  const router = useRouter();

  return <MemberSalleModal id={salleId} onClose={() => router.back()} />;
}
