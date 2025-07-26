import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Input from "@/pages/Input";
import Results from "@/pages/Results";
import Answers from "@/pages/Answers";
import Export from "@/pages/Export";
import { LogOut, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import Questions from "@/pages/Questions";
import Profile from "@/pages/Profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { useLocation } from "wouter";

function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Bot className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Quora AI Scraper
              </h1>
            </div>
          </div>
          <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              className="text-sm text-gray-700 border-gray-300 hover:bg-gray-100 "
            >
              Go to Dashboard
          </Button>
          <div className="flex items-center space-x-4">
            {/* <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700">{user.username}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-4 h-4" />
            </Button> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer flex items-center space-x-2">
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{user.username}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation("/profile")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" /> Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Switch>
          <Route path="/login">
            {user ? <Redirect to="/dashboard" /> : <Login />}
          </Route>
          <Route path="/register">
            {user ? <Redirect to="/dashboard" /> : <Register />}
          </Route>
          <Route path="/questions/:jobId">
            <ProtectedRoute>
              <Questions />
            </ProtectedRoute>
            </Route>
          <Route path="/dashboard">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>
          <Route path="/input">
            <ProtectedRoute>
              <Input />
            </ProtectedRoute>
          </Route>
          <Route path="/results/:jobId">
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          </Route>
          <Route path="/answers/:jobId">
            <ProtectedRoute>
              <Answers />
            </ProtectedRoute>
          </Route>
          <Route path="/export">
            <ProtectedRoute>
              <Export />
            </ProtectedRoute>
          </Route>
          <Route path="/">
            {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
