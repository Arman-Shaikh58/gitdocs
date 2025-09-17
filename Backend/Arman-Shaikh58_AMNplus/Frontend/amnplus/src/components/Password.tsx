import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Globe,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useAuth } from "./context/AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import { decryptData, deriveKeyFromUID } from "./context/Encryption/Encryption";
import { useAlert } from "./context/Alerts/Alerts";

interface Password {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  createdAt: string;
}

export default function Passwords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );
  const [passwords, setPasswords] = useState<Password[]>([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchPasswords = async () => {
      try {
        const idToken = await currentUser?.getIdToken();

        const key = await deriveKeyFromUID(currentUser?.uid ?? "");

        const res = await fetch("https://amnplus.onrender.com/get/passwords", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const data = await res.json();

        if (data.status === 200 && Array.isArray(data.passwords)) {
          const decryptedPasswords: Password[] = await Promise.all(
            data.passwords.map(async (p: any) => {
              const decrypted = await decryptData(
                { iv: p.iv, ciphertext: p.ciphertext },
                key
              );
              return {
                id: p.id,
                title: p.title,
                username: p.username,
                password: decrypted,
                url: p.url,
                createdAt: p.createdAt,
              };
            })
          );
          setPasswords(decryptedPasswords);
        }
      } catch (err) {
        console.error("Error fetching passwords:", err);
      }
    };

    if (currentUser) fetchPasswords();
  }, [currentUser]);

  const ondelete = async (id: string) => {
      try {
        const idToken = await currentUser?.getIdToken();
        const res = await fetch("https://amnplus.onrender.com/post/delete-password", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        const data = await res.json();

        if (data.status === 200) {
          setPasswords((prev) => prev.filter((p) => p.id !== id));
          showAlert({
            title: "Deleted",
            message: "Password deleted successfully.",
            variant: "destructive",
          });
        } else {
          console.error("Failed to delete:", data.message || data);
        }
      } catch (error) {
        console.error("Error deleting password:", error);
      }
  };
  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredPasswords = passwords.filter(
    (password) =>
      password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Passwords</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your stored passwords securely
            </p>
          </div>
          <button
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors w-full sm:w-auto"
            onClick={() => {
              navigate("/addpassword");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Password
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Passwords List */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">All Passwords</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your stored passwords and credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPasswords.map((password) => (
              <div
                key={password.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors space-y-4 lg:space-y-0"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {password.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{password.username}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full">
                        Website
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {password.url}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-wrap">
                  <div className="flex items-center space-x-1">
                    <input
                      type={showPasswords[password.id] ? "text" : "password"}
                      value={password.password}
                      readOnly
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-w-[200px]"
                    />
                    <button
                      onMouseDown={() => togglePasswordVisibility(password.id)}
                      onMouseUp={() => togglePasswordVisibility(password.id)}
                      onMouseLeave={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          [password.id]: false,
                        }))
                      }
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPasswords[password.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => copyToClipboard(password.password)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Copy password"
                  >
                    <Copy className="h-4 w-4" />
                  </button>

                  <button
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Edit password"
                    onClick={() => {
                      navigate(`/editpassword/${password.id}`);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete password"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                          This will permanently delete the password entry. This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => ondelete(password.id)}
                          className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}

            {filteredPasswords.length === 0 && (
              <div className="text-center py-8">
                <Lock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No passwords found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or add a new password.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
