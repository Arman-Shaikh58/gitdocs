import {type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

function storageChatKey(owner: string, repo: string) {
  return `gitdocs:chat:${owner}/${repo}`
}

function storageReposKey() {
  return 'gitdocs:repos'
}

export default function Chat() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>()
  const navigate = useNavigate()

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)

  const repoId = useMemo(() => `${owner}/${repo}`, [owner, repo])

  useEffect(() => {
    if (!owner || !repo) return
    const raw = localStorage.getItem(storageChatKey(owner, repo))
    const initial: Message[] = raw ? JSON.parse(raw) : []
    setMessages(initial)
  }, [owner, repo])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  function saveMessages(next: Message[]) {
    if (!owner || !repo) return
    localStorage.setItem(storageChatKey(owner, repo), JSON.stringify(next))
  }

  function onSend(e: FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || !owner || !repo) return
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content, createdAt: Date.now() }
    const next = [...messages, userMsg]
    setMessages(next)
    saveMessages(next)
    setInput('')

    // Stubbed assistant response. Replace with real AI backend later.
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Pretend AI response about ${repoId}: "${content}"`,
      createdAt: Date.now(),
    }
    const finalMsgs = [...next, assistantMsg]
    setMessages(finalMsgs)
    saveMessages(finalMsgs)
  }

  const repos: Array<{ owner: string; repo: string; addedAt: number }> = useMemo(() => {
    const raw = localStorage.getItem(storageReposKey())
    return raw ? JSON.parse(raw) : []
  }, [owner, repo, messages.length])

  function removeRepo(o: string, r: string) {
    const raw = localStorage.getItem(storageReposKey())
    const list: Array<{ owner: string; repo: string; addedAt: number }> = raw ? JSON.parse(raw) : []
    const next = list.filter(item => !(item.owner === o && item.repo === r))
    localStorage.setItem(storageReposKey(), JSON.stringify(next))
    if (o === owner && r === repo) navigate('/')
  }

  if (!owner || !repo) {
    return (
      <div className="p-6">
        <p>Invalid repository. <Link className="text-blue-600" to="/">Go back</Link></p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 grid" style={{ gridTemplateColumns: '300px 1fr' }}>
      <aside className="border-r border-white/10 p-4 flex flex-col gap-4 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xs text-slate-300 hover:text-white">← Add repo</Link>
        </div>
        <h2 className="font-semibold text-sm tracking-wide uppercase text-slate-300">Repositories</h2>
        <div className="space-y-2 overflow-auto pr-1">
          {repos.length === 0 && <p className="text-sm opacity-70">No repos yet</p>}
          {repos.map((r) => {
            const active = r.owner === owner && r.repo === repo
            return (
              <div
                key={`${r.owner}/${r.repo}`}
                className={`group flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 transition-colors ${active ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-400/30' : 'hover:bg-white/5'}`}
              >
                <Link to={`/chat/${r.owner}/${r.repo}`} className="truncate flex-1">
                  <span className="text-slate-300">{r.owner}</span>
                  <span className="mx-1 text-slate-500">/</span>
                  <span className="text-white font-medium">{r.repo}</span>
                </Link>
                <button
                  className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeRepo(r.owner, r.repo)}
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      </aside>
      <main className="flex flex-col h-screen">
        <div className="border-b border-white/10 p-4 bg-white/5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <h1 className="font-semibold">{repoId}</h1>
            <div className="text-xs text-slate-400">AI: Demo mode</div>
          </div>
        </div>
        <div ref={listRef} className="flex-1 overflow-auto p-4">
          <div className="max-w-5xl mx-auto space-y-3">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                Ask something about the repository. A demo AI will respond.
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm border ${m.role === 'user'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white/5 text-slate-100 border-white/10'}
                  `}
                >
                  <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">{m.role}</div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={onSend} className="p-4 border-t border-white/10 bg-gradient-to-t from-slate-900/60 to-slate-900/20">
          <div className="max-w-5xl mx-auto flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about files, functions, or patterns..."
              className="flex-1 rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-slate-500"
            />
            <button type="submit" className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors text-white font-medium shadow-sm shadow-blue-600/20">Send</button>
          </div>
        </form>
      </main>
    </div>
  )
}


