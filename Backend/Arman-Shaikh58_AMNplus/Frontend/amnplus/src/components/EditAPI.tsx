// src/pages/EditAPI.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext/AuthContext'
import { decryptData, deriveKeyFromUID, encryptData } from '../components/context/Encryption/Encryption'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { KeyRound } from 'lucide-react'

export default function EditAPI() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    key: '',
    description: '',
    url: ''
  })

  useEffect(() => {
    const fetchKey = async () => {
      const idToken = await currentUser?.getIdToken()
      const key = await deriveKeyFromUID(currentUser?.uid ?? '')

      const res = await fetch(`https://amnplus.onrender.com/get/apikey/${id}`, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      })

      const data = await res.json()
      if (data.status === 200 && data.apikey) {
        const decrypted = await decryptData(
          { iv: data.apikey.iv, ciphertext: data.apikey.ciphertext },
          key
        )
        setForm({
          title: data.apikey.title,
          key: decrypted,
          description: data.apikey.description,
          url: data.apikey.url
        })
      }
    }

    if (currentUser) fetchKey()
  }, [currentUser, id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const idToken = await currentUser?.getIdToken()
    const key = await deriveKeyFromUID(currentUser?.uid ?? '')
    const { iv, ciphertext } = await encryptData(form.key, key)

    await fetch('https://amnplus.onrender.com/post/edit-apikey', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        title: form.title,
        iv,
        ciphertext,
        description: form.description,
        url: form.url
      })
    })

    navigate('/apikeys')
  }

  return (
    <div className="flex justify-center items-start w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl shadow-lg dark:shadow-gray-800">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit API Key</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Title"
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <Input
                  id="key"
                  name="key"
                  value={form.key}
                  onChange={handleChange}
                  placeholder="API Key"
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <Input
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Description"
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL
                </label>
                <Input
                  id="url"
                  name="url"
                  value={form.url}
                  onChange={handleChange}
                  placeholder="URL"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/apikeys')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
