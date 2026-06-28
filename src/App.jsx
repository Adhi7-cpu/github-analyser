import { useState } from "react"
import axios from "axios"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"]

function calculateScore(profile, repos, languages) {
  let score = 0
  let breakdown = []

  if (profile.avatar_url && !profile.avatar_url.includes("identicon")) {
    score += 1
    breakdown.push({ label: "Has profile picture", points: 1 })
  }
  if (profile.bio) {
    score += 1
    breakdown.push({ label: "Has a bio", points: 1 })
  }
  if (profile.location) {
    score += 1
    breakdown.push({ label: "Has location", points: 1 })
  }
  if (profile.blog) {
    score += 1
    breakdown.push({ label: "Has website/blog", points: 1 })
  }
  if (profile.followers >= 100) {
    score += 2
    breakdown.push({ label: "100+ followers", points: 2 })
  } else if (profile.followers >= 10) {
    score += 1
    breakdown.push({ label: "10+ followers", points: 1 })
  }
  if (profile.public_repos >= 20) {
    score += 2
    breakdown.push({ label: "20+ public repos", points: 2 })
  } else if (profile.public_repos >= 5) {
    score += 1
    breakdown.push({ label: "5+ public repos", points: 1 })
  }
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0)
  if (totalStars >= 10) {
    score += 1
    breakdown.push({ label: "10+ total stars", points: 1 })
  }
  if (languages.length >= 3) {
    score += 1
    breakdown.push({ label: "Uses 3+ languages", points: 1 })
  }

  return { score: Math.min(score, 10), breakdown }
}

function getScoreColor(score) {
  if (score >= 8) return "text-green-400"
  if (score >= 5) return "text-yellow-400"
  return "text-red-400"
}

function getScoreLabel(score) {
  if (score >= 8) return "Excellent Profile 🏆"
  if (score >= 6) return "Good Profile 👍"
  if (score >= 4) return "Average Profile 📈"
  return "Needs Improvement 💪"
}

function App() {
  const [username, setUsername] = useState("")
  const [profile, setProfile] = useState(null)
  const [repos, setRepos] = useState([])
  const [languages, setLanguages] = useState([])
  const [score, setScore] = useState(null)
  const [breakdown, setBreakdown] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    if (!username) return
    setLoading(true)
    setError("")
    setProfile(null)
    setRepos([])
    setLanguages([])
    setScore(null)
    setBreakdown([])

    try {
      const [profileRes, reposRes] = await Promise.all([
        axios.get(`https://api.github.com/users/${username}`),
        axios.get(`https://api.github.com/users/${username}/repos?sort=stars&per_page=30`)
      ])
      setProfile(profileRes.data)

      const top6 = reposRes.data.slice(0, 6)
      setRepos(top6)

      // Count languages
      const langCount = {}
      reposRes.data.forEach(repo => {
        if (repo.language) {
          langCount[repo.language] = (langCount[repo.language] || 0) + 1
        }
      })

      const langData = Object.entries(langCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }))

      setLanguages(langData)

      // Calculate score
      const { score: s, breakdown: b } = calculateScore(profileRes.data, reposRes.data, langData)
      setScore(s)
      setBreakdown(b)

    } catch (err) {
      setError("User not found. Please check the username.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6 pt-12">
      <h1 className="text-4xl font-bold text-white mb-2">GitHub Profile Analyzer</h1>
      <p className="text-gray-400 mb-8">Enter a GitHub username to analyze their profile</p>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="e.g. torvalds"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white w-72 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleAnalyze}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
        >
          {loading ? "Loading..." : "Analyze"}
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {profile && (
        <div className="w-full max-w-3xl">

          {/* Profile Card */}
          <div className="bg-gray-900 rounded-2xl p-6 text-center border border-gray-700 mb-6">
            <img src={profile.avatar_url} alt="avatar" className="w-24 h-24 rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold">{profile.name || profile.login}</h2>
            <p className="text-gray-400 mb-2">{profile.bio || "No bio available"}</p>
            <div className="flex justify-center gap-6 text-sm text-gray-400 mb-4">
              {profile.location && <span>📍 {profile.location}</span>}
              {profile.blog && <a href={profile.blog} className="text-blue-400 hover:underline">🔗 Website</a>}
              <span>📅 Joined {new Date(profile.created_at).getFullYear()}</span>
            </div>
            <div className="flex justify-around mt-4">
              <div>
                <p className="text-2xl font-bold text-blue-400">{profile.public_repos}</p>
                <p className="text-gray-400 text-sm">Repos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{profile.followers}</p>
                <p className="text-gray-400 text-sm">Followers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{profile.following}</p>
                <p className="text-gray-400 text-sm">Following</p>
              </div>
            </div>
          </div>

          {/* Score Card */}
          {score !== null && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 mb-6">
              <h3 className="text-xl font-bold mb-4">🎯 Profile Score</h3>
              <div className="flex items-center gap-6 mb-4">
                <div className="text-center">
                  <p className={`text-7xl font-bold ${getScoreColor(score)}`}>{score}</p>
                  <p className="text-gray-400 text-sm mt-1">out of 10</p>
                </div>
                <div className="flex-1">
                  <p className={`text-xl font-semibold mb-3 ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${score >= 8 ? "bg-green-400" : score >= 5 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${score * 10}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {breakdown.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>{item.label}</span>
                    <span className="text-yellow-400 ml-auto">+{item.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Language Chart */}
          {languages.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 mb-6">
              <h3 className="text-xl font-bold mb-4">💻 Language Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={languages}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {languages.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Repos */}
          <h3 className="text-xl font-bold mb-4">⭐ Top Repositories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.map(repo => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-blue-500 transition"
              >
                <h4 className="font-semibold text-blue-400 mb-1">{repo.name}</h4>
                <p className="text-gray-400 text-sm mb-3">{repo.description || "No description"}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>⭐ {repo.stargazers_count}</span>
                  <span>🍴 {repo.forks_count}</span>
                  {repo.language && <span>💻 {repo.language}</span>}
                </div>
              </a>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}

export default App
