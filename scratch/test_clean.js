const cleanMermaidCode = (code) => {
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

const testCode = `
graph TD
    User -->|HTTPS/REST (JSON)| WebApp
    WebApp -->|HTTPS/REST (JSON)| APIGateway
    OrderService -->|JDBC/PostgreSQL Connection Pool| PostgreSQL
    ProductService --> |"Already Quoted"| DB
    Notification --> |SimpleLabel| Service
`;

console.log("Original:");
console.log(testCode);
console.log("\nCleaned:");
console.log(cleanMermaidCode(testCode));
