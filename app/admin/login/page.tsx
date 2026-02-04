"use client";

import React from "react"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import Image from "next/image";
import { Lock, User, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, setCurrentAdminUser } = useUserStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // First try local login (for backwards compatibility)
      const success = login(username, password);
      if (success) {
        // ALWAYS fetch the user's role from Supabase database - this is the source of truth
        try {
          const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list' }),
          });
          
          if (response.ok) {
            const data = await response.json();
            // Find the logged-in user in the database list (check both email and username)
            const dbUser = data.users?.find((u: { email: string }) => 
              u.email === username || 
              u.email.toLowerCase() === username.toLowerCase() ||
              u.email === username + '@thelaundryboss.com' // Try with domain if just username provided
            );
            
            if (dbUser) {
              // Update the currentAdminUser with the database role - THIS IS THE SOURCE OF TRUTH
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
        } catch {
          // If we can't fetch from DB, continue with local role
        }
        
        router.push("/admin");
      } else {
        setError("Invalid username or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-lb-navy via-lb-blue/20 to-background">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Image
                src="/images/laundryboss-logo-rtrademark.png"
                alt="The Laundry Boss"
                width={280}
                height={85}
                className="object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Admin Login</CardTitle>
            <CardDescription>
              Sign in to access the admin portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Contact{" "}
                <a href="mailto:onboarding@thelaundryboss.com" className="text-lb-blue hover:text-lb-cyan">
                  onboarding@thelaundryboss.com
                </a>
                {" "}for access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
