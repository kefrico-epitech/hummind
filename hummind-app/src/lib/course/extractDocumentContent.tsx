import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { marked } from "marked";

export async function extractDocumentContent(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";

    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      text +=
        content.items
          .map((item) => {
            const textItem = item as { str?: string };
            return textItem.str ?? "";
          })
          .join(" ") + "\n";
    }

    return text;
  }

  if (ext === "doc" || ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  }

  if (ext === "txt") {
    return file.text();
  }

  if (ext === "md") {
    const raw = await file.text();
    const html = marked(raw);
    return html;
  }

  throw new Error("Format non supporte");
}
