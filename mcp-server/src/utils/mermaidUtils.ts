/**
 * Utilities for working with Mermaid diagrams and external rendering services.
 */

/**
 * Generates a mermaid.ink image URL for a given mermaid code string.
 * @param mermaidCode The raw mermaid diagram code.
 * @param isDarkMode Whether to use the dark theme for the image.
 * @returns A URL string pointing to the rendered image.
 */
export const getMermaidImageUrl = (mermaidCode: string, isDarkMode: boolean = true): string => {
  try {
    const trimmedCode = mermaidCode.trim();
    let base64 = "";

    // Environment-agnostic Base64 encoding
    if (typeof btoa === 'function') {
      base64 = btoa(unescape(encodeURIComponent(trimmedCode)));
    } else if (typeof Buffer !== 'undefined') {
      base64 = Buffer.from(trimmedCode).toString('base64');
    } else {
      throw new Error('No Base64 encoding method available');
    }

    const theme = isDarkMode ? 'dark' : 'default';
    return `https://mermaid.ink/img/${base64}?theme=${theme}`;
  } catch (error) {
    console.error('Error encoding mermaid code for image URL:', error);
    return '';
  }
};

