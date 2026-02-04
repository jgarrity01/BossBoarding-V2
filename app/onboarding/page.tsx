'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Mail, Phone } from 'lucide-react'

export default function OnboardingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4">
          <Image
            src="/images/laundryboss-logo-rtrademark.png"
            alt="The Laundry Boss"
            width={280}
            height={85}
            className="object-contain mx-auto"
            priority
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Laundry Boss Onboarding
        </h1>
        <p className="text-muted-foreground">
          Welcome to the Laundry Boss customer onboarding portal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Unique Link Required
          </CardTitle>
          <CardDescription>
            To begin your onboarding, you need a personalized link from your Laundry Boss representative.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Each customer receives a unique onboarding link that is personalized with your business information. 
              If you have received a link, please use that to access your onboarding form.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Don't have a link yet?</h3>
            <p className="text-sm text-muted-foreground">
              Contact our team to get started with Laundry Boss. We'll create your account and send you a personalized onboarding link.
            </p>
            
            <div className="grid gap-3">
              <a 
                href="mailto:onboarding@thelaundryboss.com" 
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Email Us</p>
                  <p className="text-sm text-muted-foreground">onboarding@thelaundryboss.com</p>
                </div>
              </a>
              
              <a 
                href="tel:+18005551234" 
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Call Us</p>
                  <p className="text-sm text-muted-foreground">1-800-555-1234</p>
                </div>
              </a>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
