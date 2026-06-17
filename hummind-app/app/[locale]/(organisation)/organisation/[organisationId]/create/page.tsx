"use client";

import RecordEntityModal from "../../../../../../src/components/user/common/form/RecordEntityModal";
import { useParams } from "next/dist/client/components/navigation";

export default function RecordPage() {
  const { organisationId } = useParams<{ organisationId: string }>();

  return (
    <RecordEntityModal
      type="departement"
      parentId={organisationId}
      backTo={null}
    />
  );
}
