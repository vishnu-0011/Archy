import { getMermaidImageBase64 } from "../src/utils/mermaidUtils.js";
import fs from "fs";
import path from "path";

async function testRendering() {
  const code = `graph TD
    classDef client fill:#bbf,stroke:#333,stroke-width:2px,color:#000;
    classDef gateway fill:#f9f,stroke:#333,stroke-width:2px,color:#000;
    classDef service fill:#ccf,stroke:#333,stroke-width:2px,color:#000;
    classDef db fill:#fcf,stroke:#333,stroke-width:2px,color:#000;
    classDef storage fill:#fcf,stroke:#333,stroke-width:2px,color:#000;
    classDef external fill:#cfc,stroke:#333,stroke-width:2px,color:#000;

    subgraph Tier_Frontend
        User([End User]):::client
        NextJS[Next.js Frontend App]:::client
    end

    subgraph Tier_Data_Cache
        Redis[(Redis Cache)]:::db
    end

    subgraph Tier_Blockchain_Layer
        Ethereum[(Ethereum Blockchain)]:::external
        subgraph Smart_Contracts
            Vault[Vault Smart Contract]:::service
            LendingPool[LendingPool Smart Contract]:::service
            PriceOracle[PriceOracle Smart Contract]:::service
        end
    end

    User -->|"Browser/HTTP"| NextJS
    NextJS -->|"Read/Write Cache"| Redis
    NextJS -->|"Web3.js/Ethers.js (Read)"| PriceOracle
    NextJS -->|"Web3.js/Ethers.js (Transact)"| Vault
    NextJS -->|"Web3.js/Ethers.js (Transact)"| LendingPool

    Vault --o|"ERC-20/ERC-721 Interaction"| LendingPool
    LendingPool -->|"Get Asset Price"| PriceOracle
    PriceOracle -->|"Fetch On-chain Data"| Ethereum

    Vault --o|"Deploy/State Changes"| Ethereum
    LendingPool --o|"Deploy/State Changes"| Ethereum
    PriceOracle --o|"Deploy/State Changes"| Ethereum`;
  
  console.log("Testing Mermaid rendering via mermaid.ink...");
  const result = await getMermaidImageBase64(code, "dark");
  
  if (result) {
    console.log("✅ Rendering successful!");
    const buffer = Buffer.from(result.data, "base64");
    const outPath = path.resolve("./test-diagram.png");
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved test image to: ${outPath}`);
  } else {
    console.error("❌ Rendering failed. Check if mermaid.ink is accessible or the encoding is wrong.");
  }
}

testRendering();
