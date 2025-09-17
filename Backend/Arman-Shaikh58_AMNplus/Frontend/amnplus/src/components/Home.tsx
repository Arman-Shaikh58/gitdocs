import { useEffect, useState } from 'react'
import { Shield, Key, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useAuth } from './context/AuthContext/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const [passwordCount, setPasswordCount] = useState(0)
  const [apiKeyCount, setApiKeyCount] = useState(0)
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const idToken = await currentUser?.getIdToken()
        const res = await fetch("https://amnplus.onrender.com/get/stats", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          }
        })
        const data = await res.json()
        if (data.status === 200) {
          setPasswordCount(data.total_passwords)
          setApiKeyCount(data.total_apikeys)
        }
      } catch (err) {
        console.error("Failed to load stats", err)
      }
    }

    if (currentUser) fetchStats()
  }, [currentUser])

  const stats = [
    {
      title: 'Total Passwords',
      value: passwordCount,
      description: 'Stored passwords',
      icon: Shield,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'API Keys',
      value: apiKeyCount,
      description: 'Active keys',
      icon: Key,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's an overview of your account.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button onClick={()=>navigate("/addpassword")} 
            className="flex items-center w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <Plus className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Add New Password</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Store a new password securely</div>
              </div>
            </button>
            <button onClick={()=>navigate("/addapi")} 
            className="flex items-center w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <Key className="mr-3 h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Generate API Key</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Create a new API key</div>
              </div>
            </button>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Your latest account activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Password updated</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Gmail password • 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New password added</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">GitHub • 1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">API key generated</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Development key • 3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
