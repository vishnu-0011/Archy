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

  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    // 1. Fetch Basic Info
    const repoResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}`, { headers });
    if (!repoResponse.ok) {
        if (repoResponse.status === 404) throw new Error("Repository not found or is private. Provide a Personal Access Token in settings if it's private.");
        if (repoResponse.status === 403) throw new Error("GitHub API Rate limit exceeded. Please provide a Personal Access Token in settings.");
        throw new Error(`GitHub API Error: ${repoResponse.statusText}`);
    }
    const repoData = await repoResponse.json();

    // 2. Fetch Languages
    const langResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}/languages`, { headers });
    const languages = await langResponse.json();
    const topLanguages = Object.keys(languages).slice(0, 5).join(", ");

    // 3. Fetch Root Contents (Recursive for better depth if possible, but keep it light)
    const contentsResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}/contents`, { headers });
    const contents = await contentsResponse.json();
    
    let readmeContent = "";
    let dependencyFileContent = "";
    let structure = "";

    if (Array.isArray(contents)) {
      structure = contents.map((item: any) => `- ${item.name} (${item.type})`).join("\n");

      // Try to find README
      const readme = contents.find((f: any) => f.name.toLowerCase().startsWith("readme"));
      if (readme && readme.download_url) {
        const r = await fetch(readme.download_url, { headers });
        const text = await r.text();
        readmeContent = text.slice(0, 5000); // Limit size
      }

      // Try to find Dependency Files
      const depFiles = ["package.json", "go.mod", "requirements.txt", "pom.xml", "Cargo.toml", "pyproject.toml", "Gemfile"];
      const depFile = contents.find((f: any) => depFiles.includes(f.name));
      
      if (depFile && depFile.download_url) {
        const d = await fetch(depFile.download_url, { headers });
        dependencyFileContent = await d.text();
      }
    }

    const summary = `
Repository: ${owner}/${repo}
Description: ${repoData.description || "No description"}
Primary Languages: ${topLanguages}
Stars: ${repoData.stargazers_count} | Forks: ${repoData.forks_count}

File Structure (Root):
${structure}

Primary Dependency File (${owner}/${repo}):
${dependencyFileContent.slice(0, 1500)}

README Content (Context):
${readmeContent}
    `.trim();

    return { owner, repo, summary };

  } catch (error: any) {
    console.error("GitHub Fetch Error:", error);
    throw error;
  }
};