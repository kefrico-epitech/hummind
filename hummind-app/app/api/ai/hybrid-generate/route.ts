import { NextResponse } from "next/server";
import { CourseGenerationError, generateCourseActions } from "../../../../src/lib/ai/courseGeneration";
import { requireAuth } from "../../../../src/lib/server/requireAuth";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const result = await generateCourseActions(body, { requireDocument: true });
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof CourseGenerationError) {
      return NextResponse.json(
        { error: err.message, details: err.details ?? null },
        { status: err.status },
      );
    }

    return NextResponse.json(
      {
        error: "Erreur IA",
        details: String(err instanceof Error ? err.message : err),
      },
      { status: 500 },
    );
  }
}
