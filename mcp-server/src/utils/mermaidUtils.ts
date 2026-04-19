import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.resolve(__dirname, "../../mermaid_error.log");

/**
 * Utilities for working with Mermaid diagrams and external rendering services.
 */

export const THEMES = {
  original: {
    name: 'Original',
    bg: '#ffffff',
    config: {
      theme: 'default',
      themeVariables: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
      }
    }
  },
  dark: {
    name: 'Cyberpunk',
    bg: '#0d1117',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#0d1117',
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#6366f1',
        lineColor: '#94a3b8',
        mainBkg: '#0d1117'
      }
    }
  },
  blueprint: {
    name: 'Blueprint',
    bg: '#1e3a8a',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#1e3a8a',
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        mainBkg: '#1e3a8a',
        primaryColor: '#172554',
        primaryTextColor: '#bfdbfe',
        lineColor: '#60a5fa',
        primaryBorderColor: '#60a5fa'
      }
    }
  },
  terminal: {
    name: 'Hacker Terminal',
    bg: '#0c0c0c',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#0c0c0c',
        fontFamily: '"Fira Code", monospace',
        fontSize: '18px',
        primaryColor: '#000000',
        primaryTextColor: '#00ff41',
        primaryBorderColor: '#00ff41',
        lineColor: '#008F11'
      }
    }
  },
  synthwave: {
    name: 'Synthwave',
    bg: '#2b213a',
    config: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#2b213a',
        fontFamily: '"Rajdhani", sans-serif',
        fontSize: '18px',
        primaryColor: '#2b213a',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#ff00ff',
        lineColor: '#00ffff'
      }
    }
  }
};

/**
 * Cleans and sanitizes Mermaid code to ensure it's compatible with rendering services.
 * Specifically handles quoting of edge labels that contain special characters.
 */
export const cleanMermaidCode = (code: string): string => {
  let cleaned = code;
  
  // Quote edge labels to ensure special characters like ( ) / { } aren't misinterpreted
  // Match: -->|label|, --&gt;|label|, -.->|label|, --o|label|
  // We use a more flexible regex to handle optional spaces around the arrows
  cleaned = cleaned.replace(/([-.]+(?:>|--&gt;|o))\s*\|(.+?)\|/g, (match, arrow, label) => {
    const trimmedLabel = label.trim();
    // Only wrap in quotes if not already quoted
    if (trimmedLabel.startsWith('"') && trimmedLabel.endsWith('"')) {
      const standardArrow = arrow.replace('--&gt;', '-->');
      return `${standardArrow}|${trimmedLabel}|`;
    }
    const standardArrow = arrow.replace('--&gt;', '-->');
    return `${standardArrow}|"${trimmedLabel}"|`;
  });
  
  // Cleanup other entities and ensure consistent arrows
  cleaned = cleaned.replace(/--&gt;/g, '-->');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&amp;/g, '&');
  
  return cleaned;
};

/**
 * Generates a Kroki.io image URL for a given mermaid code string.
 * Kroki uses zlib compression (deflate) + base64url which handles long diagrams better.
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
 * Generates a mermaid.ink image URL for a given mermaid code string.
 */
export const getMermaidImageUrl = (mermaidCode: string, themeId: keyof typeof THEMES = 'dark'): string => {
  try {
    const themeConfig = THEMES[themeId] || THEMES.dark;
    
    // We'll keep it simple to ensure mermaid.ink can parse it. 
    // Complex styling often causes 400 errors if not compressed properly.
    const styledCode = mermaidCode.trim();
    
    const base64 = Buffer.from(styledCode).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Pass the background color directly to mermaid.ink to avoid white edges
    const bgColor = themeConfig.bg.replace('#', '');
    const url = `https://mermaid.ink/img/${base64}?theme=${themeConfig.config.theme}&bgColor=${bgColor}`;
    console.error(`[Archy] Generated URL for theme ${themeId}: ${url}`);
    return url;
  } catch (error) {
    console.error('[Archy] Error generating image URL:', error);
    return '';
  }
};

/**
 * Fetches the rendered image from mermaid.ink and returns it as a base64 string.
 */
export const getMermaidImageBase64 = async (
  mermaidCode: string,
  themeId: keyof typeof THEMES = 'dark'
): Promise<{ data: string; mimeType: string } | null> => {
  let url = '';
  try {
    // Attempt Kroki first as it's more robust for large diagrams
    url = getKrokiImageUrl(mermaidCode, 'png');
    if (!url) return null;

    let response = await fetch(url, {
      headers: {
        'User-Agent': `ArchMind-MCP/${process.env.npm_package_version || '1.2.3'}`
      }
    });

    // Fallback to mermaid.ink if Kroki fails (e.g. rate limit or downtime)
    if (!response.ok) {
      console.warn(`[Archy] Kroki failed (${response.status}), falling back to mermaid.ink`);
      url = getMermaidImageUrl(mermaidCode, themeId);
      if (url) {
        response = await fetch(url, {
          headers: {
            'User-Agent': `ArchMind-MCP/${process.env.npm_package_version || '1.2.3'}`
          }
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      const logMsg = `[${new Date().toISOString()}] URL: ${url}\nStatus: ${response.status}\nBody: ${errorText}\n\n`;
      try {
        fs.appendFileSync(LOG_FILE, logMsg);
      } catch (e) {
        console.error(`[Archy] Failed to write to log file: ${e}`);
      }
      console.error(`[Archy] mermaid.ink returned ${response.status} ${response.statusText}`);
      console.error(`[Archy] Error Body: ${errorText}`);
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}. Response: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Img = Buffer.from(arrayBuffer).toString("base64");

    return { data: base64Img, mimeType: "image/png" };
  } catch (error: any) {
    console.error(`[Archy] Fatal error fetching/processing image:`, error);
    return null;
  }
};
