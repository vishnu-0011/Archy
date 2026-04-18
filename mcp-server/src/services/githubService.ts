interface RepoContext {
  owner: string;
  repo: string;
  summary: string;
}

const GITHUB_API_BASE = "https://api.github.com/repos";

export const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const cleanUrl = url.trim();
    // Support both full URLs and owner/repo shorthand
    if (cleanUrl.split('/').length === 2 && !cleanUrl.includes('.')) {
        const [owner, repo] = cleanUrl.split('/');
        return { owner, repo };
    }

    const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    if (!urlObj.hostname.includes("github.com")) return null;
    const parts = urlObj.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch (e) {
    return null;
  }
};

export const fetchRepoContext = async (url: string, token?: string): Promise<RepoContext> => {
  const meta = parseGitHubUrl(url);
  if (!meta) throw new Error("Invalid GitHub URL or format (use 'owner/repo' or full URL)");
  const { owner, repo } = meta;

  const apiHeaders: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (token) {
    apiHeaders['Authorization'] = `token ${token}`;
  }

  // Simple headers for raw content fetches to avoid CORS preflight issues with custom Accept headers
  const rawHeaders: HeadersInit = token ? { 'Authorization': `token ${token}` } : {};

  try {
    // 1. Fetch Basic Info
    const repoResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}`, { headers: apiHeaders });
    if (!repoResponse.ok) {
        if (repoResponse.status === 404) throw new Error("Repository not found or is private. Provide a Personal Access Token in settings if it's private.");
        if (repoResponse.status === 403) throw new Error("GitHub API Rate limit exceeded. Please provide a Personal Access Token in settings.");
        throw new Error(`GitHub API Error: ${repoResponse.statusText}`);
    }
    const repoData = await repoResponse.json();

    // 2. Fetch Languages (Non-critical, wrap in silent catch)
    let topLanguages = "Unknown";
    try {
        const langResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}/languages`, { headers: apiHeaders });
        if (langResponse.ok) {
            const languages = await langResponse.json();
            topLanguages = Object.keys(languages).slice(0, 5).join(", ");
        }
    } catch (e) { console.warn("Failed to fetch languages", e); }

    // 3. Fetch Root Contents
    const contentsResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}/contents`, { headers: apiHeaders });
    if (!contentsResponse.ok) throw new Error("Could not fetch repository contents.");
    const contents = await contentsResponse.json();
    
    let readmeContent = "";
    let dependencyFileContent = "";
    let structure = "";

    if (Array.isArray(contents)) {
      structure = contents.map((item: any) => `- ${item.name} (${item.type})`).join("\n");

      // Try to find README (Granular try/catch to prevent total failure on CORS/Network issues)
      const readme = contents.find((f: any) => f.name.toLowerCase().startsWith("readme"));
      if (readme && readme.download_url) {
        try {
            const r = await fetch(readme.download_url, { headers: rawHeaders });
            if (r.ok) {
                const text = await r.text();
                readmeContent = text.slice(0, 5000); 
            }
        } catch (e) {
            console.warn("Failed to fetch README content:", e);
            readmeContent = "[README content unavailable due to fetch error]";
        }
      }

      // Try to find Dependency Files
      const depFiles = ["package.json", "go.mod", "requirements.txt", "pom.xml", "Cargo.toml", "pyproject.toml", "Gemfile"];
      const depFile = contents.find((f: any) => depFiles.includes(f.name));
      
      if (depFile && depFile.download_url) {
        try {
            const d = await fetch(depFile.download_url, { headers: rawHeaders });
            if (d.ok) {
                const content = await d.text();
                dependencyFileContent = content.slice(0, 1500);
            }
        } catch (e) {
            console.warn("Failed to fetch dependency file:", e);
            dependencyFileContent = "[Dependency file unavailable due to fetch error]";
        }
      }
    }

    const summary = `
Repository: ${owner}/${repo}
Description: ${repoData.description || "No description"}
Primary Languages: ${topLanguages}
Stars: ${repoData.stargazers_count} | Forks: ${repoData.forks_count}

File Structure (Root):
${structure}

Primary Dependency Context:
${dependencyFileContent}

README Content (Context):
${readmeContent}
    `.trim();

    return { owner, repo, summary };

  } catch (error: any) {
    console.error("GitHub Fetch Error Details:", error);
    // Re-throw with a more user-friendly message if it's a generic "Failed to fetch"
    if (error.message === "Failed to fetch") {
        throw new Error("Network error: Could not connect to GitHub. This may be due to CORS restrictions or your internet connection.");
    }
    throw error;
  }
};