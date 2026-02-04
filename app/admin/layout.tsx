'use client'

import React, { useRef } from "react"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Settings,
  Menu,
  ChevronLeft,
  Shield,
  LogOut,
  DollarSign,
  BarChart3,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/header'

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Tasks', href: '/admin/tasks', icon: ClipboardList },
  { name: 'Commissions', href: '/admin/commissions', icon: DollarSign },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Documents', href: '/admin/documents', icon: FileText },
  { name: 'Users', href: '/admin/users', icon: Shield },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

function Sidebar({ className, onLogout }: { className?: string; onLogout: () => void }) {
  const pathname = usePathname()
  const { currentAdminUser } = useUserStore()

  return (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground", className)}>
      {/* Logo - BossBoarding */}
      <div className="h-20 flex items-center justify-center px-4 border-b border-sidebar-border">
        <Image
          src="/images/bossboarding-logo.png"
          alt="BossBoarding - Customer Onboarding Made Easy"
          width={180}
          height={80}
          className="object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || 
              (link.href !== '/admin' && pathname.startsWith(link.href))
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-lb-blue text-white" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-lb-cyan"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.name}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {currentAdminUser && (
          <div className="text-xs text-muted-foreground">
            Logged in as <span className="text-lb-blue font-medium">{currentAdminUser.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-lb-blue transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [supabaseUser, setSupabaseUser] = useState<unknown>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated: isZustandAuthenticated, logout: zustandLogout, currentAdminUser } = useUserStore()
  
  const { setCurrentAdminUser } = useUserStore()
  
  // Track if we've already fetched the profile to prevent repeated API calls
  const profileFetchedRef = useRef<string | null>(null)
  
  // Fetch admin profile from database and update store (only once per email)
  const fetchAndSetAdminProfile = async (userEmail: string) => {
    // Skip if we've already fetched for this email
    if (profileFetchedRef.current === userEmail.toLowerCase()) {
      return
    }
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const dbUser = data.users?.find((u: { email: string }) => 
          u.email.toLowerCase() === userEmail.toLowerCase()
        );
        
        if (dbUser) {
          // Mark as fetched BEFORE setting user to prevent race conditions
          profileFetchedRef.current = userEmail.toLowerCase()
          setCurrentAdminUser({
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role || 'admin',
            createdAt: dbUser.created_at,
            lastLogin: new Date().toISOString(),
            permissions: dbUser.role === 'super_admin' ? ['all'] : [],
          });
        }
      }
    } catch (error) {
      // Silently fail - will use local role
    }
  }
  
  // Check Supabase auth on mount - simplified to avoid rate limiting
  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUser(user)
      setIsCheckingAuth(false)
      // Fetch admin profile from database to get role (only once)
      if (user?.email) {
        fetchAndSetAdminProfile(user.email)
      }
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null)
      setIsCheckingAuth(false)
      // Only fetch if this is a new login (email changed)
      if (session?.user?.email && profileFetchedRef.current !== session.user.email.toLowerCase()) {
        fetchAndSetAdminProfile(session.user.email)
      }
    })
    
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Combined auth check - either Supabase or Zustand (fallback)
  const isAuthenticated = !!supabaseUser || isZustandAuthenticated
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })
      if (error) throw error
      // Auth state change will be picked up by the onAuthStateChange listener
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : 'Invalid credentials')
    } finally {
      setIsLoggingIn(false)
    }
  }
  
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    zustandLogout()
    setSupabaseUser(null)
    // Stay on /admin - the login form will show automatically
    router.refresh()
  }
  
  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }
  
  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <div className="flex flex-col gap-6">
              {/* Laundry Boss Logo */}
              <div className="flex items-center justify-center mb-4">
                <Image
                  src="/images/laundryboss-logo-rtrademark.png"
                  alt="The Laundry Boss"
                  width={280}
                  height={85}
                  className="object-contain"
                />
              </div>
              
              <Card className="border-border bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">Admin Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the admin dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin}>
                    <div className="flex flex-col gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@example.com"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="bg-white border-gray-300"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="bg-white border-gray-300"
                        />
                      </div>
                      {loginError && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <p className="text-sm text-destructive">{loginError}</p>
                        </div>
                      )}
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90" 
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            
              <p className="text-center text-sm text-muted-foreground">
                Contact your administrator if you need access
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:border-r lg:border-border">
        <Sidebar onLogout={handleLogout} />
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 lg:hidden flex h-16 items-center gap-4 border-b border-border bg-white px-4">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar onLogout={handleLogout} />
          </SheetContent>
        </Sheet>
        <Image
          src="/images/bossboarding-logo.png"
          alt="BossBoarding"
          width={140}
          height={50}
          className="object-contain"
        />
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 bg-white">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
