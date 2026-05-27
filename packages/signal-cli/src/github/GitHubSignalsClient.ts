export interface GitHubSignals {
  stars: number;
  watchers: number;
  forks: number;
  subscribers: number;
  defaultBranch: string;
  archived: boolean;
  contributorCount: number;
  releaseCount: number;
  openIssues: number;
  ageDays: number;
  pushedDaysAgo: number;
  raw?: unknown;
}

export interface GitHubClientOptions {
  token?: string;
  baseUrl?: string;
}

export class GitHubSignalsClient {
  readonly available: boolean;
  private readonly base: string;
  private readonly token?: string;

  constructor(opts: GitHubClientOptions = {}) {
    this.token = opts.token ?? process.env.GITHUB_TOKEN;
    this.base = opts.baseUrl ?? "https://api.github.com";
    this.available = !!this.token;
  }

  async fetchRepoSignals(owner: string, repo: string): Promise<GitHubSignals | null> {
    if (!this.available) return null;
    try {
      const [meta, contributorCount, releaseCount] = await Promise.all([
        this.fetchRepoMeta(owner, repo),
        this.fetchPagedCount(owner, repo, "/contributors?per_page=1&anon=true"),
        this.fetchPagedCount(owner, repo, "/releases?per_page=1"),
      ]);
      if (!meta) return null;
      const created = new Date(meta.created_at as string);
      const pushed = new Date(meta.pushed_at as string);
      const now = Date.now();
      return {
        stars: Number(meta.stargazers_count ?? 0),
        watchers: Number(meta.watchers_count ?? 0),
        forks: Number(meta.forks_count ?? 0),
        subscribers: Number(meta.subscribers_count ?? 0),
        defaultBranch: String(meta.default_branch ?? "main"),
        archived: Boolean(meta.archived),
        contributorCount,
        releaseCount,
        openIssues: Number(meta.open_issues_count ?? 0),
        ageDays: Math.max(0, Math.round((now - created.getTime()) / 86_400_000)),
        pushedDaysAgo: Math.max(0, Math.round((now - pushed.getTime()) / 86_400_000)),
        raw: meta,
      };
    } catch {
      return null;
    }
  }

  private async fetchRepoMeta(owner: string, repo: string): Promise<Record<string, unknown> | null> {
    const res = await this.get(`/repos/${owner}/${repo}`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  }

  private async fetchPagedCount(owner: string, repo: string, path: string): Promise<number> {
    const res = await this.get(`/repos/${owner}/${repo}${path}`);
    if (!res.ok) return 0;
    const link = res.headers.get("link") ?? "";
    const lastMatch = link.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
    if (lastMatch?.[1]) return Number(lastMatch[1]);
    // Single page — count items in body
    try {
      const body = (await res.json()) as unknown[];
      return Array.isArray(body) ? body.length : 0;
    } catch {
      return 0;
    }
  }

  private get(path: string): Promise<Response> {
    return fetch(`${this.base}${path}`, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "tucaken-signal/0.1",
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
      },
    });
  }
}

export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
  if (!m) return null;
  return { owner: m[1]!, repo: m[2]! };
}

export function parseGithubRemoteFromGit(remoteUrl: string): { owner: string; repo: string } | null {
  // Handle https://, git@, ssh://, with or without .git
  let m = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(\.git)?(?:\/)?$/);
  if (!m) return null;
  return { owner: m[1]!, repo: m[2]! };
}
