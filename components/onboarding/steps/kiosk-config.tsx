'use client'

import React from "react"
import { useOnboardingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Monitor, Info, CreditCard, Banknote, Coins, Smartphone, ExternalLink, AlertTriangle } from 'lucide-react'

const KIOSK_DIMENSIONS_PDF_URL = "https://blobs.vusercontent.net/blob/Rear%20Load%20Kiosk%20Dimensions%20%26%20ADA%20Requirements%20-%20Copy-pIigGcvszmDVbw3wQlozRcbfIsobD0.pdf"

const kioskTypes = [
  {
    name: 'Rear Load Kiosk',
    subtitle: 'In-the-Wall Installation',
    description: 'Wall-mounted kiosk that integrates seamlessly into your laundromat wall. Requires a pre-cut opening in the wall for installation.',
    paymentMethods: [
      { icon: CreditCard, label: 'Credit/Debit Card' },
      { icon: Smartphone, label: 'Apple Pay / Google Pay / Samsung Pay' },
      { icon: Banknote, label: 'Cash (Bills)' },
      { icon: Coins, label: 'Coins' },
    ],
    features: ['Sleek, integrated appearance', 'Secure rear access for service', 'ADA compliant options available'],
  },
  {
    name: 'Front Load Kiosk',
    subtitle: 'Free-Standing Unit',
    description: 'Free-standing kiosk that can be placed anywhere in your laundromat. No wall modification required.',
    paymentMethods: [
      { icon: CreditCard, label: 'Credit/Debit Card' },
      { icon: Smartphone, label: 'Apple Pay / Google Pay / Samsung Pay' },
      { icon: Banknote, label: 'Cash (Bills)' },
      { icon: Coins, label: 'Coins' },
    ],
    features: ['Flexible placement options', 'Easy to relocate', 'All-in-one standalone unit'],
  },
  {
    name: 'Credit Card Only Kiosk',
    subtitle: 'Compact Card Reader',
    description: 'Streamlined kiosk designed exclusively for card-based payments. Ideal for locations preferring cashless operations.',
    paymentMethods: [
      { icon: CreditCard, label: 'Credit/Debit Card' },
      { icon: Smartphone, label: 'Apple Pay / Google Pay / Samsung Pay' },
    ],
    features: ['Compact footprint', 'Lower maintenance', 'No cash handling required'],
  },
  {
    name: 'Credit and Bill Kiosk',
    subtitle: 'Card & Cash Hybrid',
    description: 'Accepts both credit/debit cards and paper currency, but does not include a coin acceptor.',
    paymentMethods: [
      { icon: CreditCard, label: 'Credit/Debit Card' },
      { icon: Smartphone, label: 'Apple Pay / Google Pay / Samsung Pay' },
      { icon: Banknote, label: 'Cash (Bills)' },
    ],
    features: ['Card and bill acceptance', 'No coin mechanism to maintain', 'Good balance of payment options'],
  },
]

const InstallationNote = () => (
  <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
    <AlertTitle className="text-amber-800 dark:text-amber-200">Important Installation Note</AlertTitle>
    <AlertDescription className="text-amber-700 dark:text-amber-300">
      Laundry Boss does NOT perform onsite construction or install kiosks due to local building codes 
      and requirements. We will place the kiosk on a pre-constructed opening only. If a card reader 
      has been ordered, we will mount it for you.
    </AlertDescription>
  </Alert>
)

export function KioskConfigStep() {
  const { nextStep, prevStep } = useOnboardingStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  const handleViewDimensions = () => {
    window.open(KIOSK_DIMENSIONS_PDF_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Kiosk Information</CardTitle>
            <CardDescription>Learn about the different kiosk options available for your laundromat</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Installation Note - Top */}
          <InstallationNote />

          {/* Kiosk Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Available Kiosk Types</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {kioskTypes.map((kiosk) => (
                <Card key={kiosk.name} className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-foreground">{kiosk.name}</CardTitle>
                    <CardDescription className="text-sm font-medium text-primary">{kiosk.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{kiosk.description}</p>
                    
                    {/* Payment Methods */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Accepted Payments
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {kiosk.paymentMethods.map((method) => (
                          <div 
                            key={method.label} 
                            className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md"
                          >
                            <method.icon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{method.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Key Features
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {kiosk.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Kiosk Dimensions Document */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Kiosk Dimensions & ADA Requirements</p>
                    <p className="text-sm text-muted-foreground">
                      View detailed specifications and installation requirements
                    </p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleViewDimensions}
                  className="shrink-0 bg-transparent"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ADA Requirements Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>ADA Height Requirements</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-3 text-sm">
                <div>
                  <p className="font-medium">Forward Reach Limits:</p>
                  <p>If accessible via forward reach and unobstructed, the highest touch point is 48 inches, minimum height is 15 inches.</p>
                </div>
                <div>
                  <p className="font-medium">Side Reach Limits:</p>
                  <p>If accessible via parallel approach and unobstructed, the highest touch point is 48 inches, minimum height is 15 inches.</p>
                </div>
                <p className="text-muted-foreground italic">
                  Note: For both forward and side reach limits, the base of the cabinet must measure 25&quot; from the floor.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Installation Note - Bottom */}
          <InstallationNote />

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
