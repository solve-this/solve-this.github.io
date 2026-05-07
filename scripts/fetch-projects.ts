#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface GitHubRepo {
  name: string
  full_name: string
  html_url: string
  description: string | null
  homepage: string | null
  language: string | null
  stargazers_count: number
  updated_at: string
  archived: boolean
  fork: boolean
  topics?: string[]
}

interface ProjectCardData {
  name: string
  fullName: string
  githubUrl: string
  previewUrl: string
  description: string
  homepage: string | null
  language: string
  stars: number
  updatedAt: string
  topics: string[]
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const outputPath = path.join(rootDir, 'src', 'data', 'projects.json')
const owner = process.env.GITHUB_PROJECTS_OWNER || 'solve-this'
const currentRepoName = process.env.GITHUB_CURRENT_REPO || 'solve-this.github.io'
const githubToken = process.env.GITHUB_TOKEN

function toProjects(repos: GitHubRepo[]): ProjectCardData[] {
  return repos
    .filter(repo => !repo.archived && !repo.fork && repo.name !== currentRepoName)
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      githubUrl: repo.html_url,
      previewUrl: `https://opengraph.githubassets.com/1/${repo.full_name}`,
      description: repo.description?.trim() || 'No description available yet.',
      homepage: repo.homepage?.trim() || null,
      language: repo.language || 'N/A',
      stars: repo.stargazers_count || 0,
      updatedAt: repo.updated_at,
      topics: Array.isArray(repo.topics) ? repo.topics : [],
    }))
}

function getNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  const parts = linkHeader.split(',')
  for (const part of parts) {
    const [urlPart, relPart] = part.split(';').map(s => s.trim())
    if (relPart === 'rel="next"' && urlPart?.startsWith('<') && urlPart.endsWith('>')) {
      return urlPart.slice(1, -1)
    }
  }
  return null
}

async function fetchRepos(baseUrl: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = []
  let nextUrl: string | null = `${baseUrl}?per_page=100&page=1&sort=updated`

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
      },
    })
    if (!res.ok) {
      throw new Error(`GitHub API failed (${res.status}) for ${nextUrl}`)
    }
    const pageData = await res.json() as GitHubRepo[]
    repos.push(...pageData)
    nextUrl = getNextLink(res.headers.get('link'))
  }

  return repos
}

async function writeProjects(projects: ProjectCardData[]): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(projects, null, 2)}\n`, 'utf8')
}

async function main(): Promise<void> {
  const orgUrl = `https://api.github.com/orgs/${owner}/repos`
  const userUrl = `https://api.github.com/users/${owner}/repos`

  try {
    let repos: GitHubRepo[] = []
    try {
      repos = await fetchRepos(orgUrl)
    } catch {
      repos = await fetchRepos(userUrl)
    }
    await writeProjects(toProjects(repos))
    console.log(`[fetch-projects] ✅ Updated ${outputPath}`)
  } catch (error) {
    try {
      await readFile(outputPath, 'utf8')
      console.warn('[fetch-projects] ⚠️ Could not refresh projects; using committed fallback data.')
      console.warn(`[fetch-projects] ${error instanceof Error ? error.message : String(error)}`)
      process.exit(0)
    } catch {
      console.error('[fetch-projects] ❌ Could not refresh projects and no fallback file exists.')
      console.error(`[fetch-projects] ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  }
}

await main()
