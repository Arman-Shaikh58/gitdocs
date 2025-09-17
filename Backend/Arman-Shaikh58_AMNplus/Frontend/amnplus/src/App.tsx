import { AppSidebar } from "@/components/app-sidebar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import SignUp from "./components/SignUp";
import Passwords from "./components/Password";
import APIKeys from "./components/APIKeys";
import Profile from "./components/Profile";
import Home from "./components/Home";
import SignIn from "./components/SignIn";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";
import AddPasswordForm from "./components/AddPasswords";
import AddAPIKeys from "./components/AddAPIKeys";
import EditAPI from "./components/EditAPI";
import EditPassword from "./components/EditPassword";
import { AlertProvider } from "./components/context/Alerts/Alerts";
import ProtectedRoute from "./components/ProtectRoute";

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AlertProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 justify-between items-center px-4 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
                </div>
                <ModeToggle />
              </header>
              <div className="flex flex-1 flex-col pt-0">
                <Routes>
                  <Route path="/" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />

                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/passwords"
                    element={
                      <ProtectedRoute>
                        <Passwords />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/keys"
                    element={
                      <ProtectedRoute>
                        <APIKeys />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/:email"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/addpassword"
                    element={
                      <ProtectedRoute>
                        <AddPasswordForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/addapi"
                    element={
                      <ProtectedRoute>
                        <AddAPIKeys />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/editpassword/:id"
                    element={
                      <ProtectedRoute>
                        <EditPassword />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/editapi/:id"
                    element={
                      <ProtectedRoute>
                        <EditAPI />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </AlertProvider>
      </ThemeProvider>
    </Router>
  );
}
