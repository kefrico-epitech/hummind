"use client";

import RecordSalleModal from "../../../../../../src/components/user/common/form/RecordSalleModal";
import { useParams } from "next/navigation";

export default function RecordPage() {
    const { departementId } = useParams<{ departementId: string }>();
  
  return <RecordSalleModal parentId={departementId}/>;
}
