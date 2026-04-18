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
  // We use Base64 encoding for the mermaid code.
  // To handle Unicode correctly, we use the encodeURIComponent + escape pattern.
  try {
    const base64 = btoa(unescape(encodeURIComponent(mermaidCode.trim())));
    const theme = isDarkMode ? 'dark' : 'default';
    return `https://mermaid.ink/img/${base64}?theme=${theme}`;
  } catch (error) {
    console.error('Error encoding mermaid code for image URL:', error);
    return '';
  }
};
