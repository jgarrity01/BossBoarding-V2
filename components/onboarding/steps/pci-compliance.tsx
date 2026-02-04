'use client'

import React from "react"

import { useOnboardingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Shield, Info } from 'lucide-react'

export function PCIComplianceStep() {
  const { formData, updateFormData, nextStep, prevStep } = useOnboardingStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  const isValid = formData.pciRepresentativeName && formData.pciCompanyName && 
                  formData.pciTitle && formData.pciConsent

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>PCI Compliance Consent</CardTitle>
            <CardDescription>Authorization for PCI compliance application</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Explanation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>What is PCI Compliance?</AlertTitle>
            <AlertDescription>
              PCI DSS (Payment Card Industry Data Security Standard) compliance ensures that businesses 
              that accept, process, or store credit card information maintain a secure environment. 
              This consent allows Laundry Boss to complete and submit the PCI compliance application 
              to CardPointe on your behalf.
            </AlertDescription>
          </Alert>

          {/* Consent Form */}
          <div className="border rounded-lg p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">PCI Compliance Consent</h3>
              <div className="text-sm text-muted-foreground space-y-4">
                <p>
                  I, <span className="font-medium text-foreground">{formData.pciRepresentativeName || '[Representative Name]'}</span>, 
                  an authorized representative of <span className="font-medium text-foreground">{formData.pciCompanyName || '[Company Name]'}</span> (the 
                  &quot;Company&quot;), hereby voluntarily and irrevocably grant LAUNDRY BOSS, LLC (&quot;LB&quot;) 
                  permission to complete and submit a PCI compliance application to Card Pointe on the Company&apos;s 
                  behalf.
                </p>
                <p>
                  Company hereby indemnifies and holds harmless LB, its employees, affiliates, and investors from 
                  any and all claims with regard to the PCI compliance application.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="repName">Representative Name *</Label>
                  <Input
                    id="repName"
                    placeholder="John Smith"
                    value={formData.pciRepresentativeName}
                    onChange={(e) => updateFormData({ pciRepresentativeName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Clean & Fresh Laundromat LLC"
                    value={formData.pciCompanyName}
                    onChange={(e) => updateFormData({ pciCompanyName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Owner"
                  value={formData.pciTitle}
                  onChange={(e) => updateFormData({ pciTitle: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start space-x-3 pt-4 border-t">
              <Checkbox
                id="consent"
                checked={formData.pciConsent}
                onCheckedChange={(checked) => updateFormData({ pciConsent: checked as boolean })}
              />
              <div className="space-y-1">
                <Label htmlFor="consent" className="font-medium cursor-pointer">
                  I agree to the PCI Compliance Consent *
                </Label>
                <p className="text-sm text-muted-foreground">
                  By checking this box, I confirm that I am an authorized representative of the company 
                  and agree to the terms stated above.
                </p>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="text-sm text-muted-foreground">
            Date: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button type="submit" disabled={!isValid}>
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
