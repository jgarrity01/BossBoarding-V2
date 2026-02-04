"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/header";
import Image from "next/image";
import { Loader2, AlertCircle, LogIn } from "lucide-react";

export default function PortalLoginPage() {
  const router = useRouter();
  const { setCurrentCustomerUser } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Authenticate via API route (server-side)
      const response = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        setError(result.error || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      // Set current customer user in local state for the session
      setCurrentCustomerUser({
        id: result.user.id,
        customerId: result.user.customerId,
        email: result.user.email,
        name: result.user.name,
        createdAt: result.user.createdAt,
        lastLogin: result.user.lastLoginAt,
        passwordSet: true,
      });

      // Redirect to portal dashboard
      router.push("/portal/dashboard");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="mx-auto mb-6">
              <Image
                src="/images/laundryboss-logo-rtrademark.png"
                alt="The Laundry Boss"
                width={280}
                height={85}
                className="object-contain mx-auto"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Customer Portal</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your onboarding dashboard
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-border shadow-lg">
            <form onSubmit={handleLogin}>
              <CardHeader>
                <CardTitle className="text-foreground">Sign In</CardTitle>
                <CardDescription>
                  Enter the credentials provided by your administrator
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
                <div className="text-sm text-center text-muted-foreground space-y-2">
                  <p>
                    Need to start onboarding?{" "}
                    <Link href="/onboarding" className="text-lb-blue hover:underline">
                      Begin here
                    </Link>
                  </p>
                  <p>
                    Check your status?{" "}
                    <Link href="/portal" className="text-lb-blue hover:underline">
                      Look up by email
                    </Link>
                  </p>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Help Text */}
          <p className="text-center text-sm text-muted-foreground">
            Having trouble signing in? Contact{" "}
            <a href="mailto:onboarding@thelaundryboss.com" className="text-lb-blue hover:underline">
              onboarding@thelaundryboss.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
