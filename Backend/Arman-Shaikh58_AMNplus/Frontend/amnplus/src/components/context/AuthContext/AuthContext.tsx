import type { User } from "firebase/auth"
import { useEffect,createContext, useState,useContext, type ReactNode } from "react";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";




type AuthContextType={
    currentUser:User | null;
    userLoggedIn : boolean;
    loading: boolean;
};

const AuthContext=createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps{
    children : ReactNode;
}
export function AuthProvider({children}:AuthProviderProps){
    const [currentUser,setCurrentUser]=useState<User | null>(null);
    const [userLoggedIn,setUserLoggedIn]=useState(false);
    const [loading,setLoading]=useState(true);

    useEffect(()=>{
        const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
    },[]);

    async function initializeUser(user:User|null){
        if (user){
            setCurrentUser(user);
            setUserLoggedIn(true);
        }else{
            setCurrentUser(null);
            setUserLoggedIn(false);
        }
        setLoading(false);
    }
    const value:AuthContextType={
        currentUser,
        userLoggedIn,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}