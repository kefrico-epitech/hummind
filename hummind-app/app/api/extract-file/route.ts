import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { marked } from "marked";
import extract from "pdf-text-extract";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { requireAuth } from "../../../src/lib/server/requireAuth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Créer un fichier temporaire
  const tmpPath = path.join(os.tmpdir(), `upload-${Date.now()}.pdf`);
  await fs.writeFile(tmpPath, buffer);

  return new Promise((resolve, reject) => {
    extract(tmpPath, (err: any, pages: string[]) => {
      fs.unlink(tmpPath).catch(() => { }); // nettoyer le fichier
      if (err) return reject(err);
      resolve(pages.join("\n"));
    });
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No valid file provided" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let content = "";

    if (ext === "pdf") {
      content = await extractPdfText(buffer);
    } else if (ext === "docx") {
      const { value } = await mammoth.extractRawText({ buffer });
      content = value;
    } else if (ext === "txt") {
      content = buffer.toString("utf-8");
    } else if (ext === "md") {
      const raw = buffer.toString("utf-8");
      content = await marked(raw);
    } else {
      return NextResponse.json({ error: "Unsupported file format" }, { status: 400 });
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "No extractable content found" }, { status: 422 });
    }

    return NextResponse.json({ content });

  } catch (err: unknown) {
    console.error("❌ Extraction error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}