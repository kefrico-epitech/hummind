"use client";

import RecordCourseModalV2 from "../../../../../../src/components/course/RecordCourseModalV2";
import { useParams } from "next/navigation";

export default function RecordPage() {
  const { courseId } = useParams<{ courseId: string }>();

  return <RecordCourseModalV2 courseId={courseId} mode="edition" />;
}
