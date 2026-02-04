'use client'

import React from "react"

import { useOnboardingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CreditCard, CheckCircle2, Clock, ExternalLink, Info } from 'lucide-react'
import { DEFAULT_PAYSTRI_LINK } from '@/lib/types'

export function MerchantAccountStep() {
  const { nextStep, prevStep } = useOnboardingStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Merchant Account Application</CardTitle>
            <CardDescription>Set up payment processing for your laundromat</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paystri Application Card */}
          <div className="bg-primary/5 border-2 border-primary/30 rounded-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Paystri Merchant Application</h3>
                  <p className="text-muted-foreground mt-1">
                    Complete your merchant application with Paystri to enable credit card payments at your laundromat.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Button 
                type="button"
                size="lg"
                className="gap-2"
                onClick={() => window.open(DEFAULT_PAYSTRI_LINK, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Start Paystri Application
              </Button>
              <p className="text-sm text-muted-foreground self-center">
                Opens in a new window
              </p>
            </div>
          </div>

          {/* Info about the merchant account */}
          <Alert className="bg-muted/50 border-muted">
            <Info className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>The merchant application must be completed before your system can go live</li>
                <li>Make sure the signer name and email match your business records</li>
                <li>Processing typically takes 5-7 business days after submission</li>
                <li>You can continue with onboarding while your application is being processed</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">What You Get</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Secure Processing</p>
                  <p className="text-xs text-muted-foreground">PCI-compliant payment processing</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Competitive Rates</p>
                  <p className="text-xs text-muted-foreground">No hidden fees</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Easy Integration</p>
                  <p className="text-xs text-muted-foreground">Works with Laundry Boss</p>
                </div>
              </div>
            </div>
          </div>

          {/* Process Steps */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Application Process</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Click "Start Paystri Application"</p>
                  <p className="text-sm text-muted-foreground">
                    Opens the merchant application in a new window
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Complete & Submit Application</p>
                  <p className="text-sm text-muted-foreground">
                    Fill out all required fields and submit for review
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Account Approved & Boarded</p>
                  <p className="text-sm text-muted-foreground">
                    Once approved, your account will be ready for your installation
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Timeline</AlertTitle>
            <AlertDescription>
              Please complete the merchant application as soon as possible to ensure your account is 
              boarded prior to your installation date. This typically takes 5-7 business days.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button type="submit">
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
