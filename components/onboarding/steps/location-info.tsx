'use client'

import React from "react"

import { useOnboardingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { MapPin } from 'lucide-react'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export function LocationInfoStep() {
  const { formData, updateFormData, nextStep, prevStep } = useOnboardingStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  const updateHours = (day: string, value: string) => {
    updateFormData({
      hoursOfOperation: {
        ...formData.hoursOfOperation,
        [day]: value,
      },
    })
  }

  const updateCustomerServiceContact = (field: string, value: string) => {
    updateFormData({
      customerServiceContact: {
        ...formData.customerServiceContact,
        [field]: value,
      },
    })
  }

  const updateAlertsContact = (field: string, value: string) => {
    updateFormData({
      alertsContact: {
        ...formData.alertsContact,
        [field]: value,
      },
    })
  }

  const isValid = formData.locationName && formData.locationPhone && 
                  formData.locationAddress && formData.locationCity && 
                  formData.locationState && formData.locationZip

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Location Information</CardTitle>
            <CardDescription>Details about your laundromat location</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Basic Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="locationName">Common Location Name *</Label>
                <Input
                  id="locationName"
                  placeholder="Name as it appears on Google/signage"
                  value={formData.locationName}
                  onChange={(e) => updateFormData({ locationName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationPhone">Location Phone Number *</Label>
                <Input
                  id="locationPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.locationPhone}
                  onChange={(e) => updateFormData({ locationPhone: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isStaffed"
                checked={formData.isStaffed}
                onCheckedChange={(checked) => updateFormData({ isStaffed: checked })}
              />
              <Label htmlFor="isStaffed">Location is staffed daily</Label>
            </div>
          </div>

          {/* Laundromat Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Laundromat Address</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="locationAddress">Street Address *</Label>
                <Input
                  id="locationAddress"
                  placeholder="123 Main Street"
                  value={formData.locationAddress}
                  onChange={(e) => updateFormData({ locationAddress: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="locationCity">City *</Label>
                  <Input
                    id="locationCity"
                    placeholder="Philadelphia"
                    value={formData.locationCity}
                    onChange={(e) => updateFormData({ locationCity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationState">State *</Label>
                  <select
                    id="locationState"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.locationState}
                    onChange={(e) => updateFormData({ locationState: e.target.value })}
                    required
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationZip">ZIP Code *</Label>
                  <Input
                    id="locationZip"
                    placeholder="19101"
                    value={formData.locationZip}
                    onChange={(e) => updateFormData({ locationZip: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hours of Operation */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Hours of Operation</h3>
            <div className="grid gap-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <Label className="w-24 capitalize text-muted-foreground">{day}</Label>
                  <Input
                    placeholder="6:00 AM - 10:00 PM"
                    value={formData.hoursOfOperation[day] || ''}
                    onChange={(e) => updateHours(day, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Holidays */}
          <div className="space-y-2">
            <Label htmlFor="holidays">Holidays Closed</Label>
            <Textarea
              id="holidays"
              placeholder="e.g., Christmas Day, Thanksgiving, New Year's Day"
              value={formData.holidaysClosed}
              onChange={(e) => updateFormData({ holidaysClosed: e.target.value })}
              rows={2}
            />
          </div>

          {/* Customer Service Contact */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Customer Service Contact</h3>
              <p className="text-sm text-muted-foreground">
                Who should we contact regarding end customer service issues?
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Contact name"
                  value={formData.customerServiceContact.name}
                  onChange={(e) => updateCustomerServiceContact('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.customerServiceContact.phone}
                  onChange={(e) => updateCustomerServiceContact('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.customerServiceContact.email}
                  onChange={(e) => updateCustomerServiceContact('email', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Alerts Contact */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Alerts Contact</h3>
              <p className="text-sm text-muted-foreground">
                Who should receive service updates and product announcements?
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Contact name"
                  value={formData.alertsContact.name}
                  onChange={(e) => updateAlertsContact('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.alertsContact.phone}
                  onChange={(e) => updateAlertsContact('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="alerts@example.com"
                  value={formData.alertsContact.email}
                  onChange={(e) => updateAlertsContact('email', e.target.value)}
                />
              </div>
            </div>
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
