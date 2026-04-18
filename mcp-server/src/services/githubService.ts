const GITHUB_API_BASE = "https://api.github.com/repos";

interface RepoContext {
  owner: string;
  repo: string;
  summary: string;
}

export const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const cleanUrl = url.trim();
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

/**
 * Intelligent filter to find "architectural" files in a large tree.
 * Prioritizes entry points, services, controllers, and core logic.
 */
const getInterestingFiles = (tree: any[]): string[] => {
  const coreExtensions = ['.ts', '.js', '.dart', '.go', '.py', '.java', '.kt', '.rs'];
  const excludeFolders = ['node_modules', '.git', 'dist', 'build', 'ios', 'android', 'test', 'tests'];

  const filteredTree = tree.filter(item => {
    if (item.type !== 'blob') return false;
    const path = item.path.toLowerCase();
    
    // Ignore boilerplate/dist/test folders
    if (excludeFolders.some(folder => path.includes(`/${folder}/`) || path.startsWith(`${folder}/`))) return false;

    // Look for architectural keywords
    const isArchitectural = 
        path.includes('main.') || 
        path.includes('app.') || 
        path.includes('index.') ||
        path.includes('service') || 
        path.includes('controller') || 
        path.includes('router') || 
        path.includes('provider') || 
        path.includes('bloc') || 
        path.includes('api') ||
        path.includes('architecture.md') ||
        path.includes('blueprint.md');

    return isArchitectural && coreExtensions.some(ext => path.endsWith(ext) || path.endsWith('.md'));
  });

  // Sort by depth (shorter paths first as they are often more foundational) and limit
  return filteredTree
    .sort((a, b) => a.path.split('/').length - b.path.split('/').length)
    .slice(0, 15) // Get top 15 candidates
    .map(item => item.path);
};

export const fetchRepoContext = async (url: string, token?: string): Promise<RepoContext> => {
  const meta = parseGitHubUrl(url);
  if (!meta) throw new Error("Invalid GitHub URL or format");
  const { owner, repo } = meta;

  const apiHeaders: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ArchMind-Tool'
  };
  
  if (token) apiHeaders['Authorization'] = `token ${token}`;

  try {
    // 1. Fetch Basic Info to get default branch
    const repoResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}`, { headers: apiHeaders });
    if (!repoResponse.ok) throw new Error(`Repo Fetch Failed: ${repoResponse.statusText}`);
    const repoData = await repoResponse.json();
    const defaultBranch = repoData.default_branch || 'main';

    // 2. Fetch Recursive Tree
    const treeUrl = `${GITHUB_API_BASE}/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeResponse = await fetch(treeUrl, { headers: apiHeaders });
    if (!treeResponse.ok) throw new Error(`Tree Fetch Failed: ${treeResponse.statusText}`);
    const treeData = await treeResponse.json();
    const fullTree = treeData.tree || [];

    // 3. Selection of Interesting Files
    const interestingPaths = getInterestingFiles(fullTree);
    const structureSummary = fullTree
      .filter((item: any) => item.type === 'tree')
      .slice(0, 30) // Only top 30 directories to prevent bloat
      .map((item: any) => `- ${item.path}`)
      .join('\n');

    // 4. Fetch content for specific files (parallelized)
    const filesToFetch = [
        'README.md',
        'package.json',
        'go.mod',
        'requirements.txt',
        'pubspec.yaml', // Added pubspec for Flutter projects
        ...interestingPaths.slice(0, 5) // Top 5 interesting logic files
    ];

    const contextMap: Record<string, string> = {};
    
    await Promise.all(
      [...new Set(filesToFetch)].map(async (filePath) => {
        try {
          const contentUrl = `${GITHUB_API_BASE}/${owner}/${repo}/contents/${filePath}`;
          const res = await fetch(contentUrl, { headers: apiHeaders });
          if (res.ok) {
            const data = await res.json();
            if (data.content) {
                // Decode base64
                const content = Buffer.from(data.content, 'base64').toString('utf8');
                contextMap[filePath] = content.slice(0, 2000); // 2k characters per file limit
            }
          }
        } catch (e) { /* silent skip */ }
      })
    );

    let summary = `
REPOSITORY: ${owner}/${repo}
DESCRIPTION: ${repoData.description || "None"}
FILE STRUCTURE (OVERVIEW):
${structureSummary}

CORE CONTEXT FILES:
`;

    for (const [path, content] of Object.entries(contextMap)) {
      summary += `\n--- FILE: ${path} ---\n${content}\n`;
    }

    return { owner, repo, summary };

  } catch (error: any) {
    console.error("Deep Scan Error:", error);
    throw error;
  }
};