'use client'

import React from "react"

import { useOnboardingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Truck, Info } from 'lucide-react'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export function ShippingDetailsStep() {
  const { formData, updateFormData, nextStep, prevStep } = useOnboardingStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  // If same as location, validate location fields; otherwise validate shipping fields
  const isValid = formData.shippingSameAsLocation 
    ? (formData.locationAddress && formData.locationCity && formData.locationState && formData.locationZip)
    : (formData.shippingAddress && formData.shippingCity && formData.shippingState && formData.shippingZip)

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Shipping Details</CardTitle>
            <CardDescription>Where should we deliver your Laundry Boss system?</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipping Information */}
          <Alert className="bg-muted/50 border-muted">
            <Info className="h-4 w-4" />
            <AlertTitle>Shipping Information</AlertTitle>
            <AlertDescription>
              <p className="mt-2 text-sm">
                Your order may ship via <strong>LTL Freight</strong> or <strong>UPS</strong> depending on the size and contents. Our team will determine the best shipping method and contact you with details.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="p-3 bg-background rounded-md border">
                  <p className="font-medium text-sm">LTL Freight</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>For systems with kiosks or larger orders</li>
                    <li>Arrives on a pallet via freight truck</li>
                    <li>Carrier will schedule delivery appointment</li>
                    <li>Must be available to receive shipment</li>
                  </ul>
                </div>
                <div className="p-3 bg-background rounded-md border">
                  <p className="font-medium text-sm">UPS / Ground</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>For smaller shipments and accessories</li>
                    <li>Standard ground delivery</li>
                    <li>Tracking provided via email</li>
                    <li>No signature required unless specified</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Shipping Address - Same as Laundromat */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Shipping Address</Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border">
              <Checkbox
                id="sameAsLocation"
                checked={formData.shippingSameAsLocation}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateFormData({
                      shippingSameAsLocation: true,
                      shippingAddress: formData.locationAddress,
                      shippingCity: formData.locationCity,
                      shippingState: formData.locationState,
                      shippingZip: formData.locationZip,
                    })
                  } else {
                    updateFormData({ shippingSameAsLocation: false })
                  }
                }}
              />
              <Label htmlFor="sameAsLocation" className="cursor-pointer font-normal">
                Shipping address is the same as laundromat address
              </Label>
            </div>

            {!formData.shippingSameAsLocation && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <p className="text-sm font-medium text-foreground">Shipping Address Different from Laundromat Address</p>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    value={formData.shippingAddress}
                    onChange={(e) => updateFormData({ shippingAddress: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Philadelphia"
                      value={formData.shippingCity}
                      onChange={(e) => updateFormData({ shippingCity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <select
                      id="state"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.shippingState}
                      onChange={(e) => updateFormData({ shippingState: e.target.value })}
                      required
                    >
                      <option value="">Select state</option>
                      {US_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input
                      id="zip"
                      placeholder="19101"
                      value={formData.shippingZip}
                      onChange={(e) => updateFormData({ shippingZip: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}
            
            {formData.shippingSameAsLocation && formData.locationAddress && (
              <div className="p-3 bg-muted/30 rounded-lg text-sm">
                <p className="text-muted-foreground">Shipping to:</p>
                <p className="font-medium">{formData.locationAddress}</p>
                <p>{formData.locationCity}, {formData.locationState} {formData.locationZip}</p>
              </div>
            )}
          </div>

          {/* Delivery Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Delivery Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions for the driver (loading dock info, access codes, best times, etc.)"
              value={formData.shippingNotes}
              onChange={(e) => updateFormData({ shippingNotes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Need to modify your shipping address?</p>
            <p>
              Please email our Onboarding Manager at{' '}
              <a href="mailto:onboarding@thelaundryboss.com" className="text-lb-blue hover:text-lb-cyan transition-colors">
                onboarding@thelaundryboss.com
              </a>
            </p>
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
