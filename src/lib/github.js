import { useEffect, useState } from 'react'
import { fallbackRepos } from '../content.js'

const TTL = 10 * 60 * 1000 // 10 min: unauthenticated API allows 60 req/hour
const cacheKey = (user) => `p3r-repos:${user}`

function readCache(user) {
  try {
    const raw = sessionStorage.getItem(cacheKey(user))
    if (!raw) return null
    const { at, repos } = JSON.parse(raw)
    return Date.now() - at < TTL && Array.isArray(repos) ? repos : null
  } catch {
    return null
  }
}

function writeCache(user, repos) {
  try {
    sessionStorage.setItem(cacheKey(user), JSON.stringify({ at: Date.now(), repos }))
  } catch {
    /* storage full / blocked: just skip caching */
  }
}

// Only keep the fields the rows use, so the cache stays small.
const slim = (r) => ({
  name: r.name,
  description: r.description,
  language: r.language,
  stargazers_count: r.stargazers_count,
  forks_count: r.forks_count,
  pushed_at: r.pushed_at,
  created_at: r.created_at,
  visibility: r.visibility,
  private: r.private,
  html_url: r.html_url,
})

// One shared request per username, so remounts (and React StrictMode in dev)
// don't spend extra calls from the 60/hour budget.
const inflight = {}
function fetchRepos(username, count) {
  if (!inflight[username]) {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=pushed&direction=desc&per_page=10`
    inflight[username] = fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const repos = data
          .filter((r) => !r.fork && !r.archived)
          .slice(0, count)
          .map(slim)
        if (!repos.length) throw new Error('no repos')
        writeCache(username, repos)
        return repos
      })
      .finally(() => {
        delete inflight[username]
      })
  }
  return inflight[username]
}

// status: 'loading' | 'live' | 'offline'
export function useGithubRepos(username, count = 3) {
  const [state, setState] = useState(() => {
    const cached = readCache(username)
    return cached ? { status: 'live', repos: cached } : { status: 'loading', repos: [] }
  })

  useEffect(() => {
    if (state.status !== 'loading') return
    let alive = true
    fetchRepos(username, count)
      .then((repos) => alive && setState({ status: 'live', repos }))
      .catch(() => alive && setState({ status: 'offline', repos: fallbackRepos.slice(0, count) }))
    return () => {
      alive = false
    }
  }, [username, count, state.status])

  return state
}
