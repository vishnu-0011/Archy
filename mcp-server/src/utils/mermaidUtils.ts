/**
 * Utilities for working with Mermaid diagrams and external rendering services.
 * BROWSER-SAFE VERSION: No fs, path, or zlib.
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
  cleaned = cleaned.replace(/([-.]+(?:>|--&gt;|o))\s*\|(.+?)\|/g, (match, arrow, label) => {
    const trimmedLabel = label.trim();
    if (trimmedLabel.startsWith('"') && trimmedLabel.endsWith('"')) {
      const standardArrow = arrow.replace('--&gt;', '-->');
      return `${standardArrow}|${trimmedLabel}|`;
    }
    const standardArrow = arrow.replace('--&gt;', '-->');
    return `${standardArrow}|"${trimmedLabel}"|`;
  });
  
  cleaned = cleaned.replace(/--&gt;/g, '-->');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&amp;/g, '&');
  
  return cleaned;
};

/**
 * Generates a mermaid.ink image URL for a given mermaid code string.
 * Browser-compatible implementation using btoa for base64 encoding.
 */
export const getMermaidImageUrl = (mermaidCode: string, themeId: keyof typeof THEMES = 'dark'): string => {
  try {
    const themeConfig = THEMES[themeId] || THEMES.dark;
    const styledCode = mermaidCode.trim();
    
    // Browser-safe base64 encoding
    // Use unescape(encodeURIComponent()) to handle non-latin1 characters correctly
    const base64 = btoa(unescape(encodeURIComponent(styledCode)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const bgColor = themeConfig.bg.replace('#', '');
    return `https://mermaid.ink/img/${base64}?theme=${themeConfig.config.theme}&bgColor=${bgColor}`;
  } catch (error) {
    console.error('[Archy] Error generating image URL:', error);
    return '';
  }
};
