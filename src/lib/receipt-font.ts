import fs from "fs";
import path from "path";
import type { jsPDF } from "jspdf";

const FONT_CANDIDATES = [
  path.join(process.cwd(), "public", "fonts", "Arial.ttf"),
  path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf"),
  path.join(process.cwd(), "public", "fonts", "DejaVuSansCondensed.ttf"),
  path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf"),
  path.join(process.cwd(), "public", "fonts", "LiberationSans-Regular.ttf"),
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf",
  "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/Library/Fonts/Arial.ttf",
];

export function getReceiptFont(doc: jsPDF): string {
  for (const fontPath of FONT_CANDIDATES) {
    try {
      if (!fs.existsSync(fontPath)) continue;

      const trimmedName = path.basename(fontPath).replace(/\.[^.]+$/, "");
      const fontAlias = `receipt-font-${trimmedName}`;
      const fontData = fs.readFileSync(fontPath);

      // jsPDF accepts a binary/encoded string in the VFS and then registers a name alias.
      doc.addFileToVFS(fontAlias, fontData.toString("base64"));
      doc.addFont(fontAlias, fontAlias, "normal");
      doc.addFont(fontAlias, fontAlias, "bold");
      return fontAlias;
    } catch {
      // Ignore unreadable or unsupported font files and try the next candidate.
    }
  }

  return "helvetica";
}
