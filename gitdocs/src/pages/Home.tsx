import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

function parseGithubUrl(input: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(input.trim())
    if (url.hostname !== 'github.com') return null
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    const [owner, repo] = parts
    return { owner, repo }
  } catch {
    return null
  }
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseGithubUrl(url)
    if (!parsed) {
      setError('Enter a valid GitHub repository URL, e.g., https://github.com/owner/repo')
      return
    }

    // Save to localStorage list
    const key = 'gitdocs:repos'
    const existingRaw = localStorage.getItem(key)
    const existing: Array<{ owner: string; repo: string; addedAt: number }> = existingRaw ? JSON.parse(existingRaw) : []
    const exists = existing.some(r => r.owner === parsed.owner && r.repo === parsed.repo)
    const next = exists ? existing : [{ owner: parsed.owner, repo: parsed.repo, addedAt: Date.now() }, ...existing]
    localStorage.setItem(key, JSON.stringify(next))

    navigate(`/chat/${parsed.owner}/${parsed.repo}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      <header className="px-6 py-5 border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-blue-500/20 ring-1 ring-inset ring-blue-400/30 grid place-items-center">
              <span className="text-blue-300 text-sm font-semibold">GD</span>
            </div>
            <span className="font-semibold tracking-tight">GitDocs</span>
          </div>
          <a className="text-xs text-slate-300 hover:text-white" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </header>

      <main className="px-6">
        <div className="max-w-5xl mx-auto py-16 md:py-24">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Chat with your code
            </h1>
            <p className="mt-3 text-slate-300">
              Paste a GitHub URL to index and chat about a repository.
            </p>
          </div>

          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 5l7 7-7 7" />
                    <path d="M21 12H3" />
                  </svg>
                </div>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full rounded-xl bg-slate-900/60 border border-white/10 pl-9 pr-3 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors px-5 py-3 font-medium text-white shadow-sm shadow-blue-600/20"
              >
                Start Chat
              </button>
            </form>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

            <div className="mt-6 text-xs text-slate-400">
              Tip: Public repos are supported out-of-the-box. Private repos require your own backend.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


