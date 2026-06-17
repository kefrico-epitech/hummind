// types/pdf-text-extract.d.ts
declare module "pdf-text-extract" {
    export default function extract(
        filePath: string,
        callback: (err: any, pages: string[]) => void
    ): void;
}