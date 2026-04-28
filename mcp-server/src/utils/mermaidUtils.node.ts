import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";
import { THEMES, cleanMermaidCode } from "./mermaidUtils.js";
export { THEMES, cleanMermaidCode };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.resolve(__dirname, "../../mermaid_error.log");

/**
 * Generates a Kroki.io image URL for a given mermaid code string.
 * Kroki uses zlib compression (deflate) + base64url which handles long diagrams better.
 * NODE-ONLY: Uses zlib.
 */
export const getKrokiImageUrl = (mermaidCode: string, format: 'svg' | 'png' = 'png'): string => {
  try {
    const cleanedCode = cleanMermaidCode(mermaidCode);
    const compressed = zlib.deflateSync(cleanedCode, { level: 9 });
    const base64url = compressed.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return `https://kroki.io/mermaid/${format}/${base64url}`;
  } catch (error) {
    console.error('[Archy] Error generating Kroki URL:', error);
    return '';
  }
};

/**
 * Fetches the rendered image from mermaid.ink and returns it as a base64 string.
 * NODE-ONLY: Uses fs, path, Buffer.
 */
export const getMermaidImageBase64 = async (
  mermaidCode: string,
  themeId: keyof typeof THEMES = 'dark'
): Promise<{ data: string; mimeType: string } | null> => {
  let url = '';
  try {
    // Attempt Kroki first
    url = getKrokiImageUrl(mermaidCode, 'png');
    if (!url) return null;

    let response = await fetch(url, {
      headers: {
        'User-Agent': `ArchMind-MCP/${process.env.npm_package_version || '1.2.3'}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      const logMsg = `[${new Date().toISOString()}] URL: ${url}\nStatus: ${response.status}\nBody: ${errorText}\n\n`;
      try {
        fs.appendFileSync(LOG_FILE, logMsg);
      } catch (e) {
        console.error(`[Archy] Failed to write to log file: ${e}`);
      }
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Img = Buffer.from(arrayBuffer).toString("base64");

    return { data: base64Img, mimeType: "image/png" };
  } catch (error: any) {
    console.error(`[Archy] Fatal error fetching/processing image:`, error);
    return null;
  }
};
