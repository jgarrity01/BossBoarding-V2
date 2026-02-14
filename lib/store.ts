"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Customer,
  Employee,
  Machine,
  OnboardingSection,
  OnboardingStatus,
  AdminUser,
  CustomerUser,
  Kiosk,
  CustomerNote,
  TaskStatus,
  PaymentProcessor,
  PaymentLink,
} from "./types";
import { getDefaultTaskStatuses, ONBOARDING_STAGES } from "./onboarding-config";
import { syncCustomerToSupabase } from "./supabase/sync";

// Submission types for the portal
export interface OnboardingSubmission {
  id: string;
  submittedAt: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  generalInfo: {
    companyName: string;
    primaryContactName: string;
    email: string;
    phone: string;
  };
  locationInfo: {
    locationName: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    locationType: string;
    squareFootage: string;
    hoursOfOperation: string;
    hasInternetAccess: boolean;
    hasADACompliance: boolean;
  };
  machineInventory: {
    machines: Array<{
      id: string;
      type: string;
      manufacturer: string;
      model: string;
      serialNumber: string;
      locationInStore: string;
      cyclePrice: number;
    }>;
  };
  employeeSetup: {
    employees: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      role: string;
      permissions: string[];
    }>;
  };
  shippingDetails: {
    shippingAddress: string;
    deliveryMethod: string;
    hasDockOrLiftgate: boolean;
    preferredDeliveryDate: string;
    specialInstructions: string;
  };
  kioskConfig: {
    kioskType: string;
    hasExistingKiosk: boolean;
  };
  merchantAccount: {
    hasExistingAccount: boolean;
    merchantId: string;
  };
  pciCompliance: {
    consentGiven: boolean;
    signedDate: string;
    representativeName: string;
  };
  projectTasks: Array<{
    id: string;
    name: string;
    status: "pending" | "in-progress" | "completed";
    dueDate?: string;
  }>;
}

interface OnboardingFormData {
  // General Info
  businessName: string
  ownerName: string
  email: string
  phone: string
  
  // Account Setup (for portal login)
  password: string
  confirmPassword: string
  
  // Location Info
  locationName: string
  locationPhone: string
  locationAddress: string
  locationCity: string
  locationState: string
  locationZip: string
  isStaffed: boolean
  hoursOfOperation: Record<string, string>
  holidaysClosed: string
  customerServiceContact: { name: string; phone: string; email: string }
  alertsContact: { name: string; phone: string; email: string }
  
  // Shipping
  shippingSameAsLocation: boolean
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingNotes: string
  shipmentMethod: 'ltl_freight' | 'ups' | 'other'
  
  // Kiosks (multiple)
  hasKiosk: boolean
  kiosks: Kiosk[]
  
  // PCI
  pciRepresentativeName: string
  pciCompanyName: string
  pciTitle: string
  pciConsent: boolean
  
  // Machines & Employees
  machines: Machine[]
  employees: Employee[]
  
  // Store Photos/Videos
  storeMedia: Array<{
    id: string
    type: 'image' | 'video'
    url: string
    name: string
    description?: string
    uploadedAt: string
  }>
  
  // Store Logo
  storeLogo?: {
    id: string
    url: string
    name: string
    uploadedAt: string
  }
}

interface OnboardingStore {
  // Current onboarding session
  currentStep: number
  highestStepReached: number // Track the furthest step completed for navigation
  formData: OnboardingFormData
  isSubmitting: boolean
  customerId: string | null // ID of existing customer being onboarded
  onboardingToken: string | null // Token for this onboarding session
  
  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateFormData: (data: Partial<OnboardingFormData>) => void
  addMachine: (machine: Machine) => void
  updateMachine: (id: string, machine: Partial<Machine>) => void
  removeMachine: (id: string) => void
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, employee: Partial<Employee>) => void
  removeEmployee: (id: string) => void
  resetForm: () => void
  setSubmitting: (value: boolean) => void
  initializeFromCustomer: (customerId: string, token: string, data: Partial<OnboardingFormData>, savedStep?: number, highestStep?: number) => void
  }

interface AdminStore {
  // Customer management
  customers: Customer[]
  selectedCustomerId: string | null
  
  // Filters
  statusFilter: OnboardingStatus | 'all'
  searchQuery: string
  
  // Actions
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, data: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
  selectCustomer: (id: string | null) => void
  getCustomerByToken: (token: string) => Customer | undefined
  setStatusFilter: (status: OnboardingStatus | 'all') => void
  setSearchQuery: (query: string) => void
  
  // Customer section actions
  updateCustomerSection: (customerId: string, sectionId: string, data: Partial<OnboardingSection>) => void
  
  // Update local store from database WITHOUT syncing back (prevents loops)
  setCustomerFromDatabase: (id: string, data: Partial<Customer>) => void
  
  // Machine management
  addCustomerMachine: (customerId: string, machine: Machine) => void
  updateCustomerMachine: (customerId: string, machineId: string, data: Partial<Machine>) => void
  deleteCustomerMachine: (customerId: string, machineId: string) => void
  reorderCustomerMachines: (customerId: string, machines: Machine[]) => void
  
  // Note management
  addCustomerNote: (customerId: string, note: CustomerNote) => void
  updateCustomerNote: (customerId: string, noteId: string, content: string, updatedBy: string) => void
  deleteCustomerNote: (customerId: string, noteId: string) => void
  
  // Task management
  updateTaskStatus: (customerId: string, taskId: string, status: TaskStatus, updatedBy?: string) => void
  updateStageTasksStatus: (customerId: string, stageId: string, status: TaskStatus, updatedBy?: string) => void
  updateCurrentStage: (customerId: string, stageId: string) => void
  
  // Payment processor management
  addPaymentProcessor: (customerId: string, processor: PaymentProcessor) => void
  updatePaymentProcessor: (customerId: string, processorId: string, data: Partial<PaymentProcessor>) => void
  deletePaymentProcessor: (customerId: string, processorId: string) => void
  
  // Payment link management
  addPaymentLink: (customerId: string, link: PaymentLink) => void
  updatePaymentLink: (customerId: string, linkId: string, data: Partial<PaymentLink>) => void
  deletePaymentLink: (customerId: string, linkId: string) => void
  }

const initialFormData: OnboardingFormData = {
  businessName: '',
  ownerName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  locationName: '',
  locationPhone: '',
  locationAddress: '',
  locationCity: '',
  locationState: '',
  locationZip: '',
  isStaffed: false,
  hoursOfOperation: {
  monday: '6:00 AM - 10:00 PM',
  tuesday: '6:00 AM - 10:00 PM',
  wednesday: '6:00 AM - 10:00 PM',
  thursday: '6:00 AM - 10:00 PM',
  friday: '6:00 AM - 10:00 PM',
  saturday: '6:00 AM - 10:00 PM',
  sunday: '6:00 AM - 10:00 PM',
  },
  holidaysClosed: '',
  customerServiceContact: { name: '', phone: '', email: '' },
  alertsContact: { name: '', phone: '', email: '' },
  shippingSameAsLocation: true,
  shippingAddress: '',
  shippingCity: '',
  shippingState: '',
  shippingZip: '',
  shippingNotes: '',
  shipmentMethod: 'ltl_freight',
  hasKiosk: false,
  kiosks: [],
  pciRepresentativeName: '',
  pciCompanyName: '',
  pciTitle: '',
  pciConsent: false,
  machines: [],
  employees: [],
  storeMedia: [],
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
  (set) => ({
  currentStep: 0,
  highestStepReached: 0,
  formData: initialFormData,
  isSubmitting: false,
  customerId: null,
  onboardingToken: null,
  
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ 
    currentStep: Math.min(state.currentStep + 1, 10),
    highestStepReached: Math.max(state.highestStepReached, Math.min(state.currentStep + 1, 10))
  })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
      
      updateFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
      })),
      
      addMachine: (machine) => set((state) => ({
        formData: { ...state.formData, machines: [...state.formData.machines, machine] }
      })),
      
      updateMachine: (id, machine) => set((state) => ({
        formData: {
          ...state.formData,
          machines: state.formData.machines.map((m) =>
            m.id === id ? { ...m, ...machine } : m
          )
        }
      })),
      
      removeMachine: (id) => set((state) => ({
        formData: {
          ...state.formData,
          machines: state.formData.machines.filter((m) => m.id !== id)
        }
      })),
      
      addEmployee: (employee) => set((state) => ({
        formData: { ...state.formData, employees: [...state.formData.employees, employee] }
      })),
      
      updateEmployee: (id, employee) => set((state) => ({
        formData: {
          ...state.formData,
          employees: state.formData.employees.map((e) =>
            e.id === id ? { ...e, ...employee } : e
          )
        }
      })),
      
      removeEmployee: (id) => set((state) => ({
        formData: {
          ...state.formData,
          employees: state.formData.employees.filter((e) => e.id !== id)
        }
      })),
      
  resetForm: () => set({ currentStep: 0, highestStepReached: 0, formData: initialFormData, isSubmitting: false, customerId: null, onboardingToken: null }),
  setSubmitting: (value) => set({ isSubmitting: value }),
  initializeFromCustomer: (customerId, token, data, savedStep, highestStep) => set({
  customerId,
  onboardingToken: token,
  currentStep: savedStep ?? 0,
  highestStepReached: highestStep ?? savedStep ?? 0,
  formData: { ...initialFormData, ...data },
  isSubmitting: false,
  }),
  }),
  {
  name: 'johnboarding-onboarding-v4',
  partialize: (state) => {
  // Strip machines and employees from formData before persisting.
  // Machine/employee data MUST always come from the database (source of truth).
  // Persisting them to localStorage causes stale data and duplication.
  const { machines: _m, employees: _e, ...safeFormData } = state.formData
  return {
    customerId: state.customerId,
    onboardingToken: state.onboardingToken,
    currentStep: state.currentStep,
    highestStepReached: state.highestStepReached,
    formData: safeFormData,
  }
  },
    }
  )
)

// Sample customers for demo
const sampleCustomers: Customer[] = [
  {
  id: '1',
  businessName: 'Clean & Fresh Laundromat',
  ownerName: 'John Smith',
  email: 'john@cleanfresh.com',
  phone: '(555) 123-4567',
  createdAt: '2025-01-10T10:00:00Z',
  updatedAt: '2025-01-15T14:30:00Z',
  status: 'in_progress',
  onboardingToken: 'CF8mXn2k',
  onboardingStarted: true,
  onboardingCompleted: false,
  currentStep: 4,
  totalSteps: 57,
  currentStageId: 'planning_layout',
  taskStatuses: {
    // Contract & Setup - Complete
    confirm_data: 'complete',
    send_contract: 'complete',
    confirm_contract_sent: 'complete',
    send_welcome_packet: 'complete',
    inventory_check: 'complete',
    add_customer_cp: 'complete',
    add_customer_salesforce: 'complete',
    add_contact_zoom: 'complete',
    // Internal Kickoff - Complete
    schedule_internal_kickoff: 'complete',
    host_internal_call: 'complete',
    confirm_matterport_complete: 'complete',
    send_matterport: 'complete',
    send_customer_kickoff_email: 'complete',
    confirm_date_of_call: 'complete',
    hold_kickoff_call: 'complete',
    // Planning & Layout - In Progress
    review_matterport_machine_list: 'complete',
    draft_location_layout: 'in_progress',
    get_written_approval: 'not_started',
    prepare_docs_production: 'not_started',
    prepare_work_order: 'not_started',
    work_order_issued: 'not_started',
    // Rest not started
    ...Object.fromEntries(
      ONBOARDING_STAGES.slice(3).flatMap(s => s.tasks).map(t => [t.id, 'not_started'])
    ),
  },
  taskMetadata: {
    confirm_data: { updatedBy: 'John Admin', updatedAt: '2025-01-10T10:00:00Z' },
    send_contract: { updatedBy: 'John Admin', updatedAt: '2025-01-10T11:00:00Z' },
    draft_location_layout: { updatedBy: 'Sarah Tech', updatedAt: '2025-01-15T14:30:00Z' },
  },
  sections: [
  { id: 'general', name: 'General Information', status: 'complete', completedAt: '2025-01-10T10:30:00Z' },
  { id: 'location', name: 'Location Information', status: 'complete', completedAt: '2025-01-11T09:15:00Z' },
  { id: 'machines', name: 'Machine Inventory', status: 'complete', completedAt: '2025-01-12T11:00:00Z' },
  { id: 'employees', name: 'Employee Setup', status: 'in_progress' },
  { id: 'shipping', name: 'Shipping Details', status: 'not_started' },
  { id: 'kiosk', name: 'Kiosk Configuration', status: 'not_started' },
  { id: 'merchant', name: 'Merchant Account', status: 'not_started' },
  { id: 'pci', name: 'PCI Compliance', status: 'not_started' },
  { id: 'review', name: 'Review & Submit', status: 'not_started' },
  ],
    employees: [],
    machines: [],
    contractSigned: true,
    contractSignedDate: '2025-01-09T16:00:00Z',
    notes: [
      {
        id: 'n1',
        content: 'Customer requested rear-load kiosk installation.',
        createdAt: '2025-01-10T10:30:00Z',
        createdBy: 'Admin',
        isEdited: false,
      },
      {
        id: 'n2',
        content: 'Confirmed shipping address with customer via phone.',
        createdAt: '2025-01-12T14:15:00Z',
        createdBy: 'Admin',
        isEdited: false,
      },
    ],
    nonRecurringRevenue: 8000, // Install, shipping, kiosks
    monthlyRecurringFee: 145.83, // Monthly fee x 48 months = 7000
    otherFees: 0,
    dealAmount: 15000, // 8000 + (145.83 * 48) + 0
    cogs: 0, // Cost of Goods Sold
    commissionRate: 10,
    paymentTermMonths: 48,
    salesRepAssignments: [
      { salesRepId: 'sr1', salesRepName: 'Jim Law', commissionPercent: 60 },
      { salesRepId: 'sr4', salesRepName: 'Jim Garrity', commissionPercent: 40 },
    ],
    paymentStatus: 'paid_partial',
    paidToDateAmount: 5000,
    commissionPaidAmount: 300,
    onboardingDates: {
      startDate: '2025-01-10T10:00:00Z',
      estimatedCompletionDate: '2025-02-07T10:00:00Z',
      useAdminOverride: false,
    },
  },
  {
  id: '2',
  businessName: 'Sparkle Wash Center',
  ownerName: 'Sarah Johnson',
  email: 'sarah@sparklewash.com',
  phone: '(555) 987-6543',
  createdAt: '2025-01-05T08:00:00Z',
  updatedAt: '2025-01-18T16:45:00Z',
  status: 'needs_review',
  onboardingToken: 'SWc3Tp9r',
  onboardingStarted: true,
  onboardingCompleted: true,
    currentStep: 9,
    totalSteps: 57,
    currentStageId: 'shipment',
    taskStatuses: {
      // Contract through Production complete
      ...Object.fromEntries(
        ONBOARDING_STAGES.slice(0, 4).flatMap(s => s.tasks).map(t => [t.id, 'complete'])
      ),
      // Pre-Ship - Complete
      create_merchant_account: 'complete',
      send_login_credentials: 'complete',
      confirm_dashboard_completion: 'complete',
      confirm_merchant_boarded: 'complete',
      onboarding_manager_communication: 'complete',
      install_date_shared: 'complete',
      travel_arrangements: 'complete',
      // Shipment - In Progress
      shipment_review_checklist: 'in_progress',
      shipment_triggered: 'not_started',
      tracking_sent: 'not_started',
      // Rest not started
      ...Object.fromEntries(
        ONBOARDING_STAGES.slice(6).flatMap(s => s.tasks).map(t => [t.id, 'not_started'])
      ),
    },
    taskMetadata: {
      shipment_review_checklist: { updatedBy: 'Mike Ops', updatedAt: '2025-01-18T09:00:00Z' },
    },
    sections: [
      { id: 'general', name: 'General Information', status: 'complete', completedAt: '2025-01-05T09:00:00Z' },
      { id: 'location', name: 'Location Information', status: 'complete', completedAt: '2025-01-06T10:30:00Z' },
      { id: 'machines', name: 'Machine Inventory', status: 'complete', completedAt: '2025-01-07T14:00:00Z' },
      { id: 'employees', name: 'Employee Setup', status: 'complete', completedAt: '2025-01-08T11:15:00Z' },
      { id: 'shipping', name: 'Shipping Details', status: 'complete', completedAt: '2025-01-09T09:45:00Z' },
      { id: 'kiosk', name: 'Kiosk Configuration', status: 'complete', completedAt: '2025-01-10T13:30:00Z' },
      { id: 'merchant', name: 'Merchant Account', status: 'complete', completedAt: '2025-01-12T10:00:00Z' },
      { id: 'pci', name: 'PCI Compliance', status: 'needs_review' },
      { id: 'review', name: 'Review & Submit', status: 'needs_review' },
    ],
    employees: [
      { id: 'e1', name: 'Mike Brown', phone: '(555) 111-2222', pin: '1234', privilegeLevel: 'admin' },
      { id: 'e2', name: 'Lisa Davis', phone: '(555) 333-4444', pin: '5678', privilegeLevel: 'attendant' },
    ],
    machines: [],
    contractSigned: true,
    contractSignedDate: '2025-01-04T12:00:00Z',
    installationDate: '2025-02-15T09:00:00Z',
    notes: [
      {
        id: 'n3',
        content: 'Large location with 45 machines. Needs PCI review.',
        createdAt: '2025-01-05T09:00:00Z',
        createdBy: 'Admin',
        isEdited: false,
      },
      {
        id: 'n4',
        content: 'PCI compliance documents received via email.',
        createdAt: '2025-01-15T11:30:00Z',
        createdBy: 'Admin',
        updatedAt: '2025-01-16T09:00:00Z',
        updatedBy: 'Admin',
        isEdited: true,
      },
    ],
    nonRecurringRevenue: 12000,
    monthlyRecurringFee: 343.75, // x 48 = 16500
    otherFees: 0,
    dealAmount: 28500,
    cogs: 0,
    commissionRate: 10,
    paymentTermMonths: 48,
    salesRepAssignments: [
      { salesRepId: 'sr2', salesRepName: 'John Altieri', commissionPercent: 100 },
    ],
    paymentStatus: 'paid_in_full',
    paidToDateAmount: 28500,
    commissionPaidAmount: 2850,
    paidDate: '2025-01-20T10:00:00Z',
    onboardingDates: {
      startDate: '2025-01-05T08:00:00Z',
      estimatedCompletionDate: '2025-02-02T08:00:00Z',
      aiEstimatedDate: '2025-02-10T08:00:00Z',
      useAdminOverride: false,
    },
  },
  {
    id: '3',
    businessName: 'QuickDry Laundry',
    ownerName: 'Michael Chen',
    email: 'michael@quickdry.com',
    phone: '(555) 456-7890',
    createdAt: '2025-01-18T14:00:00Z',
    updatedAt: '2025-01-18T14:00:00Z',
    status: 'not_started',
    onboardingToken: 'QDr7Km4p',
    onboardingStarted: false,
    onboardingCompleted: false,
    currentStep: 0,
    totalSteps: 57,
    currentStageId: 'contract_setup',
    taskStatuses: getDefaultTaskStatuses(),
    taskMetadata: {},
    sections: [
      { id: 'general', name: 'General Information', status: 'not_started' },
      { id: 'location', name: 'Location Information', status: 'not_started' },
      { id: 'machines', name: 'Machine Inventory', status: 'not_started' },
      { id: 'employees', name: 'Employee Setup', status: 'not_started' },
      { id: 'shipping', name: 'Shipping Details', status: 'not_started' },
      { id: 'kiosk', name: 'Kiosk Configuration', status: 'not_started' },
      { id: 'merchant', name: 'Merchant Account', status: 'not_started' },
      { id: 'pci', name: 'PCI Compliance', status: 'not_started' },
      { id: 'review', name: 'Review & Submit', status: 'not_started' },
    ],
    employees: [],
    machines: [],
    contractSigned: true,
    contractSignedDate: '2025-01-17T11:00:00Z',
    notes: [
      {
        id: 'n5',
        content: 'New customer - waiting for kickoff call.',
        createdAt: '2025-01-18T14:00:00Z',
        createdBy: 'Admin',
        isEdited: false,
      },
    ],
    nonRecurringRevenue: 5000,
    monthlyRecurringFee: 145.83, // x 48 = 7000
    otherFees: 0,
    dealAmount: 12000,
    cogs: 0,
    commissionRate: 10,
    paymentTermMonths: 48,
    salesRepAssignments: [
      { salesRepId: 'sr3', salesRepName: 'Gary Rantz', commissionPercent: 50 },
      { salesRepId: 'sr1', salesRepName: 'Jim Law', commissionPercent: 50 },
    ],
    paymentStatus: 'unpaid',
    paidToDateAmount: 0,
    commissionPaidAmount: 0,
    onboardingDates: {
      startDate: '2025-01-18T14:00:00Z',
      estimatedCompletionDate: '2025-02-15T14:00:00Z', // 4 weeks from start
      useAdminOverride: false,
    },
  },
  {
  id: '4',
  businessName: 'Sudsy Suds Laundromat',
  ownerName: 'Emily Rodriguez',
  email: 'emily@sudsysuds.com',
  phone: '(555) 789-0123',
  createdAt: '2024-12-01T09:00:00Z',
  updatedAt: '2025-01-10T11:00:00Z',
  status: 'complete',
  onboardingToken: 'SS2nHt8v',
  onboardingStarted: true,
  onboardingCompleted: true,
  currentStep: 57,
    totalSteps: 57,
    currentStageId: 'post_go_live',
    taskStatuses: Object.fromEntries(
      ONBOARDING_STAGES.flatMap(s => s.tasks).map(t => [t.id, 'complete'])
    ) as Record<string, 'not_started' | 'in_progress' | 'complete'>,
    taskMetadata: Object.fromEntries(
      ONBOARDING_STAGES.flatMap(s => s.tasks).map(t => [t.id, { updatedBy: 'System', updatedAt: '2025-01-10T10:00:00Z' }])
    ),
    sections: [
      { id: 'general', name: 'General Information', status: 'complete', completedAt: '2024-12-02T10:00:00Z' },
      { id: 'location', name: 'Location Information', status: 'complete', completedAt: '2024-12-03T11:00:00Z' },
      { id: 'machines', name: 'Machine Inventory', status: 'complete', completedAt: '2024-12-05T14:30:00Z' },
      { id: 'employees', name: 'Employee Setup', status: 'complete', completedAt: '2024-12-06T09:00:00Z' },
      { id: 'shipping', name: 'Shipping Details', status: 'complete', completedAt: '2024-12-07T15:00:00Z' },
      { id: 'kiosk', name: 'Kiosk Configuration', status: 'complete', completedAt: '2024-12-08T10:30:00Z' },
      { id: 'merchant', name: 'Merchant Account', status: 'complete', completedAt: '2024-12-12T14:00:00Z' },
      { id: 'pci', name: 'PCI Compliance', status: 'complete', completedAt: '2024-12-15T11:00:00Z' },
      { id: 'review', name: 'Review & Submit', status: 'complete', completedAt: '2024-12-18T16:00:00Z' },
    ],
    employees: [
      { id: 'e3', name: 'Tom Wilson', phone: '(555) 222-3333', pin: '9012', privilegeLevel: 'admin' },
    ],
    machines: [],
    contractSigned: true,
    contractSignedDate: '2024-11-28T14:00:00Z',
    installationDate: '2025-01-08T09:00:00Z',
    goLiveDate: '2025-01-10T10:00:00Z',
    notes: [
      {
        id: 'n6',
        content: 'Successfully onboarded and live!',
        createdAt: '2025-01-10T11:00:00Z',
        createdBy: 'Admin',
        isEdited: false,
      },
    ],
  nonRecurringRevenue: 10000,
  monthlyRecurringFee: 250, // x 48 = 12000
  otherFees: 0,
  dealAmount: 22000,
  cogs: 0,
  commissionRate: 10,
  paymentTermMonths: 48,
    salesRepAssignments: [
      { salesRepId: 'sr4', salesRepName: 'Jim Garrity', commissionPercent: 75 },
      { salesRepId: 'sr2', salesRepName: 'John Altieri', commissionPercent: 25 },
    ],
    paymentStatus: 'paid_in_full',
    paidToDateAmount: 22000,
    commissionPaidAmount: 2200,
    paidDate: '2024-12-15T10:00:00Z',
    onboardingDates: {
      startDate: '2024-12-01T09:00:00Z',
      estimatedCompletionDate: '2024-12-29T09:00:00Z',
      actualCompletionDate: '2025-01-10T10:00:00Z',
      useAdminOverride: false,
    },
  },
]

export const useAdminStore = create<AdminStore>()(
  persist(
  (set, get) => ({
  customers: [], // Start empty - always load from Supabase
      selectedCustomerId: null,
      statusFilter: 'all',
      searchQuery: '',
      
  setCustomers: (customers) => set((state) => ({
    customers: typeof customers === 'function' ? customers(state.customers) : customers
  })),

  addCustomer: (customer) => {
    set((state) => ({
      customers: [...state.customers, customer]
    }))
    // Sync new customer to Supabase - use full customer data for insert
    syncCustomerToSupabase(customer.id, customer)
  },
  
  // Update local store from database - NO sync back to avoid feedback loops
  setCustomerFromDatabase: (id, data) => {
    set((state) => {
      const exists = state.customers.some((c) => c.id === id)
      if (exists) {
        return {
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...data } : c
          )
        }
      }
      // Customer not in local store yet - add it
      return {
        customers: [...state.customers, { id, ...data } as Customer]
      }
    })
  },
  
  updateCustomer: (id, data) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
          )
        }))
        // Sync to Supabase with debounce
        syncCustomerToSupabase(id, data)
      },
      
      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        selectedCustomerId: state.selectedCustomerId === id ? null : state.selectedCustomerId
      })),
      
  selectCustomer: (id) => set({ selectedCustomerId: id }),
  getCustomerByToken: (token) => get().customers.find((c) => c.onboardingToken === token),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
      
      updateCustomerSection: (customerId, sectionId, data) => {
        const customer = get().customers.find(c => c.id === customerId)
        if (!customer) return
        
        const updatedSections = customer.sections.map((s) =>
          s.id === sectionId ? { ...s, ...data } : s
        )
        
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  sections: updatedSections,
                  updatedAt: new Date().toISOString()
                }
              : c
          )
        }))
        // Sync sections to Supabase
        syncCustomerToSupabase(customerId, { sections: updatedSections })
      },
      
      // Machine management for customers
      // IMPORTANT: Each operation updates local state AND syncs the FULL machine list to the DB.
      // The sync uses a debounce to prevent rapid successive writes from causing duplication.
      // Only ONE sync call happens per customer, even if multiple operations fire quickly.
      addCustomerMachine: (customerId, machine) => {
        const customer = get().customers.find(c => c.id === customerId)
        if (!customer) return
        const updatedMachines = [...(customer.machines || []), machine]
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, machines: updatedMachines, updatedAt: new Date().toISOString() }
              : c
          )
        }))
        // Debounce machine syncs to prevent rapid-fire duplications
        syncCustomerToSupabase(customerId, { machines: updatedMachines }, 500)
      },
      
      updateCustomerMachine: (customerId, machineId, data) => {
        const customer = get().customers.find(c => c.id === customerId)
        if (!customer) return
        const updatedMachines = (customer.machines || []).map((m) =>
          m.id === machineId ? { ...m, ...data } : m
        )
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, machines: updatedMachines, updatedAt: new Date().toISOString() }
              : c
          )
        }))
        syncCustomerToSupabase(customerId, { machines: updatedMachines }, 500)
      },
      
      deleteCustomerMachine: (customerId, machineId) => {
        const customer = get().customers.find(c => c.id === customerId)
        if (!customer) return
        const updatedMachines = (customer.machines || []).filter((m) => m.id !== machineId)
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, machines: updatedMachines, updatedAt: new Date().toISOString() }
              : c
          )
        }))
        syncCustomerToSupabase(customerId, { machines: updatedMachines }, 500)
      },
      
      reorderCustomerMachines: (customerId, machines) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, machines, updatedAt: new Date().toISOString() }
              : c
          )
        }))
        syncCustomerToSupabase(customerId, { machines })
      },
      
      // Note management - with legacy string format support
      addCustomerNote: (customerId, note) => {
        const customer = get().customers.find(c => c.id === customerId)
        if (!customer) return
        const existingNotes = Array.isArray(customer.notes) ? customer.notes : []
        const updatedNotes = [...existingNotes, note]
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, notes: updatedNotes, updatedAt: new Date().toISOString() }
              : c
          )
        }))
        syncCustomerToSupabase(customerId, { notes: updatedNotes })
      },
      
      updateCustomerNote: (customerId, noteId, content, updatedBy) => {
        const customer = get().customers.find(c => c.id === customerId)
        if (!customer) return
        const existingNotes = Array.isArray(customer.notes) ? customer.notes : []
        const updatedNotes = existingNotes.map((n) =>
          n.id === noteId
            ? { ...n, content, updatedAt: new Date().toISOString(), updatedBy, isEdited: true }
            : n
        )
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, notes: updatedNotes, updatedAt: new Date().toISOString() }
              : c
          )
        }))
        syncCustomerToSupabase(customerId, { notes: updatedNotes })
      },
      
      deleteCustomerNote: (customerId, noteId) => {
        const customer = get().customers.find(c => c.id === customerId)
        if (!customer) return
        const existingNotes = Array.isArray(customer.notes) ? customer.notes : []
        const updatedNotes = existingNotes.filter((n) => n.id !== noteId)
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, notes: updatedNotes, updatedAt: new Date().toISOString() }
              : c
          )
        }))
        syncCustomerToSupabase(customerId, { notes: updatedNotes })
      },
      
      // Task management
      updateTaskStatus: (customerId, taskId, status, updatedBy) => {
        const customer = get().customers.find(c => c.id === customerId)
        if (!customer) return
        const taskStatuses = customer.taskStatuses || getDefaultTaskStatuses()
        const taskMetadata = customer.taskMetadata || {}
        const now = new Date().toISOString()
        const updatedTaskStatuses = { ...taskStatuses, [taskId]: status }
        const updatedTaskMetadata = { ...taskMetadata, [taskId]: { updatedBy: updatedBy || 'Unknown', updatedAt: now } }
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, taskStatuses: updatedTaskStatuses, taskMetadata: updatedTaskMetadata, updatedAt: now }
              : c
          )
        }))
        syncCustomerToSupabase(customerId, { taskStatuses: updatedTaskStatuses, taskMetadata: updatedTaskMetadata })
      },
      
      updateStageTasksStatus: (customerId, stageId, status, updatedBy) => {
        const customer = get().customers.find(c => c.id === customerId)
        if (!customer) return
        const stage = ONBOARDING_STAGES.find(s => s.id === stageId)
        if (!stage) return
        
        const taskStatuses = customer.taskStatuses || getDefaultTaskStatuses()
        const taskMetadata = customer.taskMetadata || {}
        const now = new Date().toISOString()
        
        const updatedTaskStatuses = { ...taskStatuses }
        const updatedTaskMetadata = { ...taskMetadata }
        
        for (const task of stage.tasks) {
          updatedTaskStatuses[task.id] = status
          updatedTaskMetadata[task.id] = { updatedBy: updatedBy || 'Unknown', updatedAt: now }
        }
        
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, taskStatuses: updatedTaskStatuses, taskMetadata: updatedTaskMetadata, updatedAt: now }
              : c
          )
        }))
        syncCustomerToSupabase(customerId, { taskStatuses: updatedTaskStatuses, taskMetadata: updatedTaskMetadata })
      },
      
      updateCurrentStage: (customerId, stageId) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, currentStageId: stageId, updatedAt: new Date().toISOString() }
              : c
          )
        }))
        syncCustomerToSupabase(customerId, { currentStageId: stageId })
      },
  
  // Payment processor management
  addPaymentProcessor: (customerId, processor) => {
    const customer = get().customers.find(c => c.id === customerId)
    if (!customer) return
    const updatedProcessors = [...(customer.paymentProcessors || []), processor]
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, paymentProcessors: updatedProcessors, updatedAt: new Date().toISOString() }
          : c
      )
    }))
    syncCustomerToSupabase(customerId, { paymentProcessors: updatedProcessors })
  },
  
  updatePaymentProcessor: (customerId, processorId, data) => {
    const customer = get().customers.find(c => c.id === customerId)
    if (!customer) return
    const updatedProcessors = (customer.paymentProcessors || []).map((p) =>
      p.id === processorId ? { ...p, ...data } : p
    )
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, paymentProcessors: updatedProcessors, updatedAt: new Date().toISOString() }
          : c
      )
    }))
    syncCustomerToSupabase(customerId, { paymentProcessors: updatedProcessors })
  },
  
  deletePaymentProcessor: (customerId, processorId) => {
    const customer = get().customers.find(c => c.id === customerId)
    if (!customer) return
    const updatedProcessors = (customer.paymentProcessors || []).filter((p) => p.id !== processorId)
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, paymentProcessors: updatedProcessors, updatedAt: new Date().toISOString() }
          : c
      )
    }))
    syncCustomerToSupabase(customerId, { paymentProcessors: updatedProcessors })
  },
  
  // Payment link management
  addPaymentLink: (customerId, link) => {
    const customer = get().customers.find(c => c.id === customerId)
    if (!customer) return
    const updatedLinks = [...(customer.paymentLinks || []), link]
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, paymentLinks: updatedLinks, updatedAt: new Date().toISOString() }
          : c
      )
    }))
    syncCustomerToSupabase(customerId, { paymentLinks: updatedLinks })
  },
  
  updatePaymentLink: (customerId, linkId, data) => {
    const customer = get().customers.find(c => c.id === customerId)
    if (!customer) return
    const updatedLinks = (customer.paymentLinks || []).map((l) =>
      l.id === linkId ? { ...l, ...data } : l
    )
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, paymentLinks: updatedLinks, updatedAt: new Date().toISOString() }
          : c
      )
    }))
    syncCustomerToSupabase(customerId, { paymentLinks: updatedLinks })
  },
  
  deletePaymentLink: (customerId, linkId) => {
    const customer = get().customers.find(c => c.id === customerId)
    if (!customer) return
    const updatedLinks = (customer.paymentLinks || []).filter((l) => l.id !== linkId)
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, paymentLinks: updatedLinks, updatedAt: new Date().toISOString() }
          : c
      )
    }))
    syncCustomerToSupabase(customerId, { paymentLinks: updatedLinks })
  },
  }),
  {
    name: 'johnboarding-admin-v4',
    partialize: (state) => ({
      // Only persist UI state - NEVER persist customer/machine data.
      // Customer data MUST always come from the database (source of truth).
      // Persisting customers to localStorage causes stale data, duplication,
      // and conflicts when data is modified from another session/device.
      selectedCustomerId: state.selectedCustomerId,
      statusFilter: state.statusFilter,
      searchQuery: state.searchQuery,
    }),
  }
  )
  )

// User Management Store
interface UserStore {
  // Admin users
  adminUsers: AdminUser[]
  currentAdminUser: AdminUser | null
  
  // Customer users
  customerUsers: CustomerUser[]
  currentCustomerUser: CustomerUser | null
  
  // EmailJS settings
  emailJSConfig: {
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
  
  // Auth state
  isAuthenticated: boolean
  
  // Actions
  login: (username: string, password: string) => boolean
  logout: () => void
  addAdminUser: (user: AdminUser) => void
  updateAdminUser: (id: string, data: Partial<AdminUser>) => void
  updateAdminPassword: (id: string, password: string) => void
  deleteAdminUser: (id: string) => void
  setCurrentAdminUser: (user: AdminUser | null) => void
  
  addCustomerUser: (user: CustomerUser) => void
  updateCustomerUser: (id: string, data: Partial<CustomerUser>) => void
  deleteCustomerUser: (id: string) => void
  setCurrentCustomerUser: (user: CustomerUser | null) => void
  
  updateEmailJSConfig: (config: Partial<UserStore['emailJSConfig']>) => void
}

// Admin credentials stored with simple encoding (in production, use proper hashing)
interface AdminCredentials {
  [userId: string]: string
}

const defaultAdminCredentials: AdminCredentials = {
  '1': '##LaundryBoss2025##', // Default password for admin user
  '2': '##LaundryBoss2025##', // Jim Law
  '3': '##LaundryBoss2025##', // John Altieri
  '4': '##LaundryBoss2025##', // Jim Garrity
}

const sampleAdminUsers: AdminUser[] = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin',
    role: 'super_admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2025-01-20T09:00:00Z',
    permissions: ['all'],
  },
  {
    id: '2',
    name: 'Jim Law',
    email: 'jim@thelaundryboss.com',
    role: 'super_admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    permissions: ['all'],
  },
  {
    id: '3',
    name: 'John Altieri',
    email: 'john.altieri1@gmail.com',
    role: 'super_admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    permissions: ['all'],
  },
  {
    id: '4',
    name: 'Jim Garrity',
    email: 'jim@jamesgarrity.com',
    role: 'super_admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    permissions: ['all'],
  },
]

const sampleCustomerUsers: CustomerUser[] = [
  {
    id: '1',
    customerId: '1',
    email: 'john@cleanfresh.com',
    name: 'John Smith',
    password: 'customer123',
    createdAt: '2025-01-10T10:00:00Z',
    lastLogin: '2025-01-15T08:00:00Z',
    passwordSet: true,
  },
  {
    id: '2',
    customerId: '2',
    email: 'sarah@sparklewash.com',
    name: 'Sarah Johnson',
    password: 'customer123',
    createdAt: '2025-01-05T08:00:00Z',
    lastLogin: '2025-01-18T11:00:00Z',
    passwordSet: true,
  },
]

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
  adminUsers: sampleAdminUsers,
  currentAdminUser: null,
  customerUsers: sampleCustomerUsers,
  currentCustomerUser: null,
  isAuthenticated: false,
      emailJSConfig: {
        serviceId: '',
        publicKey: '',
        templates: {
          welcomeEmail: 'template_welcome',
          kickoffEmail: 'template_kickoff',
          statusUpdate: 'template_status',
          taskReminder: 'template_reminder',
          completionNotice: 'template_complete',
        },
      },
      
      login: (username, password) => {
        const state = get()
        // Check credentials - stored in localStorage
        const storedCredentials = localStorage.getItem('johnboarding-admin-credentials')
        const credentials: AdminCredentials = storedCredentials 
          ? JSON.parse(storedCredentials) 
          : defaultAdminCredentials
        
        // Find user by email/username
        const user = state.adminUsers.find(u => u.email === username || u.name === username)
        if (user && credentials[user.id] === password) {
          set({ 
            isAuthenticated: true, 
            currentAdminUser: { ...user, lastLogin: new Date().toISOString() } 
          })
          return true
        }
        return false
      },
      
      logout: () => set({ isAuthenticated: false, currentAdminUser: null }),
      
      addAdminUser: (user) => set((state) => ({
        adminUsers: [...state.adminUsers, user]
      })),
      
      updateAdminUser: (id, data) => set((state) => ({
        adminUsers: state.adminUsers.map((u) =>
          u.id === id ? { ...u, ...data } : u
        )
      })),
      
      updateAdminPassword: (id, password) => {
        const storedCredentials = localStorage.getItem('johnboarding-admin-credentials')
        const credentials: AdminCredentials = storedCredentials 
          ? JSON.parse(storedCredentials) 
          : { ...defaultAdminCredentials }
        credentials[id] = password
        localStorage.setItem('johnboarding-admin-credentials', JSON.stringify(credentials))
      },
      
      deleteAdminUser: (id) => set((state) => ({
        adminUsers: state.adminUsers.filter((u) => u.id !== id)
      })),
      
      setCurrentAdminUser: (user) => set({ currentAdminUser: user }),
      
      addCustomerUser: (user) => set((state) => ({
        customerUsers: [...state.customerUsers, user]
      })),
      
      updateCustomerUser: (id, data) => set((state) => ({
        customerUsers: state.customerUsers.map((u) =>
          u.id === id ? { ...u, ...data } : u
        )
      })),
      
  deleteCustomerUser: (id) => set((state) => ({
  customerUsers: state.customerUsers.filter((u) => u.id !== id)
  })),
  
  setCurrentCustomerUser: (user) => set({ currentCustomerUser: user }),
  
  updateEmailJSConfig: (config) => set((state) => ({
        emailJSConfig: { ...state.emailJSConfig, ...config }
      })),
    }),
    {
      name: 'johnboarding-users',
    }
  )
)
