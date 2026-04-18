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
    url = getMermaidImageUrl(mermaidCode, themeId);
    if (!url) return null;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Archy-MCP-Server/1.0.0'
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}. Response: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Img = Buffer.from(arrayBuffer).toString("base64");

    return { data: base64Img, mimeType: "image/png" };
  } catch (error) {
    console.error(`[Archy] Error fetching image base64 from ${url}:`, error);
    return null;
  }
};
