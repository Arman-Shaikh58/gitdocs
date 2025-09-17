import { useState, useEffect } from "react";
import api from "../api/AxiosInstance";
import { useNavigate } from "react-router-dom";

function parseGithubUrl(input: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(input.trim());
    if (url.hostname !== "github.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const [owner, repo] = parts;
    return { owner, repo };
  } catch {
    return null;
  }
}

// Floating code symbols component
function FloatingSymbols() {
  const symbols = ["<>", "{}", "[]", "/>", "</", "()", "=>", "&&", "||", "++"];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {symbols.map((symbol, i) => (
        <div
          key={i}
          className="absolute text-blue-500/20 font-mono text-sm animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        >
          {symbol}
        </div>
      ))}
    </div>
  );
}

// Animated background particles
function BackgroundParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentRepos, setRecentRepos] = useState<
    Array<{ owner: string; repo: string; addedAt: number }>
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
    (async () => {
      // If not in localStorage, fetch from backend
      try {
        const res = await api.get("/giturl/get_repos");
        const data = res.data;
        if (Array.isArray(data)) {
          localStorage.setItem("gitdocs:repos", JSON.stringify(data));
          setRecentRepos(
            data
              .sort(
                (a: any, b: any) =>
                  new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
              )
              .slice(0, 6)
          );
        }
      } catch (err) {
        // Optionally handle error (e.g., show notification)
      }
    })();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const parsed = parseGithubUrl(url);
    if (!parsed) {
      setError(
        "Enter a valid GitHub repository URL, e.g., https://github.com/owner/repo"
      );
      setIsSubmitting(false);
      return;
    }
    const res = await api.post("/giturl/fetch_repo", {
      owner: parsed.owner,
      repo: parsed.repo,
    });
    const data = res.data;
    if (data.status == 200) {
      // Save to recent repos
      const repoEntry = {
        owner: parsed.owner,
        repo: parsed.repo,
        addedAt: Date.now(),
      };
      const existingRepos = JSON.parse(
        localStorage.getItem("gitdocs:repos") || "[]"
      );
      const filteredRepos = existingRepos.filter(
        (r: any) => !(r.owner === parsed.owner && r.repo === parsed.repo)
      );
      const updatedRepos = [repoEntry, ...filteredRepos];
      localStorage.setItem("gitdocs:repos", JSON.stringify(updatedRepos));

      console.log(`Would navigate to chat for ${parsed.owner}/${parsed.repo}`);
      navigate(`/chat/${parsed.owner}/${parsed.repo}`);
      setIsSubmitting(false);
    }
  };

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !isSubmitting) {
      handleSubmit();
    }
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-950 via-blue-950/20 to-indigo-950/30 text-slate-100 overflow-hidden">
      {/* Animated background elements */}
      <BackgroundParticles />
      <FloatingSymbols />

      {/* Animated gradient orbs */}
      <div
        className="absolute top-0 -left-40 w-80 h-80 bg-blue-600/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
        style={{
          animation: "blob 7s infinite",
        }}
      ></div>
      <div
        className="absolute top-0 -right-40 w-80 h-80 bg-purple-600/30 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        style={{
          animation: "blob 7s infinite 2s",
        }}
      ></div>
      <div
        className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-600/30 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        style={{
          animation: "blob 7s infinite 4s",
        }}
      ></div>

      {/* Header */}
      <header
        className={`relative z-10 px-6 py-5 border-b border-white/10 backdrop-blur-md bg-white/5 transition-all duration-1000 ${
          isLoaded ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 grid place-items-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-sm font-bold">GD</span>
            </div>
            <span className="font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              GitDocs
            </span>
          </div>
          <a
            className="text-xs text-slate-300 hover:text-white transition-colors duration-200 hover:scale-105 transform"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 px-6">
        <div className="max-w-5xl mx-auto py-16 md:py-24">
          {/* Hero section */}
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-300 ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                Chat with your
              </span>
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  code
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20 blur-lg rounded-lg"></div>
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Transform any GitHub repository into an intelligent conversation.
              <span className="text-blue-400 font-medium">
                {" "}
                Paste, chat, code.
              </span>
            </p>
          </div>

          {/* Form section */}
          <div
            className={`mx-auto max-w-2xl transition-all duration-1000 delay-500 ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="relative group">
              {/* Glowing border effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>

              <div className="relative rounded-2xl border border-white/20 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg
                        className="h-5 w-5 text-slate-400 transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 19c-5 0-5-5.5-5-5.5s0-5.5 5-5.5c2.8 0 3.2 1.5 4 2.8.8 1.3 1.2 2.8 4 2.8 5 0 5-5.5 5-5.5s0-5.5-5-5.5" />
                      </svg>
                    </div>
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="https://github.com/owner/repo"
                      className="w-full rounded-xl bg-slate-800/80 border border-white/10 pl-12 pr-4 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-slate-500 transition-all duration-200 hover:bg-slate-800/90"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-200 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Start Chat
                        <svg
                          className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5-5 5M6 12h12"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div
                    className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                    style={{ animation: "shake 0.5s ease-in-out" }}
                  >
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-center space-x-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Public repos supported</span>
                  </div>
                  <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>Private repos need backend</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Repositories */}
          {recentRepos.length > 0 && (
            <div
              className={`mx-auto max-w-4xl mt-12 transition-all duration-1000 delay-600 ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-200 mb-2">
                  Recent Repositories
                </h2>
                <p className="text-slate-400">
                  Quick access to your recently explored repos
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentRepos.map((repo) => (
                  <div
                    key={`${repo.owner}/${repo.repo}`}
                    className="group relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    <button
                      onClick={() =>
                        navigate(`/chat/${repo.owner}/${repo.repo}`)
                      }
                      className="relative w-full p-4 rounded-lg bg-slate-800/60 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 text-left group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {repo.owner.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-300 text-sm">
                              {repo.owner}
                            </span>
                            <span className="text-white font-medium">
                              {repo.repo}
                            </span>
                          </div>
                        </div>
                        <svg
                          className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5-5 5M6 12h12"
                          />
                        </svg>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(repo.addedAt).toLocaleDateString()}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature highlights */}
          <div
            className={`mt-20 grid md:grid-cols-3 gap-8 transition-all duration-1000 delay-700 ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Instant repository indexing and search",
              },
              {
                icon: "🧠",
                title: "AI Powered",
                desc: "Intelligent code analysis and explanations",
              },
              {
                icon: "🔒",
                title: "Secure",
                desc: "Your code stays safe and private",
              },
            ].map((feature, i) => (
              <div key={i} className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
