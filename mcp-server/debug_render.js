import { Buffer } from 'buffer';

const cleanMermaidCode = (code) => {
  let cleaned = code;
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

const getMermaidImageUrl = (mermaidCode) => {
    const styledCode = mermaidCode.trim();
    const base64 = Buffer.from(styledCode).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return `https://mermaid.ink/img/${base64}?theme=base&bgColor=0d1117`;
};

const code = `graph TD
    classDef client fill:#e0f2f1,stroke:#00796b,stroke-width:2px;
    classDef gateway fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    classDef service fill:#e3f2fd,stroke:#2196f3,stroke-width:2px;
    classDef db fill:#fce4ec,stroke:#d81b60,stroke-width:2px;
    classDef storage fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px;
    classDef external fill:#eceff1,stroke:#607d8b,stroke-width:2px;

    subgraph Tier_Frontend
        User([End User]):::client
    end

    subgraph Tier_API
        CF{{CloudFront}}:::gateway
        LE[Lambda@Edge]:::service
        APIGW_A[API Gateway (Region A)]:::gateway
        APIGW_B[API Gateway (Region B)]:::gateway
    end

    subgraph Tier_Services
        Lambda_A[Lambda Function (Region A)]:::service
        Lambda_B[Lambda Function (Region B)]:::service
    end

    subgraph Tier_Data
        DDB_Global[(DynamoDB Global Table)]:::db
    end

    User -->|HTTPS Request| CF
    CF -->|Invoke| LE
    LE -->|Route based on latency| APIGW_A
    LE -->|Route based on latency| APIGW_B

    APIGW_A -->|REST/HTTP| Lambda_A
    APIGW_B -->|REST/HTTP| Lambda_B

    Lambda_A -->|Query /users| DDB_Global
    Lambda_B -->|Query /users| DDB_Global

    DDB_Global --o|"Replicate data {10ms}"| DDB_Global`;

const cleaned = cleanMermaidCode(code);
console.log('--- CLEANED CODE ---');
console.log(cleaned);
console.log('--- URL ---');
console.log(getMermaidImageUrl(cleaned));
