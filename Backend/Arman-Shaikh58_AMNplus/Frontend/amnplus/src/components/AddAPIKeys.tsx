import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { KeyRound } from 'lucide-react'
import { useAuth } from './context/AuthContext/AuthContext'
import { useNavigate } from 'react-router-dom'
import { deriveKeyFromUID, encryptData } from './context/Encryption/Encryption'
import { useAlert } from './context/Alerts/Alerts'

export default function AddAPIKeys() {
    const {currentUser}=useAuth();
    const navigate=useNavigate()
    const {showAlert} =useAlert();
  const [form, setForm] = useState({
    title: '',
    key: '',
    description: '',
    url: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async() => {
    const idToken=await currentUser?.getIdToken();
    const key = await deriveKeyFromUID(currentUser?.uid ??"");
    const encrypted=await encryptData(form.key,key);
     const res=await fetch("https://amnplus.onrender.com/post/apikeys",{
        method:"POST",
        headers:{
            Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
            'title':form.title,
            "iv":encrypted.iv,
            "ciphertext":encrypted.ciphertext,
            'description':form.description,
            'url':form.url
        })
    });
    const data=await res.json();
    if (data.status!=200){
        alert("Unable to upload password to server");

    }else{
        showAlert({
          title:"Added API Key",
          message:"Saved API KEY in the Database",
          variant:'success'
        })
        navigate('/keys');
    }
  }

  return (
    <div className="flex justify-center items-start w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl shadow-lg dark:shadow-gray-800">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add API Key</CardTitle>
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
                placeholder="Title (e.g. Stripe)"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <Input
                id="key"
                placeholder="API Key"
                name="key"
                value={form.key}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Description (optional)"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full min-h-[100px] resize-none"
              />
            </div>
            
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL
              </label>
              <Input
                id="url"
                placeholder="URL (e.g. https://api.stripe.com)"
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
            Save API Key
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
