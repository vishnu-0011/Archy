interface RepoContext {
  owner: string;
  repo: string;
  summary: string;
}

const GITHUB_API_BASE = "https://api.github.com/repos";

export const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== "github.com") return null;
    const parts = urlObj.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch (e) {
    return null;
  }
};

export const fetchRepoContext = async (url: string): Promise<RepoContext> => {
  const meta = parseGitHubUrl(url);
  if (!meta) throw new Error("Invalid GitHub URL");
  const { owner, repo } = meta;

  try {
    // 1. Fetch Basic Info
    const repoResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}`);
    if (!repoResponse.ok) throw new Error("Repository not found or private");
    const repoData = await repoResponse.json();

    // 2. Fetch Languages
    const langResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}/languages`);
    const languages = await langResponse.json();
    const topLanguages = Object.keys(languages).slice(0, 5).join(", ");

    // 3. Fetch Root Contents (to find README and config files)
    const contentsResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}/contents`);
    const contents = await contentsResponse.json();
    
    let readmeContent = "";
    let dependencyFileContent = "";
    let structure = "";

    if (Array.isArray(contents)) {
      structure = contents.map((item: any) => `- ${item.name} (${item.type})`).join("\n");

      // Try to find README
      const readme = contents.find((f: any) => f.name.toLowerCase().startsWith("readme"));
      if (readme && readme.download_url) {
        const r = await fetch(readme.download_url);
        const text = await r.text();
        readmeContent = text.slice(0, 5000); // Limit size
      }

      // Try to find Dependency Files (package.json, go.mod, etc.)
      const depFile = contents.find((f: any) => 
        ["package.json", "go.mod", "requirements.txt", "pom.xml", "Cargo.toml"].includes(f.name)
      );
      if (depFile && depFile.download_url) {
        const d = await fetch(depFile.download_url);
        dependencyFileContent = await d.text();
      }
    }

    const summary = `
Repository: ${owner}/${repo}
Description: ${repoData.description || "No description"}
Primary Languages: ${topLanguages}

File Structure (Root):
${structure}

Dependency / Config File Snippet:
${dependencyFileContent.slice(0, 1000)}

README Summary (First 5000 chars):
${readmeContent}
    `.trim();

    return { owner, repo, summary };

  } catch (error) {
    console.error("GitHub Fetch Error:", error);
    throw new Error("Failed to fetch repository data. Please ensure the repository is public.");
  }
};