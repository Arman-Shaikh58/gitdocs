import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Lock } from 'lucide-react'
import { useAuth } from './context/AuthContext/AuthContext'
import { useNavigate } from 'react-router-dom'
import { deriveKeyFromUID, encryptData } from './context/Encryption/Encryption'
import { useAlert } from './context/Alerts/Alerts'

export default function AddPasswordForm() {
    const {currentUser}=useAuth();
    const navigate=useNavigate();
    const {showAlert}=useAlert();
  const [form, setForm] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const generatePassword = () => {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-='
    let newPass = ''
    for (let i = 0; i < 16; i++) {
      const randomChar = charset.charAt(Math.floor(Math.random() * charset.length))
      newPass += randomChar
    }
    setForm({ ...form, password: newPass })
  }

  const handleSubmit = async() => {
    const idToken= await currentUser?.getIdToken();
    const key= await deriveKeyFromUID(currentUser?.uid ?? "");
    const encrypted = await encryptData(form.password, key);
    const res=await fetch("https://amnplus.onrender.com/post/passwords",{
        method:"POST",
        headers:{
            Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
            'title':form.title,
            'username':form.username,
            'iv':encrypted.iv,
            'ciphertext':encrypted.ciphertext,
            'url':form.url
        })
    });
    const data=await res.json();
    if (data.status!=200){
        alert("Unable to upload password to server");
    }else{
        showAlert({
          title:"Added Password ",
          message:"Saved Password in the Database",
          variant:'success'
        })
        navigate('/passwords')
    }
  }

  return (
    <div className="flex justify-center items-start w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-xl shadow-lg dark:shadow-gray-800">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add New Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <Input
                id="title"
                placeholder="Title (e.g. Gmail)"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <Input
                id="username"
                placeholder="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  placeholder="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={generatePassword}
                  className="whitespace-nowrap"
                >
                  Generate
                </Button>
              </div>
            </div>
            
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL
              </label>
              <Input
                id="url"
                placeholder="URL (e.g. https://example.com)"
                name="url"
                value={form.url}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors" 
            onClick={handleSubmit}
          >
            Save Password
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
