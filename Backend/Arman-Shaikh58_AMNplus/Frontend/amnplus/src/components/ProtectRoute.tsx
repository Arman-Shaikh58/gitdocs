// ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext/AuthContext";

export default function ProtectedRoute({ children }: { children: any }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
