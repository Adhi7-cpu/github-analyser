import { useState } from "react"
import axios from "axios"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"]

function App() {
  const [username, setUsername] = useState("")
  const [profile, setProfile] = useState(null)
  const [repos, setRepos] = useState([])
  const [languages, setLanguages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    if (!username) return
    setLoading(true)
    setError("")
    setProfile(null)
    setRepos([])
    setLanguages([])

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
