'use client'

import { useOnboardingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  ExternalLink, 
  CheckCircle2, 
  Clock,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react'
import { PAYMENT_LINK_LABELS } from '@/lib/types'
import type { Customer } from '@/lib/types'

interface PaymentStepProps {
  customer: Customer | null
}

export function PaymentStep({ customer }: PaymentStepProps) {
  const { nextStep, prevStep } = useOnboardingStore()

  // Get visible payment links
  const visiblePaymentLinks = (customer?.paymentLinks || []).filter(l => l.isVisible)
  const unpaidLinks = visiblePaymentLinks.filter(l => !l.isPaid)
  const paidLinks = visiblePaymentLinks.filter(l => l.isPaid)

  // Calculate totals
  const totalDue = unpaidLinks.reduce((sum, link) => sum + (link.amount || 0), 0)
  const totalPaid = paidLinks.reduce((sum, link) => sum + (link.amountPaid || link.amount || 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment
        </CardTitle>
        <CardDescription>
          Complete your payment to continue with the onboarding process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {visiblePaymentLinks.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Payment Required Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your administrator has not yet set up payment options for your account. 
              You can continue with the onboarding process and complete payment later.
            </p>
          </div>
        ) : (
          <>
            {/* Payment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {totalDue > 0 && (
                <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700 dark:text-amber-400">Amount Due</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    ${totalDue.toLocaleString()}
                  </p>
                </div>
              )}
              {totalPaid > 0 && (
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400">Amount Paid</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    ${totalPaid.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Unpaid Payment Links */}
            {unpaidLinks.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Payments Due
                </h3>
                {unpaidLinks.map((link) => (
                  <div 
                    key={link.id} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-900/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {link.type === 'other' ? link.customLabel : PAYMENT_LINK_LABELS[link.type]}
                        </p>
                        {link.amount && (
                          <p className="text-sm text-muted-foreground">
                            Amount: ${link.amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => window.open(link.link, '_blank')}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      Pay Now
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Paid Payment Links */}
            {paidLinks.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Completed Payments
                </h3>
                {paidLinks.map((link) => (
                  <div 
                    key={link.id} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 dark:bg-green-900/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {link.type === 'other' ? link.customLabel : PAYMENT_LINK_LABELS[link.type]}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Paid{link.amountPaid ? `: $${link.amountPaid.toLocaleString()}` : ''}
                          {link.paidAt && ` on ${new Date(link.paidAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-600">Paid</Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-muted/30 rounded-lg border">
              <h4 className="font-medium text-foreground mb-2">Payment Instructions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Click the "Pay Now" button to open the payment page in a new tab</li>
                <li>2. Complete your payment using the secure payment form</li>
                <li>3. Once payment is confirmed, your administrator will update your payment status</li>
                <li>4. You can continue to the next step even if payment is pending</li>
              </ul>
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button onClick={nextStep}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
