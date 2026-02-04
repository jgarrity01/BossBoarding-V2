'use client'

import React from "react"

import { cn } from '@/lib/utils'
import { 
  Check, 
  Building2, 
  MapPin, 
  Camera, 
  WashingMachine, 
  Users, 
  Truck, 
  Monitor, 
  CreditCard, 
  Shield, 
  DollarSign,
  CheckCircle2
} from 'lucide-react'
import { ONBOARDING_STEPS } from '@/lib/types'

interface StepIndicatorProps {
  currentStep: number
  highestStepReached?: number
  onStepClick?: (step: number) => void
}

const stepIcons: Record<string, React.ElementType> = {
  'general': Building2,
  'location': MapPin,
  'photos': Camera,
  'machines': WashingMachine,
  'employees': Users,
  'shipping': Truck,
  'kiosk': Monitor,
  'merchant': CreditCard,
  'pci': Shield,
  'payment': DollarSign,
  'review': CheckCircle2,
}

export function StepIndicator({ currentStep, highestStepReached = currentStep, onStepClick }: StepIndicatorProps) {
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100
  const maxNavigableStep = Math.max(currentStep, highestStepReached)

  return (
    <div className="w-full">
      {/* Mobile: Enhanced compact view */}
      <div className="lg:hidden">
        <div className="bg-gradient-to-r from-muted/80 to-muted/40 rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-4 mb-3">
            {/* Current Step Icon */}
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-lb-blue to-lb-cyan flex items-center justify-center shadow-lg shadow-lb-blue/20">
              {(() => {
                const IconComponent = stepIcons[ONBOARDING_STEPS[currentStep].id] || Building2
                return <IconComponent className="h-6 w-6 text-white" />
              })()}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Step {currentStep + 1} of {ONBOARDING_STEPS.length}
              </p>
              <h3 className="text-lg font-semibold text-foreground">
                {ONBOARDING_STEPS[currentStep].name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {ONBOARDING_STEPS[currentStep].description}
              </p>
            </div>
          </div>
          
          {/* Step Dots - Clickable Navigation */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {ONBOARDING_STEPS.map((step, index) => {
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep
              const isNavigable = index <= maxNavigableStep
              const isClickable = onStepClick && isNavigable
              
              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    isCurrent ? "w-6 bg-lb-blue" : "w-2",
                    isCompleted && "bg-lb-cyan",
                    !isCompleted && !isCurrent && isNavigable && "bg-lb-blue/50",
                    !isCompleted && !isCurrent && !isNavigable && "bg-muted-foreground/30",
                    isClickable && "cursor-pointer hover:scale-125",
                    !isClickable && "cursor-default"
                  )}
                  title={isClickable ? `Go to ${step.name}` : step.name}
                />
              )
            })}
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-lb-blue to-lb-cyan transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground">{Math.round(progress)}% complete</span>
              <span className="text-xs text-muted-foreground">
                {ONBOARDING_STEPS.length - currentStep - 1} steps remaining
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Full visual step view */}
      <div className="hidden lg:block">
        <div className="bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 rounded-2xl p-6 border border-border/50">
          {/* Progress Overview */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Onboarding Progress</h3>
              <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-lb-blue to-lb-cyan" />
                <span className="text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-lb-blue ring-2 ring-lb-cyan/30" />
                <span className="text-muted-foreground">Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-muted border border-border" />
                <span className="text-muted-foreground">Upcoming</span>
              </div>
            </div>
          </div>

          {/* Step Pills */}
          <div className="flex items-center gap-1">
            {ONBOARDING_STEPS.map((step, index) => {
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep
              const isNavigable = index <= maxNavigableStep
              const isClickable = onStepClick && isNavigable
              const IconComponent = stepIcons[step.id] || Building2

              return (
                <div 
                  key={step.id} 
                  className="flex-1 relative group"
                >
                  {/* Connector Line */}
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <div 
                      className={cn(
                        "absolute top-1/2 left-1/2 w-full h-0.5 -translate-y-1/2 z-0 transition-colors duration-300",
                        isCompleted ? "bg-gradient-to-r from-lb-cyan to-lb-cyan" : "bg-border"
                      )}
                    />
                  )}
                  
                  {/* Step Button */}
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => isClickable && onStepClick?.(index)}
                    className={cn(
                      "relative z-10 w-full flex flex-col items-center py-2 px-1 rounded-lg transition-all duration-200",
                      isClickable && "cursor-pointer hover:bg-background/50",
                      !isClickable && "cursor-default"
                    )}
                  >
                    {/* Icon Circle */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                        isCompleted && "bg-gradient-to-br from-lb-blue to-lb-cyan text-white shadow-md shadow-lb-blue/20",
                        isCurrent && "bg-lb-blue text-white ring-4 ring-lb-cyan/30 shadow-lg shadow-lb-blue/30 scale-110",
                        !isCompleted && !isCurrent && isNavigable && "bg-lb-blue/20 text-lb-blue border-2 border-lb-blue/50",
                        !isCompleted && !isCurrent && !isNavigable && "bg-muted text-muted-foreground border border-border"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <IconComponent className="h-5 w-5" />
                      )}
                    </div>
                    
                    {/* Step Label */}
                    <div className={cn(
                      "mt-2 text-center transition-opacity duration-200",
                      isCurrent ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                    )}>
                      <p className={cn(
                        "text-[10px] font-semibold leading-tight",
                        isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.name}
                      </p>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Current Step Description */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-lb-blue/10 flex items-center justify-center">
                {(() => {
                  const IconComponent = stepIcons[ONBOARDING_STEPS[currentStep].id] || Building2
                  return <IconComponent className="h-4 w-4 text-lb-blue" />
                })()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {ONBOARDING_STEPS[currentStep].name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ONBOARDING_STEPS[currentStep].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
