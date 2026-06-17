import { NextResponse } from "next/server";
import { openai } from "../../../../src/lib/openai";
import { requireAuth } from "../../../../src/lib/server/requireAuth";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
    const response = await openai.responses.create({
        model: "gpt-5.2",
        input: "Réponds uniquement par le mot : OK",
    });

    return NextResponse.json({
        result: response.output_text,
    });
}
