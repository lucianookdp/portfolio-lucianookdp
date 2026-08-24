import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GITHUB_LOGIN = 'lucianookdp';
const OUTPUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/data/github-stats.json'
);

const QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
        totalCount
        nodes {
          stargazerCount
          languages(first: 6, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

async function fetchStats(token) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: QUERY, variables: { login: GITHUB_LOGIN } })
  });

  if (!response.ok) {
    throw new Error(`GitHub API responded with ${response.status}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`GitHub GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  return json.data.user;
}

function aggregateLanguages(repositories) {
  const totals = new Map();
  for (const repo of repositories) {
    for (const edge of repo.languages.edges) {
      const key = edge.node.name;
      const prev = totals.get(key) ?? { name: key, color: edge.node.color, size: 0 };
      prev.size += edge.size;
      totals.set(key, prev);
    }
  }

  const sorted = Array.from(totals.values()).sort((a, b) => b.size - a.size);
  const grandTotal = sorted.reduce((sum, lang) => sum + lang.size, 0) || 1;

  return sorted.slice(0, 6).map((lang) => ({
    name: lang.name,
    color: lang.color ?? '#8b8b8b',
    percentage: Math.round((lang.size / grandTotal) * 1000) / 10
  }));
}

function buildHeatmap(calendar) {
  const days = calendar.weeks.flatMap((week) => week.contributionDays);
  const max = days.reduce((m, day) => Math.max(m, day.contributionCount), 0) || 1;

  const weeks = calendar.weeks.map((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: day.contributionCount === 0 ? 0 : Math.min(4, Math.ceil((day.contributionCount / max) * 4))
    }))
  );

  return weeks;
}

function buildPayload(user) {
  const repositories = user.repositories.nodes;
  const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazerCount, 0);

  return {
    login: GITHUB_LOGIN,
    totalRepos: user.repositories.totalCount,
    totalStars,
    totalContributions: user.contributionsCollection.contributionCalendar.totalContributions,
    topLanguages: aggregateLanguages(repositories),
    weeks: buildHeatmap(user.contributionsCollection.contributionCalendar),
    generatedAt: new Date().toISOString()
  };
}

async function ensureFallbackExists() {
  if (existsSync(OUTPUT_PATH)) return;
  const fallback = {
    login: GITHUB_LOGIN,
    totalRepos: 0,
    totalStars: 0,
    totalContributions: 0,
    topLanguages: [],
    weeks: [],
    generatedAt: null
  };
  await writeFile(OUTPUT_PATH, `${JSON.stringify(fallback, null, 2)}\n`, 'utf-8');
}

async function main() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.warn('[github-stats] No GITHUB_TOKEN found, keeping cached data.');
    await ensureFallbackExists();
    return;
  }

  try {
    const user = await fetchStats(token);
    const payload = buildPayload(user);
    await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
    console.log('[github-stats] Cache updated successfully.');
  } catch (error) {
    console.warn(`[github-stats] Fetch failed, keeping cached data: ${error.message}`);
    await ensureFallbackExists();
  }
}

await main();
