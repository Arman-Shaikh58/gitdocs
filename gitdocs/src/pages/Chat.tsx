import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import api from "../api/AxiosInstance"
import MarkdownRenderer from "../utils/MarkdownRenderer"

function parseGithubUrl(input: string): { owner: string; repo: string } | null {
  try {
    // Handle direct owner/repo format
    if (!input.includes('://') && input.includes('/')) {
      const parts = input.trim().split('/')
      if (parts.length === 2) {
        return { owner: parts[0], repo: parts[1] }
      }
    }
    
    // Handle full GitHub URL
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

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: number
}

function storageChatKey(owner: string, repo: string) {
  return `gitdocs:chat:${owner}/${repo}`
}

function storageReposKey() {
  return "gitdocs:repos"
}

export default function Chat() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>()
  const navigate = useNavigate()

  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [topicId, setTopicId] = useState<string>("new") // 🔹 new or existing topic
  const [loading, setLoading] = useState(false)
  const [quickRepoInput, setQuickRepoInput] = useState("")
  const [showQuickInput, setShowQuickInput] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  const repoId = useMemo(() => `${owner}/${repo}`, [owner, repo])

  useEffect(() => {
    if (!owner || !repo) return
    const raw = localStorage.getItem(storageChatKey(owner, repo))
    if (raw) {
      const saved = JSON.parse(raw) as { topicId: string; messages: Message[] }
      setTopicId(saved.topicId || "new")
      setMessages(saved.messages || [])
    }
  }, [owner, repo])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  function saveMessages(next: Message[], nextTopicId: string) {
    if (!owner || !repo) return
    localStorage.setItem(
      storageChatKey(owner, repo),
      JSON.stringify({ topicId: nextTopicId, messages: next })
    )
  }

  async function onSend(e: FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || !owner || !repo) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: Date.now(),
    }
    const next = [...messages, userMsg]
    setMessages(next)
    saveMessages(next, topicId)
    setInput("")
    setLoading(true)

    try {
      // 🔹 Call FastAPI backend
      const res = await api.post(
        `/chat/${owner}/${repo}/${topicId}`,
        null,
        { params: { query: content } }
      )

      const { response, topic_id } = res.data
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        createdAt: Date.now(),
      }
      const finalMsgs = [...next, assistantMsg]
      setMessages(finalMsgs)
      setTopicId(topic_id) // 🔹 Update topicId (new -> actual MongoDB ID)
      saveMessages(finalMsgs, topic_id)
    } catch (err) {
      console.error("Chat error:", err)
    } finally {
      setLoading(false)
    }
  }

  const repos: Array<{ owner: string; repo: string; addedAt: number }> = useMemo(() => {
    const raw = localStorage.getItem(storageReposKey())
    return raw ? JSON.parse(raw) : []
  }, [owner, repo, messages.length])

  function removeRepo(o: string, r: string) {
    const raw = localStorage.getItem(storageReposKey())
    const list: Array<{ owner: string; repo: string; addedAt: number }> = raw
      ? JSON.parse(raw)
      : []
    const next = list.filter((item) => !(item.owner === o && item.repo === r))
    localStorage.setItem(storageReposKey(), JSON.stringify(next))
    if (o === owner && r === repo) navigate("/")
  }

  async function handleQuickRepoSubmit() {
    const parsed = parseGithubUrl(quickRepoInput)
    if (!parsed) return
    
    try {
      const res = await api.post('/giturl/fetch_repo', {
        owner: parsed.owner,
        repo: parsed.repo
      })
      
      if (res.data.status === 200) {
        // Save to recent repos
        const repoEntry = { owner: parsed.owner, repo: parsed.repo, addedAt: Date.now() }
        const existingRepos = JSON.parse(localStorage.getItem('gitdocs:repos') || '[]')
        const filteredRepos = existingRepos.filter((r: any) => !(r.owner === parsed.owner && r.repo === parsed.repo))
        const updatedRepos = [repoEntry, ...filteredRepos]
        localStorage.setItem('gitdocs:repos', JSON.stringify(updatedRepos))
        
        navigate(`/chat/${parsed.owner}/${parsed.repo}`)
        setQuickRepoInput("")
        setShowQuickInput(false)
      }
    } catch (err) {
      console.error("Quick repo error:", err)
    }
  }

  if (!owner || !repo) {
    return (
      <div className="p-6">
        <p>
          Invalid repository. <Link className="text-blue-600" to="/">Go back</Link>
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 grid"
      style={{ gridTemplateColumns: "300px 1fr" }}
    >
      {/* Sidebar */}
      <aside className="border-r border-white/10 p-4 flex flex-col gap-4 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xs text-slate-300 hover:text-white">
            ← Add repo
          </Link>
          <button
            onClick={() => setShowQuickInput(!showQuickInput)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            title="Quick add repository"
          >
            + Quick add
          </button>
        </div>
        
        {/* Quick repo input */}
        {showQuickInput && (
          <div className="space-y-2 p-3 rounded-lg bg-slate-800/50 border border-white/10">
            <input
              value={quickRepoInput}
              onChange={(e) => setQuickRepoInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuickRepoSubmit()}
              placeholder="owner/repo or github.com/owner/repo"
              className="w-full text-xs rounded-md bg-slate-700/50 border border-white/10 px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-slate-500"
            />
            <div className="flex gap-1">
              <button
                onClick={handleQuickRepoSubmit}
                className="flex-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-md transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowQuickInput(false)}
                className="text-xs text-slate-400 hover:text-slate-300 px-2 py-1 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm tracking-wide uppercase text-slate-300">
            Repositories
          </h2>
          {repos.length > 0 && (
            <button
              onClick={() => {
                localStorage.removeItem('gitdocs:repos')
                navigate('/')
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
              title="Clear all repositories"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="space-y-2 overflow-auto pr-1">
          {repos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm opacity-70 mb-2">No repos yet</p>
              <p className="text-xs text-slate-500">Use "Quick add" or go to Home to add repositories</p>
            </div>
          )}
          {repos.map((r) => {
            const active = r.owner === owner && r.repo === repo
            return (
              <div
                key={`${r.owner}/${r.repo}`}
                className={`group flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 transition-colors ${
                  active
                    ? "bg-blue-500/10 ring-1 ring-inset ring-blue-400/30"
                    : "hover:bg-white/5"
                }`}
              >
                <Link to={`/chat/${r.owner}/${r.repo}`} className="truncate flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {r.owner.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-300 text-xs truncate">{r.owner}</span>
                      <span className="text-white font-medium text-sm truncate">{r.repo}</span>
                    </div>
                  </div>
                </Link>
                <button
                  className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  onClick={() => removeRepo(r.owner, r.repo)}
                  title="Remove repository"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex flex-col h-screen">
        <div className="border-b border-white/10 p-4 bg-white/5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <h1 className="font-semibold">{repoId}</h1>
            <div className="text-xs text-slate-400">
              Topic: {topicId === "new" ? "New conversation" : topicId}
            </div>
          </div>
        </div>
        <div ref={listRef} className="flex-1 overflow-auto p-4">
          <div className="max-w-5xl mx-auto space-y-3">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                Ask something about the repository. The AI will respond.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm border ${
                    m.role === "user"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white/5 text-slate-100 border-white/10"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
                    {m.role}
                  </div>
                  {/* <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div> */}
                  <MarkdownRenderer markdown_text={m.content}/>
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-sm text-slate-400 animate-pulse">AI is typing…</div>
            )}
          </div>
        </div>
        <form
          onSubmit={onSend}
          className="p-4 border-t border-white/10 bg-gradient-to-t from-slate-900/60 to-slate-900/20"
        >
          <div className="max-w-5xl mx-auto flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about files, functions, or patterns..."
              className="flex-1 rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors text-white font-medium shadow-sm shadow-blue-600/20"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
