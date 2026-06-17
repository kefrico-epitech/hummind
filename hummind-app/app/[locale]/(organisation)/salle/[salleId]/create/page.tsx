"use client";

import RecordCourseModalV2 from "../../../../../../src/components/course/RecordCourseModalV2";
import { useParams } from "next/navigation";

export default function RecordPage() {
  const { salleId } = useParams<{ salleId: string }>();

  return <RecordCourseModalV2 parentId={salleId} />;
}
