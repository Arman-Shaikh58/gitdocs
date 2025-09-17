import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Key,
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";

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

interface APIKey {
  id: string;
  title: string;
  key: string;
  description: string;
  createdAt: string;
  status: "active" | "inactive";
}

export default function APIKeys() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const getstatus = async (key: string) => {
    fetch("https://api.example.com/ping", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          return "active";
        } else {
          return "inactive";
        }
      })
      .catch((error) => {
        error
        return "inactive";
      });
  };

  useEffect(() => {
    (async () => {
      try {
        const idToken = await currentUser?.getIdToken();
        const ckey = await deriveKeyFromUID(currentUser?.uid ?? "");

        const res = await fetch("https://amnplus.onrender.com/get/apikeys", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const data = await res.json();

        if (data.status && Array.isArray(data.apiKeys)) {
          const decryptedKeys: APIKey[] = await Promise.all(
            data.apiKeys.map(async (key: any) => {
              const decryptedKey = await decryptData(
                { iv: key.iv, ciphertext: key.ciphertext },
                ckey
              );
              return {
                id: key.id,
                title: key.title,
                key: decryptedKey, // <-- resolved string, not function
                description: key.description,
                createdAt: key.createdAt,
                status: getstatus(decryptedKey),
              };
            })
          );

          setApiKeys(decryptedKeys);
        }
      } catch (error) {
        console.error("Error fetching API keys:", error);
      }
    })();
  }, [currentUser]);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredKeys = apiKeys.filter(
    (apiKey) =>
      apiKey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apiKey.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };
  const ondelete = async (id: string) => {
      try {
        const idToken = await currentUser?.getIdToken();
        const res = await fetch("https://amnplus.onrender.com/post/delete-apikey", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        const data = await res.json();

        if (data.status === 200) {
          setApiKeys((prev) => prev.filter((p) => p.id !== id));
          showAlert({
            title: "Deleted",
            message: "API Key deleted successfully.",
            variant: "destructive",
          });
        } else {
          console.error("Failed to delete:", data.message || data);
        }
      } catch (error) {
        console.error("Error deleting APIKey:", error);
      }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">API Keys</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your API keys and access tokens
            </p>
          </div>
          <button
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors w-full sm:w-auto"
            onClick={() => {
              navigate("/addapi");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Key
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search API keys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 mr-3">
                <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{apiKeys.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 mr-3">
                <Key className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {apiKeys.filter((k) => k.status === "active").length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">API Keys</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Manage your API keys and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors space-y-4 lg:space-y-0"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {apiKey.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {apiKey.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          apiKey.status
                        )}`}
                      >
                        {apiKey.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Saved At {apiKey.createdAt}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-wrap">
                  <div className="flex items-center space-x-1">
                    <input
                      type={showKeys[apiKey.id] ? "text" : "password"}
                      value={apiKey.key}
                      readOnly
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 font-mono text-gray-900 dark:text-gray-100 min-w-[200px]"
                    />
                    <button
                      onMouseDown={() => toggleKeyVisibility(apiKey.id)}
                      onMouseUp={() => toggleKeyVisibility(apiKey.id)}
                      onMouseLeave={() =>
                        setShowKeys((prev) => ({ ...prev, [apiKey.id]: false }))
                      }
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showKeys[apiKey.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => copyToClipboard(apiKey.key)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Copy API key"
                  >
                    <Copy className="h-4 w-4" />
                  </button>

                  <button
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Edit API key"
                    onClick={() => {
                      navigate(`/editapi/${apiKey.id}`);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete API key"
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
                          This action cannot be undone. This will permanently
                          delete this API key.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => ondelete(apiKey.id)}
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

            {filteredKeys.length === 0 && (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No API keys found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or generate a new API key.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <div className="space-y-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Security Best Practices</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Keep your API keys secure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                [
                  "Never share your API keys",
                  "Keep your API keys private and never commit them to version control.",
                ],
                [
                  "Use environment variables",
                  "Store API keys in environment variables for better security.",
                ],
                [
                  "Rotate keys regularly",
                  "Generate new API keys periodically and revoke old ones.",
                ],
                [
                  "Monitor usage",
                  "Keep track of API key usage to detect any suspicious activity.",
                ],
              ].map(([title, desc], idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
