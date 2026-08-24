export interface GithubLanguage {
  name: string;
  color: string;
  percentage: number;
}

export interface GithubHeatmapDay {
  date: string;
  count: number;
  level: number;
}

export interface GithubStats {
  login: string;
  totalRepos: number;
  totalStars: number;
  totalContributions: number;
  topLanguages: GithubLanguage[];
  weeks: GithubHeatmapDay[][];
  generatedAt: string | null;
}
