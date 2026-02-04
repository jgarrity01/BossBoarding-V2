'use client'

import React, { useState } from "react"

import { useOnboardingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Key, Eye, EyeOff, AlertCircle } from 'lucide-react'

export function GeneralInfoStep() {
  const { formData, updateFormData, nextStep } = useOnboardingStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  const passwordsMatch = !formData.confirmPassword || formData.password === formData.confirmPassword
  const passwordValid = !formData.password || formData.password.length >= 8
  const isValid = formData.businessName && formData.ownerName && formData.email && formData.phone

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Tell us about your business</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name / LLC *</Label>
              <Input
                id="businessName"
                placeholder="Clean & Fresh Laundromat LLC"
                value={formData.businessName}
                onChange={(e) => updateFormData({ businessName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name *</Label>
              <Input
                id="ownerName"
                placeholder="John Smith"
                value={formData.ownerName}
                onChange={(e) => updateFormData({ ownerName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">This will be your username for the customer portal</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Account Setup Section */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Portal Account Setup</h3>
              <span className="text-xs text-muted-foreground">(Optional - can be set later)</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Create a password to access the customer portal where you can track your onboarding progress and manage your account.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password || ''}
                    onChange={(e) => updateFormData({ password: e.target.value })}
                    className={!passwordValid ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {!passwordValid && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Password must be at least 8 characters
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword || ''}
                    onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                    className={!passwordsMatch ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {!passwordsMatch && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={!isValid}>
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
