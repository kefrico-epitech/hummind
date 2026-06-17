"use client";

import RecordSalleModal from "../../../../../../src/components/user/common/form/RecordSalleModal";
import { useParams } from "next/navigation";

export default function RecordPage() {
  const { independantId } = useParams<{ independantId: string }>();

  return <RecordSalleModal type="INDEPENDANT" parentId={independantId} />;
}
