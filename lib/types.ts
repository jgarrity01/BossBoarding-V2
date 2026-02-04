// BOSSBoarding Types

export type OnboardingStatus = 'not_started' | 'in_progress' | 'needs_review' | 'complete'

export type PrivilegeLevel = 'admin' | 'attendant' | 'employee'

export type MachineType = 'washer' | 'dryer'

export type CoinType = 'quarter' | 'dollar' | 'token' | 'none'

export interface Employee {
  id: string
  name: string
  phone: string
  pin: string
  privilegeLevel: PrivilegeLevel
}

export interface Machine {
  id: string
  machineNumber: number
  type: MachineType
  make: string
  model: string
  serialNumber: string
  coinsAccepted: CoinType
  pricing: {
    cold?: number
    warm?: number
    hot?: number
    standard?: number
  }
  afterMarketUpgrades?: string
}

export interface LocationInfo {
  commonName: string
  phoneNumber: string
  address: string
  city: string
  state: string
  zipCode: string
  isStaffed: boolean
  hoursOfOperation: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  holidaysClosed: string[]
  customerServiceContact: {
    name: string
    phone: string
    email: string
  }
  alertsContact: {
    name: string
    phone: string
    email: string
  }
}

export interface ShippingInfo {
  sameAsLocation: boolean
  address: string
  city: string
  state: string
  zipCode: string
  notes: string
  shipmentMethod: 'ltl_freight' | 'ups' | 'other'
}

export interface PCICompliance {
  representativeName: string
  companyName: string
  title: string
  consentDate: string
  hasConsented: boolean
}

export type KioskType = 'rear_load' | 'front_load' | 'credit_bill' | 'credit_only'

export interface Kiosk {
  id: string
  type: KioskType
  quantity: number
  adaCompliant: boolean
  serialNumber?: string
  notes?: string
}

export interface KioskInfo {
  hasKiosk: boolean
  kiosks: Kiosk[]
}

export interface MerchantAccount {
  status: 'pending' | 'submitted' | 'boarded' | 'active'
  applicationDate?: string
  boardedDate?: string
}

export type PaymentProcessorType = 'cardpointe' | 'clover' | 'paystri' | 'other'

export interface PaymentProcessor {
  id: string
  type: PaymentProcessorType
  name: string // For 'other' type, custom name
  link: string
  isDefault: boolean
  addedAt: string
  addedBy: string
}

// Default Paystri link for all customers
export const DEFAULT_PAYSTRI_LINK = 'https://insights.paystri.com/laundryboss-self-registration'

// Generate a unique onboarding token (8 characters, alphanumeric)
export function generateOnboardingToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let token = ''
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Payment Link types
export type PaymentLinkType = 'full_payment' | '1st_installment' | '2nd_installment' | 'final_installment' | 'other'

export interface PaymentLink {
  id: string
  type: PaymentLinkType
  customLabel?: string // For 'other' type
  link: string
  amount?: number
  dueDate?: string // ISO date string for when payment is due
  isVisible: boolean
  isPaid: boolean
  amountPaid?: number
  paidAt?: string
  addedAt: string
  addedBy: string
}

export const PAYMENT_LINK_LABELS: Record<PaymentLinkType, string> = {
  'full_payment': 'Full Payment',
  '1st_installment': '1st Installment',
  '2nd_installment': '2nd Installment',
  'final_installment': 'Final Installment',
  'other': 'Other',
}

export interface OnboardingSection {
  id: string
  name: string
  status: OnboardingStatus
  completedAt?: string
  data?: Record<string, unknown>
}

export interface CustomerNote {
  id: string
  content: string
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
  isEdited: boolean
}

// Sales Rep Assignment
export interface SalesRepAssignment {
  salesRepId: string
  salesRepName: string
  commissionPercent: number
}

// Sales Rep definition
export interface SalesRep {
  id: string
  name: string
  email: string
}

// Predefined Sales Reps
export const SALES_REPS: SalesRep[] = [
  { id: 'sr1', name: 'Jim Law', email: 'jlaw@laundryboss.com' },
  { id: 'sr2', name: 'John Altieri', email: 'jaltieri@laundryboss.com' },
  { id: 'sr3', name: 'Gary Rantz', email: 'grantz@laundryboss.com' },
  { id: 'sr4', name: 'Jim Garrity', email: 'jgarrity@laundryboss.com' },
]

// Onboarding Date Estimation
export interface OnboardingDates {
  startDate: string // Date onboarding began
  estimatedCompletionDate: string // Default: startDate + 4 weeks
  aiEstimatedDate?: string // AI-calculated based on task velocity
  actualCompletionDate?: string // When actually completed
  adminOverrideDate?: string // Admin-set override date
  useAdminOverride: boolean // Whether to use admin override
}

export type TaskStatus = 'not_started' | 'in_progress' | 'complete'

export interface TaskCompletion {
  taskId: string
  status: TaskStatus
  completedAt?: string
  completedBy?: string
}

export interface Customer {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  createdAt: string
  updatedAt: string
  status: OnboardingStatus
  
  // Unique onboarding link token
  onboardingToken: string
  onboardingStarted: boolean // Has customer started their onboarding journey
  onboardingCompleted: boolean // Has customer completed their onboarding journey
  currentStep: number
  totalSteps: number
  sections: OnboardingSection[]
  taskStatuses: Record<string, TaskStatus> // Task ID -> Status
  taskMetadata: Record<string, { updatedBy: string; updatedAt: string }> // Task ID -> Metadata
  currentStageId: string
  locationInfo?: LocationInfo
  shippingInfo?: ShippingInfo
  pciCompliance?: PCICompliance
  kioskInfo?: KioskInfo
  merchantAccount?: MerchantAccount
  employees: Employee[]
  machines: Machine[]
  dashboardCredentials?: {
    username: string
    password?: string // In production, this would be hashed
    passwordSet: boolean
  }
  // Saved form data for resuming onboarding
  savedOnboardingData?: {
    currentStep: number
    formData: Record<string, unknown>
    savedAt: string
  }
  
  // Store media (photos/videos)
  storeMedia?: Array<{
    id: string
    type: 'image' | 'video'
    url: string
    name: string
    description?: string
    uploadedAt: string
    uploadedBy?: string
  }>
  
  // Store Logo
  storeLogo?: {
    id: string
    url: string
    name: string
    uploadedAt: string
    uploadedBy?: string
  }
  contractSigned: boolean
  contractSignedDate?: string
  installationDate?: string
  goLiveDate?: string
  notes: CustomerNote[]
  
  // Sales Rep Assignments and Deal Info
  // Revenue Breakdown (these three add up to dealAmount)
  nonRecurringRevenue: number // Install Fees, Shipping, Kiosks, etc.
  monthlyRecurringFee: number // Monthly recurring fee
  otherFees: number // Other fees
  dealAmount?: number // Total deal value (calculated from above)
  cogs: number // Cost of Goods Sold
  // Net Deal Amount = dealAmount - cogs (calculated, not stored)
  commissionRate: number // Default 10%, commission on Net Deal Amount
  paymentTermMonths: number // Default 48 months for monthly payment calculation
  salesRepAssignments: SalesRepAssignment[]
  
  // Payment Tracking
  paymentStatus: 'unpaid' | 'paid_partial' | 'paid_in_full'
  paidToDateAmount: number // Amount paid so far
  commissionPaidAmount: number // Commission already paid out
  paidDate?: string // Date when paid in full
  
  // Onboarding Date Tracking
  onboardingDates?: OnboardingDates
  
  // Payment Processors
  paymentProcessors: PaymentProcessor[]
  
  // Payment Links
  paymentLinks: PaymentLink[]
}

export interface OnboardingTask {
  id: string
  name: string
  team: string
  status: 'open' | 'closed'
  priority: 'low' | 'medium' | 'high'
  description: string
  dueDate?: string
  completedDate?: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  createdAt: string
}

export const ONBOARDING_STEPS = [
  { id: 'general', name: 'General Info', description: 'Owner and business details', icon: 'building' },
  { id: 'location', name: 'Location', description: 'Store details and contacts', icon: 'map-pin' },
  { id: 'photos', name: 'Store Photos', description: 'Upload photos of your laundromat', icon: 'camera' },
  { id: 'machines', name: 'Machines', description: 'Washer and dryer information', icon: 'washing-machine' },
  { id: 'employees', name: 'Employees', description: 'Staff and privilege levels', icon: 'users' },
  { id: 'shipping', name: 'Shipping', description: 'Delivery address and preferences', icon: 'truck' },
  { id: 'kiosk', name: 'Kiosk', description: 'Kiosk types and dimensions', icon: 'monitor' },
  { id: 'merchant', name: 'Merchant', description: 'Payment processing setup', icon: 'credit-card' },
  { id: 'pci', name: 'PCI', description: 'Compliance consent and verification', icon: 'shield' },
  { id: 'payment', name: 'Payment', description: 'Complete your payment', icon: 'dollar-sign' },
  { id: 'review', name: 'Review', description: 'Final review before submission', icon: 'check-circle' },
] as const

// Default sections for new customers (used when creating customers from admin)
export const ONBOARDING_SECTIONS: OnboardingSection[] = [
  { id: 'general', name: 'General Info', status: 'not_started' },
  { id: 'location', name: 'Location', status: 'not_started' },
  { id: 'photos', name: 'Store Photos', status: 'not_started' },
  { id: 'machines', name: 'Machines', status: 'not_started' },
  { id: 'employees', name: 'Employees', status: 'not_started' },
  { id: 'shipping', name: 'Shipping', status: 'not_started' },
  { id: 'kiosk', name: 'Kiosk', status: 'not_started' },
  { id: 'merchant', name: 'Merchant', status: 'not_started' },
  { id: 'pci', name: 'PCI', status: 'not_started' },
  { id: 'payment', name: 'Payment', status: 'not_started' },
  { id: 'review', name: 'Review', status: 'not_started' },
]

// EmailJS Configuration
export interface EmailJSConfig {
  serviceId: string
  publicKey: string
  templates: {
    welcomeEmail: string
    kickoffEmail: string
    statusUpdate: string
    taskReminder: string
    completionNotice: string
  }
}

// Admin User for authentication
export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'staff'
  createdAt: string
  lastLogin?: string
  permissions: string[]
}

// Customer User for authentication
export interface CustomerUser {
  id: string
  customerId: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

export const ZOHO_TASKS: OnboardingTask[] = [
  { id: '1', name: 'Send Contract', team: 'Sales, Onboarding', status: 'open', priority: 'high', description: 'Draft contract in send in Adobe Sign for customer signature.' },
  { id: '2', name: 'Confirm Contract Sent to Accounting', team: 'Operations, Onboarding', status: 'open', priority: 'high', description: 'Forward signed contract and pertinent financials to accounting.' },
  { id: '3', name: 'Send Welcome Packet', team: 'Onboarding', status: 'open', priority: 'high', description: 'Send standard welcome email and welcome packet to the customer.' },
  { id: '4', name: 'Schedule Internal Kickoff Call', team: 'Onboarding', status: 'open', priority: 'high', description: 'Schedule Internal Kickoff Call with Sales.' },
  { id: '5', name: 'Host Internal Kickoff Call', team: 'Onboarding', status: 'open', priority: 'high', description: 'Host internal call with sales to discuss customer location.' },
  { id: '6', name: 'Send Customer Kickoff Email', team: 'Onboarding', status: 'open', priority: 'high', description: 'Send Customer Kickoff email to customer.' },
  { id: '7', name: 'Hold Kickoff Call', team: 'Onboarding', status: 'open', priority: 'high', description: 'Host kickoff call with customer to set the table for the onboarding process.' },
  { id: '8', name: 'Review Matterport and Machine List', team: 'Operations, Onboarding', status: 'open', priority: 'high', description: 'Review preinstall Matterport as well as the Machine list to confirm accuracy.' },
  { id: '9', name: 'Draft Location Layout', team: 'Operations', status: 'open', priority: 'high', description: 'Using data provided, draft a location layout to submit to the customer.' },
  { id: '10', name: 'Get Written Customer Approval', team: 'Onboarding', status: 'open', priority: 'high', description: 'Email location layouts to customer for written approval.' },
  { id: '11', name: 'Add Machine Groups/Lists', team: 'Production', status: 'open', priority: 'medium', description: 'Using the machine list, add machine groups and lists to the location Dashboard.' },
  { id: '12', name: 'Enter Employee Information', team: 'Operations', status: 'open', priority: 'medium', description: 'Using the location information sheet, add any employees to the dashboard.' },
  { id: '13', name: 'Create Merchant Account', team: 'Operations', status: 'open', priority: 'high', description: 'Begin merchant application and email to customer via CardConnect.' },
  { id: '14', name: 'Send Login Credentials', team: 'Operations', status: 'open', priority: 'medium', description: 'Create login credentials and email to customer.' },
  { id: '15', name: 'Confirm Dashboard Completion', team: 'Onboarding', status: 'open', priority: 'high', description: 'Confirm Dashboard is complete with Onboarding and Production Managers.' },
  { id: '16', name: 'Confirm Merchant Account Boarded', team: 'Onboarding', status: 'open', priority: 'high', description: 'Confirm Merchant Account is Boarded.' },
  { id: '17', name: 'Trigger Shipment', team: 'Production, Operations', status: 'open', priority: 'high', description: 'Trigger shipment with UPS or R&L Carriers for customer order.' },
  { id: '18', name: 'Send Tracking to Customer', team: 'Onboarding', status: 'open', priority: 'high', description: 'Forward tracking information to Customer.' },
  { id: '19', name: 'Pre-Install Walkthrough', team: 'Operations, Onboarding', status: 'open', priority: 'high', description: 'Perform preinstall walk-through and testing with owner.' },
  { id: '20', name: 'TLB Installation', team: 'Onboarding', status: 'open', priority: 'high', description: 'Designate Laundry Boss Installer and complete installation.' },
  { id: '21', name: 'Provide Training', team: 'Operations, Onboarding', status: 'open', priority: 'high', description: 'Provide full system training with customer and any attendants.' },
  { id: '22', name: 'Post-Install Walkthrough', team: 'Operations, Onboarding', status: 'open', priority: 'high', description: 'Walk through the location with owner highlighting any open items.' },
  { id: '23', name: '2-3 Week Check-In', team: 'Onboarding', status: 'open', priority: 'high', description: 'Install Manager to send follow-up email to customer.' },
]
