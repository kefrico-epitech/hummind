import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { NextResponse } from "next/server";
import {
  renderManualDocumentHtml,
  type ManualDocumentMeta,
  type ManualRenderableModule,
} from "../../../../src/lib/course/manualDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

const BROWSER_CANDIDATES =
  process.platform === "win32"
    ? [
        process.env.PDF_BROWSER_PATH,
        process.env.CHROME_PATH,
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      ]
    : [
        process.env.PDF_BROWSER_PATH,
        process.env.CHROME_PATH,
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/snap/bin/chromium",
      ];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeFileName(input: string) {
  return (input.trim() || "cours")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

async function resolveBrowserExecutable() {
  for (const candidate of BROWSER_CANDIDATES) {
    if (!candidate) continue;

    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue trying other paths.
    }
  }

  throw new Error("Aucun navigateur compatible n'a ete trouve pour generer le PDF.");
}

function normalizeMeta(raw: unknown): ManualDocumentMeta {
  if (!isObject(raw)) {
    return { title: "Cours sans titre" };
  }

  return {
    title: typeof raw.title === "string" ? raw.title : "Cours sans titre",
    description: typeof raw.description === "string" ? raw.description : undefined,
    domain: typeof raw.domain === "string" ? raw.domain : undefined,
    level: typeof raw.level === "string" ? raw.level : undefined,
    objectives: Array.isArray(raw.objectives)
      ? raw.objectives.filter((item): item is string => typeof item === "string")
      : undefined,
  };
}

function normalizeModules(raw: unknown): ManualRenderableModule[] {
  return Array.isArray(raw) ? (raw as ManualRenderableModule[]) : [];
}

export async function POST(request: Request) {
  let tempDir = "";

  try {
    const body = (await request.json()) as { meta?: unknown; modules?: unknown };
    const meta = normalizeMeta(body.meta);
    const modules = normalizeModules(body.modules);
    const html = renderManualDocumentHtml(meta, modules);
    const fileNameBase = sanitizeFileName(meta.title);

    const browserExecutable = await resolveBrowserExecutable();
    tempDir = await mkdtemp(path.join(os.tmpdir(), "hummind-manual-pdf-"));

    const htmlPath = path.join(tempDir, "manual.html");
    const pdfPath = path.join(tempDir, `${fileNameBase || "cours"}-manuel.pdf`);
    const profileDir = path.join(tempDir, "chrome-profile");

    await writeFile(htmlPath, html, "utf8");

    await execFileAsync(
      browserExecutable,
      [
        "--headless=new",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-sync",
        "--no-first-run",
        "--no-default-browser-check",
        "--allow-file-access-from-files",
        `--user-data-dir=${profileDir}`,
        `--print-to-pdf=${pdfPath}`,
        "--print-to-pdf-no-header",
        pathToFileURL(htmlPath).href,
      ],
      {
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    const pdfBuffer = await readFile(pdfPath);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileNameBase || "cours"}-manuel.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation du PDF impossible.";

    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
