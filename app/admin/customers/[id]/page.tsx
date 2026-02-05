"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/store";
import { 
  getCustomerById,
  updateCustomer as updateSupabaseCustomer,
  addMachine as addSupabaseMachine,
  updateMachine as updateSupabaseMachine,
  deleteMachine as deleteSupabaseMachine,
  addNote as addSupabaseNote,
  deleteNote as deleteSupabaseNote,
} from "@/lib/supabase/customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Shield,
  WashingMachine,
  Users,
  FileText,
  Edit,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Copy,
  ArrowUpDown,
  MessageSquare,
  History,
  Loader2,
  DollarSign,
  UserCheck,
  CalendarClock,
  Sparkles,
  Circle,
  AlertTriangle,
  CreditCard,
  Link as LinkIcon,
  Camera,
  Video,
  CheckCircle,
  Eye,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OnboardingStatus, Machine, MachineType, CoinType, CustomerNote, TaskStatus, SalesRepAssignment, PaymentProcessor, PaymentProcessorType, PaymentLink, PaymentLinkType } from "@/lib/types";
import { SALES_REPS, DEFAULT_PAYSTRI_LINK, PAYMENT_LINK_LABELS } from "@/lib/types";
import { useUserStore } from "@/lib/store";
import { StageProgress, StageProgressBar } from "@/components/onboarding/stage-progress";
import { ONBOARDING_STAGES, getDefaultTaskStatuses } from "@/lib/onboarding-config";
import { estimateOnboardingCompletion, type TaskProgress } from "@/app/actions/estimate-onboarding";
import { PortalAccessManager } from "@/components/admin/portal-access-manager";

const MACHINE_MAKES = ['Fagor', 'Domus', 'Electrolux', 'IPSO', 'ADC', 'Speed Queen', 'Dexter', 'Maytag', 'Continental', 'Wascomat', 'UniMac', 'Huebsch', 'Other'];

const DEFAULT_PRICING = {
  cold: 5.00,
  warm: 5.50,
  hot: 6.00,
  standard: 0.25,
};

const statusColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  needs_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const sectionStatusIcons: Record<string, typeof Clock> = {
  not_started: Clock,
  in_progress: AlertCircle,
  needs_review: AlertCircle,
  complete: CheckCircle2,
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { customers, updateCustomer, updateCustomerSection, addCustomerMachine, updateCustomerMachine, deleteCustomerMachine, reorderCustomerMachines, addCustomerNote, updateCustomerNote, deleteCustomerNote, updateTaskStatus, updateStageTasksStatus, updateCurrentStage, addPaymentProcessor, updatePaymentProcessor, deletePaymentProcessor, addPaymentLink, updatePaymentLink, deletePaymentLink } = useAdminStore();
  const { currentAdminUser } = useUserStore();

  const customer = customers.find((c) => c.id === params.id);
  
  // Fetch fresh customer data from database on page load
  // Uses setCustomerFromDatabase to update local store WITHOUT triggering a sync back to the API
  const { setCustomerFromDatabase } = useAdminStore()
  useEffect(() => {
    async function refreshCustomerData() {
      if (!params.id) return
      try {
        const response = await fetch(`/api/customers/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.customer) {
            // Update local store only - do NOT sync back to database (would cause loop)
            setCustomerFromDatabase(params.id as string, data.customer)
          }
        }
      } catch (error) {
        console.error('Error refreshing customer data:', error)
      }
    }
    refreshCustomerData()
  }, [params.id, setCustomerFromDatabase])
  
  // Machine management state
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [cloneMachine, setCloneMachine] = useState<Machine | null>(null);
  const [cloneCount, setCloneCount] = useState(1);
  const [renumberMachine, setRenumberMachine] = useState<Machine | null>(null);
  const [newMachineNumber, setNewMachineNumber] = useState<number>(1);
  
  // Notes state
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  
  // AI Estimation state
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState<{
    reasoning?: string;
    confidence?: string;
    riskFactors?: string[];
  } | null>(null);
  
  // Onboarding link copy state
  const [copiedOnboardingLink, setCopiedOnboardingLink] = useState(false);
  
  // Media preview state
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  
  // Edit customer state
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    status: 'not_started' as OnboardingStatus,
    contractSigned: false,
    installationDate: '',
    goLiveDate: '',
    notes: '',
  });
  
const [newMachine, setNewMachine] = useState<Partial<Machine>>({
  type: 'washer',
  coinsAccepted: 'quarter',
  pricing: { cold: DEFAULT_PRICING.cold, warm: DEFAULT_PRICING.warm, hot: DEFAULT_PRICING.hot },
  });
  const [otherMake, setOtherMake] = useState('');
  
  // Payment processor state
  const [isAddProcessorOpen, setIsAddProcessorOpen] = useState(false);
  const [editingProcessor, setEditingProcessor] = useState<PaymentProcessor | null>(null);
  const [newProcessor, setNewProcessor] = useState<{
    type: PaymentProcessorType;
    customName: string;
    link: string;
    useDefaultLink: boolean;
  }>({
    type: 'cardpointe',
    customName: '',
    link: '',
  useDefaultLink: false,
  });
  
  // Payment link state
  const [isAddPaymentLinkOpen, setIsAddPaymentLinkOpen] = useState(false);
  const [editingPaymentLink, setEditingPaymentLink] = useState<PaymentLink | null>(null);
  const [newPaymentLink, setNewPaymentLink] = useState<{
    type: PaymentLinkType;
    customLabel: string;
    link: string;
    amount: string;
    dueDate: string;
    isVisible: boolean;
    isPaid: boolean;
    amountPaid: string;
  }>({
    type: 'full_payment',
    customLabel: '',
    link: '',
    amount: '',
    dueDate: '',
    isVisible: true,
    isPaid: false,
    amountPaid: '',
  });
  
  // Get next available machine number based on type (Washers: 1-99, Dryers: 101-199)
  const getNextMachineNumber = (type: MachineType, machines: Machine[]): number => {
    const baseNumber = type === 'washer' ? 1 : 101;
    const maxNumber = type === 'washer' ? 99 : 199;
    const existingNumbers = machines.filter(m => m.type === type).map(m => m.machineNumber);
    
    for (let i = baseNumber; i <= maxNumber; i++) {
      if (!existingNumbers.includes(i)) {
        return i;
      }
    }
    return existingNumbers.length + baseNumber;
  };

  // Check if a machine number is within valid range for the type (Washers: 1-99, Dryers: 101-199)
  const isNumberInRange = (num: number, type: MachineType): boolean => {
    const baseNumber = type === 'washer' ? 1 : 101;
    const maxNumber = type === 'washer' ? 99 : 199;
    return num >= baseNumber && num <= maxNumber;
  };

  // Find machine that currently has a specific number
  const getMachineByNumber = (num: number, machines: Machine[]): Machine | undefined => {
  return machines.find(m => m.machineNumber === num);
  };

  // AI Estimation handler
  const handleAIEstimate = async () => {
    if (!customer || !customer.onboardingDates?.startDate) return;
    
    setIsEstimating(true);
    setEstimationResult(null);
    
    try {
      // Calculate progress data
      const stageProgress: TaskProgress[] = ONBOARDING_STAGES.map(stage => {
        const stageTasks = stage.tasks;
        const completed = stageTasks.filter(t => customer.taskStatuses[t.id] === 'complete').length;
        const inProgress = stageTasks.filter(t => customer.taskStatuses[t.id] === 'in_progress').length;
        return {
          stageName: stage.name,
          totalTasks: stageTasks.length,
          completedTasks: completed,
          inProgressTasks: inProgress,
        };
      });

      const totalTasks = ONBOARDING_STAGES.reduce((sum, s) => sum + s.tasks.length, 0);
      const completedTasks = Object.values(customer.taskStatuses).filter(s => s === 'complete').length;
      const inProgressTasks = Object.values(customer.taskStatuses).filter(s => s === 'in_progress').length;
      const startDate = new Date(customer.onboardingDates.startDate);
      const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const result = await estimateOnboardingCompletion({
        customerId: customer.id,
        customerName: customer.businessName,
        startDate: customer.onboardingDates.startDate,
        currentProgress: Math.round((completedTasks / totalTasks) * 100),
        daysElapsed,
        stageProgress,
        totalTasks,
        completedTasks,
        inProgressTasks,
      });

      if (result.success && result.estimatedCompletionDate) {
        updateCustomer(customer.id, {
          onboardingDates: {
            ...customer.onboardingDates,
            aiEstimatedDate: result.estimatedCompletionDate,
          }
        });
        setEstimationResult({
          reasoning: result.reasoning,
          confidence: result.confidence,
          riskFactors: result.riskFactors,
        });
      }
    } catch (error) {
      console.error('Error estimating:', error);
    } finally {
      setIsEstimating(false);
    }
  };
  
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Customer not found</p>
        <Button onClick={() => router.push("/admin/customers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
      </div>
    );
  }

  const completedSections = customer.sections.filter((s) => s.status === "complete").length;
  const totalSections = customer.sections.length;
  const progressPercentage = (completedSections / totalSections) * 100;

  const handleStatusChange = async (status: OnboardingStatus) => {
    const previousStatus = customer.status;
    updateCustomer(customer.id, { status });
    
    // Send completion emails when status changes to complete
    if (status === 'complete' && previousStatus !== 'complete') {
      try {
        const emailPayload = {
          type: 'onboarding_complete',
          customer: {
            customerName: customer.ownerName,
            businessName: customer.businessName,
            email: customer.email,
            phone: customer.phone,
          },
          completedBy: currentAdminUser?.name || 'Admin',
        };
        
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload),
        });
        
        if (!response.ok) {
          const result = await response.json();
          console.error('[v0] Email API error:', result);
        }
      } catch (error) {
        console.error('[v0] Failed to send completion emails:', error);
      }
    }
  };

  const getStatusBadge = (status: OnboardingStatus) => {
    return (
      <Badge className={statusColors[status]}>
        {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
    );
  };

  // Machine handlers
const handleAddMachine = () => {
  if (!customer) return;
  const machineType = newMachine.type as MachineType;
  const finalMake = newMachine.make === 'Other' ? otherMake : (newMachine.make || '');
  const machine: Machine = {
  id: crypto.randomUUID(),
  machineNumber: getNextMachineNumber(machineType, customer.machines),
  type: machineType,
  make: finalMake,
  model: newMachine.model || '',
  serialNumber: newMachine.serialNumber || '',
  coinsAccepted: newMachine.coinsAccepted as CoinType,
  pricing: newMachine.pricing || {},
  afterMarketUpgrades: newMachine.afterMarketUpgrades,
  };
  addCustomerMachine(customer.id, machine);
  setIsAddMachineOpen(false);
  resetMachineForm();
  };

const handleUpdateMachine = () => {
  if (!customer || !editingMachine) return;
  const finalMake = newMachine.make === 'Other' ? otherMake : (newMachine.make || '');
  updateCustomerMachine(customer.id, editingMachine.id, { ...newMachine, make: finalMake });
  setEditingMachine(null);
  resetMachineForm();
  };

  const handleDeleteMachine = (machineId: string) => {
    if (!customer) return;
    deleteCustomerMachine(customer.id, machineId);
  };

  const handleCloneMachines = () => {
    if (!customer || !cloneMachine) return;
    const machineType = cloneMachine.type;
    const baseNumber = machineType === 'washer' ? 1 : 101;
    const maxNumber = machineType === 'washer' ? 99 : 199;
    const usedNumbers = new Set(customer.machines.filter(m => m.type === machineType).map(m => m.machineNumber));
    
    for (let i = 0, num = baseNumber; i < cloneCount && num <= maxNumber; num++) {
      if (!usedNumbers.has(num)) {
        const clonedMachine: Machine = {
          ...cloneMachine,
          id: crypto.randomUUID(),
          machineNumber: num,
          serialNumber: '',
        };
        addCustomerMachine(customer.id, clonedMachine);
        usedNumbers.add(num);
        i++;
      }
    }
    setCloneMachine(null);
    setCloneCount(1);
  };

const handleRenumberMachine = () => {
  if (!customer || !renumberMachine) return;
  // Allow SuperAdmins to override range restrictions
  if (!isNumberInRange(newMachineNumber, renumberMachine.type) && currentAdminUser?.role !== 'super_admin') return;
    
    // Check if target number is already taken by another machine
    const existingMachine = getMachineByNumber(newMachineNumber, customer.machines);
    
    if (existingMachine && existingMachine.id !== renumberMachine.id) {
      // Swap the numbers between the two machines
      const oldNumber = renumberMachine.machineNumber;
      updateCustomerMachine(customer.id, renumberMachine.id, { machineNumber: newMachineNumber });
      updateCustomerMachine(customer.id, existingMachine.id, { machineNumber: oldNumber });
    } else {
      // Just update the number (it's available)
      updateCustomerMachine(customer.id, renumberMachine.id, { machineNumber: newMachineNumber });
    }
    setRenumberMachine(null);
  };

const resetMachineForm = () => {
  setNewMachine({
  type: 'washer',
  coinsAccepted: 'quarter',
  pricing: { cold: DEFAULT_PRICING.cold, warm: DEFAULT_PRICING.warm, hot: DEFAULT_PRICING.hot },
  });
  setOtherMake('');
  };

const openEditMachine = (machine: Machine) => {
  setEditingMachine(machine);
  // Check if the make is in the standard list or is a custom "Other" value
  const isStandardMake = MACHINE_MAKES.includes(machine.make);
  if (isStandardMake) {
    setNewMachine({ ...machine });
    setOtherMake('');
  } else {
    setNewMachine({ ...machine, make: 'Other' });
    setOtherMake(machine.make);
  }
  };

  const openRenumberMachine = (machine: Machine) => {
    setRenumberMachine(machine);
    setNewMachineNumber(machine.machineNumber);
  };

  // Safe notes array helper
  const getNotesArray = (): CustomerNote[] => {
    if (!customer) return [];
    return Array.isArray(customer.notes) 
      ? customer.notes 
      : (typeof customer.notes === 'string' && customer.notes) 
        ? [{ id: 'legacy', content: customer.notes, createdAt: customer.createdAt, createdBy: 'System', isEdited: false }]
        : [];
  };

  // Note handlers
  const handleAddNote = () => {
    if (!customer || !newNoteContent.trim()) return;
    const note: CustomerNote = {
      id: crypto.randomUUID(),
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentAdminUser?.name || 'Admin',
      isEdited: false,
    };
    addCustomerNote(customer.id, note);
    setNewNoteContent("");
  };

  const handleUpdateNote = () => {
    if (!customer || !editingNote || !editNoteContent.trim()) return;
    updateCustomerNote(
      customer.id,
      editingNote.id,
      editNoteContent.trim(),
      currentAdminUser?.name || 'Admin'
    );
    setEditingNote(null);
    setEditNoteContent("");
  };

const handleDeleteNote = () => {
  if (!customer || !deleteNoteId) return;
  deleteCustomerNote(customer.id, deleteNoteId);
  setDeleteNoteId(null);
  };
  
  // Payment Processor handlers
  const resetProcessorForm = () => {
    setNewProcessor({
      type: 'cardpointe',
      customName: '',
      link: '',
      useDefaultLink: false,
    });
    setEditingProcessor(null);
  };

  const handleAddProcessor = () => {
    if (!customer) return;
    const processorName = newProcessor.type === 'other' 
      ? newProcessor.customName 
      : newProcessor.type.charAt(0).toUpperCase() + newProcessor.type.slice(1);
    
    const link = newProcessor.type === 'paystri' && newProcessor.useDefaultLink 
      ? DEFAULT_PAYSTRI_LINK 
      : newProcessor.link;
    
    if (!link) return;
    
    const processor: PaymentProcessor = {
      id: crypto.randomUUID(),
      type: newProcessor.type,
      name: processorName,
      link: link,
      isDefault: newProcessor.type === 'paystri' && newProcessor.useDefaultLink,
      addedAt: new Date().toISOString(),
      addedBy: currentAdminUser?.name || 'Admin',
    };
    addPaymentProcessor(customer.id, processor);
    setIsAddProcessorOpen(false);
    resetProcessorForm();
  };

  const handleUpdateProcessor = () => {
    if (!customer || !editingProcessor) return;
    const processorName = newProcessor.type === 'other' 
      ? newProcessor.customName 
      : newProcessor.type.charAt(0).toUpperCase() + newProcessor.type.slice(1);
    
    const link = newProcessor.type === 'paystri' && newProcessor.useDefaultLink 
      ? DEFAULT_PAYSTRI_LINK 
      : newProcessor.link;
    
    updatePaymentProcessor(customer.id, editingProcessor.id, {
      type: newProcessor.type,
      name: processorName,
      link: link,
      isDefault: newProcessor.type === 'paystri' && newProcessor.useDefaultLink,
    });
    setEditingProcessor(null);
    resetProcessorForm();
  };

  const handleDeleteProcessor = (processorId: string) => {
    if (!customer) return;
    deletePaymentProcessor(customer.id, processorId);
  };

  const openEditProcessor = (processor: PaymentProcessor) => {
    setEditingProcessor(processor);
    setNewProcessor({
      type: processor.type,
      customName: processor.type === 'other' ? processor.name : '',
      link: processor.isDefault ? '' : processor.link,
      useDefaultLink: processor.isDefault,
  });
  };
  
  // Payment Link handlers
  const resetPaymentLinkForm = () => {
    setNewPaymentLink({
      type: 'full_payment',
      customLabel: '',
      link: '',
      amount: '',
      dueDate: '',
      isVisible: true,
      isPaid: false,
      amountPaid: '',
    });
    setEditingPaymentLink(null);
  };

  const handleAddPaymentLink = () => {
    if (!customer || !newPaymentLink.link) return;
    
    const link: PaymentLink = {
      id: crypto.randomUUID(),
      type: newPaymentLink.type,
      customLabel: newPaymentLink.type === 'other' ? newPaymentLink.customLabel : undefined,
      link: newPaymentLink.link,
      amount: newPaymentLink.amount ? parseFloat(newPaymentLink.amount) : undefined,
      dueDate: newPaymentLink.dueDate || undefined,
      isVisible: newPaymentLink.isVisible,
      isPaid: newPaymentLink.isPaid,
      amountPaid: newPaymentLink.amountPaid ? parseFloat(newPaymentLink.amountPaid) : undefined,
      paidAt: newPaymentLink.isPaid ? new Date().toISOString() : undefined,
      addedAt: new Date().toISOString(),
      addedBy: currentAdminUser?.name || 'Admin',
    };
    addPaymentLink(customer.id, link);
    setIsAddPaymentLinkOpen(false);
    resetPaymentLinkForm();
  };

  const handleUpdatePaymentLink = () => {
    if (!customer || !editingPaymentLink) return;
    
    const wasNotPaid = !editingPaymentLink.isPaid;
    const isNowPaid = newPaymentLink.isPaid;
    
    updatePaymentLink(customer.id, editingPaymentLink.id, {
      type: newPaymentLink.type,
      customLabel: newPaymentLink.type === 'other' ? newPaymentLink.customLabel : undefined,
      link: newPaymentLink.link,
      amount: newPaymentLink.amount ? parseFloat(newPaymentLink.amount) : undefined,
      dueDate: newPaymentLink.dueDate || undefined,
      isVisible: newPaymentLink.isVisible,
      isPaid: newPaymentLink.isPaid,
      amountPaid: newPaymentLink.amountPaid ? parseFloat(newPaymentLink.amountPaid) : undefined,
      paidAt: wasNotPaid && isNowPaid ? new Date().toISOString() : editingPaymentLink.paidAt,
    });
    setEditingPaymentLink(null);
    resetPaymentLinkForm();
  };

  const handleDeletePaymentLink = (linkId: string) => {
    if (!customer) return;
    deletePaymentLink(customer.id, linkId);
  };

  const openEditPaymentLink = (link: PaymentLink) => {
    setEditingPaymentLink(link);
    setNewPaymentLink({
      type: link.type,
      customLabel: link.customLabel || '',
      link: link.link,
      amount: link.amount ? link.amount.toString() : '',
      dueDate: link.dueDate || '',
      isVisible: link.isVisible,
      isPaid: link.isPaid || false,
      amountPaid: link.amountPaid ? link.amountPaid.toString() : '',
    });
  };

  const togglePaymentLinkVisibility = (link: PaymentLink) => {
    if (!customer) return;
    updatePaymentLink(customer.id, link.id, { isVisible: !link.isVisible });
  };
  
  const openEditNote = (note: CustomerNote) => {
  setEditingNote(note);
  setEditNoteContent(note.content);
  };
  
  // Edit customer handlers
  const openEditCustomer = () => {
    if (!customer) return;
    setEditCustomerData({
      businessName: customer.businessName,
      ownerName: customer.ownerName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      contractSigned: customer.contractSigned,
      installationDate: customer.installationDate ? new Date(customer.installationDate).toISOString().split('T')[0] : '',
      goLiveDate: customer.goLiveDate ? new Date(customer.goLiveDate).toISOString().split('T')[0] : '',
      notes: customer.notes || '',
    });
    setIsEditCustomerOpen(true);
  };
  
  const handleUpdateCustomer = async () => {
    if (!customer) return;
    // Convert date strings to ISO format for database
    const installationDate = editCustomerData.installationDate 
      ? new Date(editCustomerData.installationDate).toISOString() 
      : undefined;
    const goLiveDate = editCustomerData.goLiveDate 
      ? new Date(editCustomerData.goLiveDate).toISOString() 
      : undefined;
    
    await updateCustomer(customer.id, {
      businessName: editCustomerData.businessName,
      ownerName: editCustomerData.ownerName,
      email: editCustomerData.email,
      phone: editCustomerData.phone,
      status: editCustomerData.status,
      contractSigned: editCustomerData.contractSigned,
      installationDate,
      goLiveDate,
      notes: editCustomerData.notes || undefined,
    });
    setIsEditCustomerOpen(false);
  };

  const formatNoteDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/customers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {customer.businessName}
            </h1>
            <p className="text-muted-foreground">
              Created {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(customer.status)}
          <Button variant="outline" size="sm" onClick={openEditCustomer}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="font-medium text-foreground">{customer.ownerName}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <WashingMachine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Machines</p>
              <p className="font-medium text-foreground">{customer.machines.length} machines</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employees</p>
              <p className="font-medium text-foreground">{customer.employees.length} employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="font-medium text-foreground">
                {completedSections}/{totalSections} sections
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Onboarding Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-medium text-foreground">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
<TabsList className="flex flex-wrap gap-1 h-auto p-1">
<TabsTrigger value="overview">Overview</TabsTrigger>
<TabsTrigger value="tasks">Tasks</TabsTrigger>
<TabsTrigger value="sales">Sales</TabsTrigger>
<TabsTrigger value="processors">Processors</TabsTrigger>
<TabsTrigger value="payments">Payments</TabsTrigger>
<TabsTrigger value="employees">Employees</TabsTrigger>
<TabsTrigger value="machines">Machines</TabsTrigger>
<TabsTrigger value="photos">Media</TabsTrigger>
<TabsTrigger value="shipping">Shipping</TabsTrigger>
<TabsTrigger value="pci">PCI</TabsTrigger>
<TabsTrigger value="notes">Notes</TabsTrigger>
<TabsTrigger value="portal-access">Portal Access</TabsTrigger>
  </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stage Progress Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Onboarding Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <StageProgressBar 
                taskStatuses={customer.taskStatuses || getDefaultTaskStatuses()} 
                currentStageId={customer.currentStageId || 'contract_setup'} 
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Owner Name</p>
                    <p className="font-medium text-foreground">{customer.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{customer.phone}</p>
                  </div>
                </div>
                
                {/* Onboarding Link */}
                {customer.onboardingToken && (
                  <div className="pt-4 mt-4 border-t">
                    <div className="flex items-center gap-3 mb-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Onboarding Link</p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={customer.onboardingCompleted ? "default" : customer.onboardingStarted ? "secondary" : "outline"}
                            className={customer.onboardingCompleted ? "bg-green-600" : ""}
                          >
                            {customer.onboardingCompleted ? "Completed" : customer.onboardingStarted ? "In Progress" : "Not Started"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <code className="flex-1 p-2 text-xs bg-muted rounded border overflow-x-auto">
                        {typeof window !== 'undefined' 
                          ? `${window.location.origin}/onboarding/${customer.onboardingToken}`
                          : `/onboarding/${customer.onboardingToken}`}
                      </code>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const link = `${window.location.origin}/onboarding/${customer.onboardingToken}`;
                          navigator.clipboard.writeText(link);
                          setCopiedOnboardingLink(true);
                          setTimeout(() => setCopiedOnboardingLink(false), 2000);
                        }}
                      >
                        {copiedOnboardingLink ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/onboarding/${customer.onboardingToken}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contract Signed</p>
                  <p className="font-medium text-foreground">
                    {customer.contractSigned
                      ? customer.contractSignedDate
                        ? new Date(customer.contractSignedDate).toLocaleDateString()
                        : "Yes"
                      : "Not yet"}
                  </p>
                </div>
                {customer.installationDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Installation Date</p>
                    <p className="font-medium text-foreground">
                      {new Date(customer.installationDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {customer.goLiveDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Go Live Date</p>
                    <p className="font-medium text-foreground">
                      {new Date(customer.goLiveDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium text-foreground">
                    {new Date(customer.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Laundromat Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-4 w-4" />
                  Laundromat Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.locationInfo ? (
                  <>
                    <p className="font-medium text-foreground">{customer.locationInfo.commonName}</p>
                    <p className="text-sm text-foreground">{customer.locationInfo.address}</p>
                    <p className="text-sm text-foreground">
                      {customer.locationInfo.city}, {customer.locationInfo.state} {customer.locationInfo.zipCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{customer.locationInfo.phoneNumber}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No location information provided</p>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Truck className="h-4 w-4" />
                  Shipping Address
                  {customer.shippingInfo?.sameAsLocation && (
                    <Badge variant="secondary" className="ml-2 text-xs">Same as Laundromat</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.shippingInfo ? (
                  <>
                    <p className="text-sm text-foreground">{customer.shippingInfo.address}</p>
                    <p className="text-sm text-foreground">
                      {customer.shippingInfo.city}, {customer.shippingInfo.state} {customer.shippingInfo.zipCode}
                    </p>
                    {customer.shippingInfo.shipmentMethod && (
                      <Badge variant="outline" className="mt-2">
                        {customer.shippingInfo.shipmentMethod === 'ltl_freight' ? 'LTL Freight' : 
                         customer.shippingInfo.shipmentMethod === 'ups' ? 'UPS' : 'Other'}
                      </Badge>
                    )}
                    {customer.shippingInfo.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{customer.shippingInfo.notes}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No shipping information provided</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(["not_started", "in_progress", "needs_review", "complete"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={customer.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                  >
                    {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Stage Progress Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Onboarding Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <StageProgressBar 
                taskStatuses={customer.taskStatuses || getDefaultTaskStatuses()} 
                currentStageId={customer.currentStageId || 'contract_setup'} 
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Stage Progress Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-foreground">Stage Progress</CardTitle>
                <CardDescription>Track progress through each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <StageProgress 
                  taskStatuses={customer.taskStatuses || getDefaultTaskStatuses()} 
                  currentStageId={customer.currentStageId || 'contract_setup'}
                  showTasks={true}
                />
              </CardContent>
            </Card>

            {/* Tasks List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-foreground">All Tasks ({ONBOARDING_STAGES.reduce((sum, s) => sum + s.tasks.length, 0)})</CardTitle>
                <CardDescription>Manage onboarding tasks for this customer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {ONBOARDING_STAGES.map((stage) => {
                    const stageTasks = stage.tasks.map(t => t.id)
                    const completedInStage = stageTasks.filter(taskId => (customer.taskStatuses || {})[taskId] === 'complete').length
                    const inProgressInStage = stageTasks.filter(taskId => (customer.taskStatuses || {})[taskId] === 'in_progress').length
                    const stageStatus: 'complete' | 'in_progress' | 'not_started' = 
                      completedInStage === stageTasks.length ? 'complete' :
                      (completedInStage > 0 || inProgressInStage > 0) ? 'in_progress' : 'not_started'
                    
                    return (
                      <div key={stage.id} className="space-y-2">
                        {/* Stage Header with Status */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          stageStatus === 'complete' ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' :
                          stageStatus === 'in_progress' ? 'bg-lb-cyan/10 border-lb-cyan/30' : 
                          'bg-muted/30 border-border'
                        }`}>
                          {/* Status Icon */}
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${
                            stageStatus === 'complete' ? 'bg-green-500 border-green-500 text-white' :
                            stageStatus === 'in_progress' ? 'bg-lb-blue border-lb-blue text-white' :
                            'bg-background border-muted-foreground/30 text-muted-foreground'
                          }`}>
                            {stageStatus === 'complete' && <CheckCircle2 className="h-5 w-5" />}
                            {stageStatus === 'in_progress' && <Loader2 className="h-4 w-4 animate-spin" />}
                            {stageStatus === 'not_started' && <Clock className="h-4 w-4" />}
                          </div>
                          
                          {/* Stage Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm ${
                              stageStatus === 'complete' ? 'text-green-700 dark:text-green-400' :
                              stageStatus === 'in_progress' ? 'text-lb-blue' : 'text-foreground'
                            }`}>{stage.name}</h3>
                            <p className="text-xs text-muted-foreground">{completedInStage} of {stageTasks.length} tasks complete</p>
                          </div>
                          
                          {/* Progress Badge */}
                          <Badge className={`shrink-0 ${
                            stageStatus === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            stageStatus === 'in_progress' ? 'bg-lb-cyan/20 text-lb-blue' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {stageStatus === 'complete' ? 'Complete' : stageStatus === 'in_progress' ? 'In Progress' : 'Not Started'}
                          </Badge>
                          
                          {/* Bulk Update Dropdown */}
                          <Select
                            value=""
                            onValueChange={(value: TaskStatus) => {
                              updateStageTasksStatus(customer.id, stage.id, value, currentAdminUser?.name);
                            }}
                          >
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <SelectValue placeholder="Set All..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_started">All Not Started</SelectItem>
                              <SelectItem value="in_progress">All In Progress</SelectItem>
                              <SelectItem value="complete">All Complete</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Tasks List */}
                        <div className="space-y-1 ml-4">
                          {stage.tasks.map((task) => {
                            const taskStatus = (customer.taskStatuses || {})[task.id] || 'not_started'
                            const taskMeta = (customer.taskMetadata || {})[task.id]
                            return (
                              <div key={task.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50 group">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextStatus: TaskStatus = 
                                        taskStatus === 'not_started' ? 'in_progress' : 
                                        taskStatus === 'in_progress' ? 'complete' : 'not_started'
                                      updateTaskStatus(customer.id, task.id, nextStatus, currentAdminUser?.name)
                                    }}
                                    className="shrink-0"
                                  >
                                    {taskStatus === 'complete' && (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    )}
                                    {taskStatus === 'in_progress' && (
                                      <Loader2 className="h-4 w-4 text-lb-blue animate-spin" />
                                    )}
                                    {taskStatus === 'not_started' && (
                                      <Clock className="h-4 w-4 text-muted-foreground/40" />
                                    )}
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <span className={`text-sm truncate block ${
                                      taskStatus === 'complete' ? 'text-muted-foreground line-through' : 
                                      taskStatus === 'in_progress' ? 'text-foreground font-medium' : 'text-foreground'
                                    }`}>
                                      {task.name}
                                    </span>
                                    {taskMeta && (
                                      <span className="text-[10px] text-muted-foreground">
                                        Updated by {taskMeta.updatedBy} on {new Date(taskMeta.updatedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                                    {task.team.join(', ')}
                                  </Badge>
                                  <Select
                                    value={taskStatus}
                                    onValueChange={(value: TaskStatus) => {
                                      updateTaskStatus(customer.id, task.id, value, currentAdminUser?.name)
                                    }}
                                  >
                                    <SelectTrigger className="h-7 w-28 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="not_started">Not Started</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="complete">Complete</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
  </TabsContent>

        {/* Sales & Dates Tab */}
        <TabsContent value="sales" className="space-y-4">
          {currentAdminUser?.role !== 'super_admin' && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200">
              <p className="text-sm font-medium">View Only - Sales data can only be edited by Super Admins</p>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Sales Rep Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Sales Rep Assignments
                </CardTitle>
                <CardDescription>Assign sales reps and commission splits (Super Admin only)</CardDescription>
              </CardHeader>
  <CardContent className="space-y-4">
                {/* Revenue Breakdown */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Revenue Breakdown</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Non-Recurring ($)</Label>
                      <Input
                        type="number"
                        value={customer.nonRecurringRevenue || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newTotal = val + ((customer.monthlyRecurringFee || 0) * (customer.paymentTermMonths || 48)) + (customer.otherFees || 0);
                          updateCustomer(customer.id, { nonRecurringRevenue: val, dealAmount: newTotal });
                        }}
                        placeholder="Install, shipping, kiosks..."
                        disabled={currentAdminUser?.role !== 'super_admin'}
                      />
                      <p className="text-xs text-muted-foreground">Install fees, shipping, kiosks, etc.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Monthly Recurring ($)</Label>
                      <Input
                        type="number"
                        value={customer.monthlyRecurringFee || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newTotal = (customer.nonRecurringRevenue || 0) + (val * (customer.paymentTermMonths || 48)) + (customer.otherFees || 0);
                          updateCustomer(customer.id, { monthlyRecurringFee: val, dealAmount: newTotal });
                        }}
                        placeholder="Monthly fee"
                        disabled={currentAdminUser?.role !== 'super_admin'}
                      />
                      <p className="text-xs text-muted-foreground">x {customer.paymentTermMonths || 48} months = ${((customer.monthlyRecurringFee || 0) * (customer.paymentTermMonths || 48)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Other Fees ($)</Label>
                      <Input
                        type="number"
                        value={customer.otherFees || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newTotal = (customer.nonRecurringRevenue || 0) + ((customer.monthlyRecurringFee || 0) * (customer.paymentTermMonths || 48)) + val;
                          updateCustomer(customer.id, { otherFees: val, dealAmount: newTotal });
                        }}
                        placeholder="Other fees"
                        disabled={currentAdminUser?.role !== 'super_admin'}
                      />
                      <p className="text-xs text-muted-foreground">Additional fees</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Deal Amount:</span>
                      <span className="text-xl font-bold">${(customer.dealAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* COGS and Net Deal Amount */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>COGS (Cost of Goods Sold)</Label>
                    <Input
                      type="number"
                      value={customer.cogs || 0}
                      onChange={(e) => updateCustomer(customer.id, { cogs: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      disabled={currentAdminUser?.role !== 'super_admin'}
                    />
                    <p className="text-xs text-muted-foreground">Costs deducted before commission</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Net Deal Amount</Label>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-xl font-bold text-primary">
                        ${((customer.dealAmount || 0) - (customer.cogs || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Deal minus COGS (commission basis)</p>
                  </div>
                </div>

                {/* Commission and Payment Terms */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Commission Rate (%) on Net Deal</Label>
                    <Input
                      type="number"
                      value={customer.commissionRate || 10}
                      onChange={(e) => updateCustomer(customer.id, { commissionRate: parseFloat(e.target.value) || 10 })}
                      placeholder="10"
                      min={0}
                      max={100}
                      disabled={currentAdminUser?.role !== 'super_admin'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Term (Months)</Label>
                    <Input
                      type="number"
                      value={customer.paymentTermMonths || 48}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 48;
                        const newTotal = (customer.nonRecurringRevenue || 0) + ((customer.monthlyRecurringFee || 0) * val) + (customer.otherFees || 0);
                        updateCustomer(customer.id, { paymentTermMonths: val, dealAmount: newTotal });
                      }}
                      placeholder="48"
                      min={1}
                      disabled={currentAdminUser?.role !== 'super_admin'}
                    />
                    <p className="text-xs text-muted-foreground">For monthly commission calculations</p>
                  </div>
                </div>

                {/* Current Assignments */}
                <div className="space-y-2 pt-2 border-t">
                  <Label>Assigned Sales Reps (Split must equal 100%)</Label>
                  {customer.salesRepAssignments && customer.salesRepAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {customer.salesRepAssignments.map((assignment, index) => (
                        <div key={assignment.salesRepId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <span className="flex-1 font-medium">{assignment.salesRepName}</span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={assignment.commissionPercent}
                              onChange={(e) => {
                                const newAssignments = [...customer.salesRepAssignments];
                                newAssignments[index] = { ...assignment, commissionPercent: parseFloat(e.target.value) || 0 };
                                updateCustomer(customer.id, { salesRepAssignments: newAssignments });
                              }}
                              className="w-20 text-right"
                              min={0}
                              max={100}
                              disabled={currentAdminUser?.role !== 'super_admin'}
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                          {currentAdminUser?.role === 'super_admin' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const remainingAssignments = customer.salesRepAssignments.filter((_, i) => i !== index);
                                // Redistribute percentages evenly among remaining reps
                                if (remainingAssignments.length > 0) {
                                  const evenSplit = Math.floor(100 / remainingAssignments.length);
                                  const remainder = 100 - (evenSplit * remainingAssignments.length);
                                  const redistributedAssignments = remainingAssignments.map((a, i) => ({
                                    ...a,
                                    commissionPercent: evenSplit + (i === 0 ? remainder : 0)
                                  }));
                                  updateCustomer(customer.id, { salesRepAssignments: redistributedAssignments });
                                } else {
                                  updateCustomer(customer.id, { salesRepAssignments: [] });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Total Split: {customer.salesRepAssignments.reduce((sum, a) => sum + a.commissionPercent, 0)}%
                          {customer.salesRepAssignments.reduce((sum, a) => sum + a.commissionPercent, 0) !== 100 && (
                            <span className="text-amber-600 ml-2">(Must equal 100%)</span>
                          )}
                        </div>
                        {currentAdminUser?.role === 'super_admin' && customer.salesRepAssignments.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const count = customer.salesRepAssignments.length;
                              const evenSplit = Math.floor(100 / count);
                              const remainder = 100 - (evenSplit * count);
                              const redistributedAssignments = customer.salesRepAssignments.map((a, i) => ({
                                ...a,
                                commissionPercent: evenSplit + (i === 0 ? remainder : 0)
                              }));
                              updateCustomer(customer.id, { salesRepAssignments: redistributedAssignments });
                            }}
                          >
                            Split Evenly
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No sales reps assigned</p>
                  )}
                </div>

                {/* Add Sales Rep - Super Admin Only */}
                {currentAdminUser?.role === 'super_admin' && (
                  <div className="space-y-2">
                    <Label>Add Sales Rep</Label>
                    <Select
                      value=""
                      onValueChange={(repId) => {
                        const rep = SALES_REPS.find(r => r.id === repId);
                        if (rep && !customer.salesRepAssignments?.some(a => a.salesRepId === repId)) {
                          const currentAssignments = customer.salesRepAssignments || [];
                          const newRepCount = currentAssignments.length + 1;
                          const evenSplit = Math.floor(100 / newRepCount);
                          const remainder = 100 - (evenSplit * newRepCount);
                          
                          // Redistribute percentages evenly among all reps
                          const redistributedAssignments = currentAssignments.map((a, i) => ({
                            ...a,
                            commissionPercent: evenSplit + (i === 0 ? remainder : 0)
                          }));
                          
                          const newAssignments = [
                            ...redistributedAssignments,
                            { salesRepId: rep.id, salesRepName: rep.name, commissionPercent: evenSplit }
                          ];
                          updateCustomer(customer.id, { salesRepAssignments: newAssignments });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sales rep to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {SALES_REPS.filter(rep => !customer.salesRepAssignments?.some(a => a.salesRepId === rep.id)).map((rep) => (
                          <SelectItem key={rep.id} value={rep.id}>{rep.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Commission Calculation */}
  {customer.dealAmount && customer.dealAmount > 0 && customer.salesRepAssignments && customer.salesRepAssignments.length > 0 && (
  <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
  Commission Breakdown (Total {customer.commissionRate || 10}% of Net Deal = ${(((customer.dealAmount || 0) - (customer.cogs || 0)) * (customer.commissionRate || 10) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
  </h4>
  <div className="space-y-1 text-sm">
  {customer.salesRepAssignments.map((assignment) => {
  const netDealAmount = (customer.dealAmount || 0) - (customer.cogs || 0);
  const totalCommission = netDealAmount * (customer.commissionRate || 10) / 100;
  const repCommission = totalCommission * assignment.commissionPercent / 100;
                        return (
                          <div key={assignment.salesRepId} className="flex justify-between">
                            <span>{assignment.salesRepName} ({assignment.commissionPercent}% of total)</span>
                            <span className="font-medium">${repCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Status & Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  Payment & Commission Tracking
                </CardTitle>
                <CardDescription>Track payments and commission payouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Status */}
                <div className="space-y-3">
                  <Label>Payment Status</Label>
                  <Select
                    value={customer.paymentStatus || 'unpaid'}
                    onValueChange={(value: 'unpaid' | 'paid_partial' | 'paid_in_full') => {
                      const updates: Partial<typeof customer> = { paymentStatus: value };
                      if (value === 'paid_in_full') {
                        updates.paidToDateAmount = customer.dealAmount || 0;
                        updates.paidDate = new Date().toISOString();
                      }
                      updateCustomer(customer.id, updates);
                    }}
                    disabled={currentAdminUser?.role !== 'super_admin'}
                  >
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid_partial">Paid to Date (Partial)</SelectItem>
                      <SelectItem value="paid_in_full">Paid in Full</SelectItem>
                    </SelectContent>
                  </Select>

                  {customer.paymentStatus === 'paid_partial' && (
                    <div className="space-y-2">
                      <Label>Amount Paid to Date ($)</Label>
                      <Input
                        type="number"
                        value={customer.paidToDateAmount || 0}
                        onChange={(e) => updateCustomer(customer.id, { paidToDateAmount: parseFloat(e.target.value) || 0 })}
                        className="max-w-xs"
                        disabled={currentAdminUser?.role !== 'super_admin'}
                      />
                    </div>
                  )}

                  {customer.paymentStatus === 'paid_in_full' && customer.paidDate && (
                    <Badge className="bg-green-100 text-green-700">
                      Paid in Full on {new Date(customer.paidDate).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                {/* Commission Paid */}
                <div className="space-y-2 pt-2 border-t">
                  <Label>Commission Already Paid ($)</Label>
                  <Input
                    type="number"
                    value={customer.commissionPaidAmount || 0}
                    onChange={(e) => updateCustomer(customer.id, { commissionPaidAmount: parseFloat(e.target.value) || 0 })}
                    className="max-w-xs"
                    disabled={currentAdminUser?.role !== 'super_admin'}
                  />
                </div>

                {/* Commission Summary */}
                {customer.dealAmount && customer.dealAmount > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Commission Summary</h4>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const totalDeal = customer.dealAmount || 0;
                        const cogs = customer.cogs || 0;
                        const netDealAmount = totalDeal - cogs; // Commission is based on Net Deal Amount
                        const commissionRate = customer.commissionRate || 10;
                        const totalCommission = netDealAmount * commissionRate / 100;
                        const paidToDate = customer.paidToDateAmount || 0;
                        // Calculate what percentage of the deal has been paid
                        const paidPercentage = totalDeal > 0 ? paidToDate / totalDeal : 0;
                        // Commission on paid is proportional to the net deal commission
                        const commissionOnPaid = totalCommission * paidPercentage;
                        const commissionPaid = customer.commissionPaidAmount || 0;
                        const commissionOwedNow = commissionOnPaid - commissionPaid;
                        const remainingDeal = totalDeal - paidToDate;
                        const remainingCommission = totalCommission - commissionOnPaid;
                        const monthlyPayment = remainingDeal / (customer.paymentTermMonths || 48);
                        const monthlyCommission = monthlyPayment * commissionRate / 100;
                        
                        return (
                          <>
                            <div className="flex justify-between">
                              <span>Total Deal Amount:</span>
                              <span className="font-medium">${totalDeal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {cogs > 0 && (
                              <>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Less COGS:</span>
                                  <span>-${cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                  <span>Net Deal Amount (Commission Basis):</span>
                                  <span>${netDealAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span>Total Commission ({commissionRate}% of {cogs > 0 ? 'Net' : 'Deal'}):</span>
                              <span className="font-medium">${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                              <div className="flex justify-between">
                                <span>Paid to Date:</span>
                                <span>${paidToDate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Commission on Paid Amount:</span>
                                <span>${commissionOnPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Commission Already Paid Out:</span>
                                <span>${commissionPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between font-bold text-green-700 dark:text-green-400">
                                <span>Commission Owed Now:</span>
                                <span>${Math.max(0, commissionOwedNow).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                            
                            {/* Per Sales Rep Breakdown */}
                            {customer.salesRepAssignments && customer.salesRepAssignments.length > 0 && (
                              <div className="border-t pt-2 mt-2">
                                <p className="font-medium mb-2">Per Sales Rep:</p>
                                <div className="space-y-2">
                                  {customer.salesRepAssignments.map((assignment) => {
                                    const repTotalCommission = totalCommission * assignment.commissionPercent / 100;
                                    const repCommissionOnPaid = commissionOnPaid * assignment.commissionPercent / 100;
                                    const repCommissionPaid = commissionPaid * assignment.commissionPercent / 100;
                                    const repOwedNow = Math.max(0, repCommissionOnPaid - repCommissionPaid);
                                    const repMonthly = monthlyCommission * assignment.commissionPercent / 100;
                                    
                                    return (
                                      <div key={assignment.salesRepId} className="p-2 rounded bg-muted/50">
                                        <div className="flex justify-between font-medium">
                                          <span>{assignment.salesRepName} ({assignment.commissionPercent}%)</span>
                                          <span>${repTotalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                          <span>Paid:</span>
                                          <span>${repCommissionPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-green-600 font-medium">
                                          <span>Owed Now:</span>
                                          <span>${repOwedNow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        {remainingDeal > 0 && (
                                          <div className="flex justify-between text-xs text-amber-600">
                                            <span>Monthly:</span>
                                            <span>${repMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {remainingDeal > 0 && (
                              <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Remaining Balance:</span>
                                  <span>${remainingDeal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Monthly Payment ({customer.paymentTermMonths || 48} mo):</span>
                                  <span>${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Monthly Commission:</span>
                                  <span className="font-medium">${monthlyCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Remaining Commission:</span>
                                  <span>${remainingCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Onboarding Dates Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Onboarding Timeline
              </CardTitle>
              <CardDescription>Track estimated and actual completion dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customer.onboardingDates?.startDate ? new Date(customer.onboardingDates.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const startDate = new Date(e.target.value).toISOString();
                      const estimatedCompletion = new Date(new Date(e.target.value).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString();
                      updateCustomer(customer.id, {
                        onboardingDates: {
                          ...customer.onboardingDates,
                          startDate,
                          estimatedCompletionDate: estimatedCompletion,
                          useAdminOverride: customer.onboardingDates?.useAdminOverride || false,
                        }
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Est. Completion (Start + 4 wks)</Label>
                  <Input
                    type="date"
                    value={customer.onboardingDates?.estimatedCompletionDate ? new Date(customer.onboardingDates.estimatedCompletionDate).toISOString().split('T')[0] : ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    AI Estimate
                    {customer.onboardingDates?.aiEstimatedDate && <Badge variant="outline" className="text-xs">AI</Badge>}
                  </Label>
                  <div className="flex items-center gap-2">
                    {customer.onboardingDates?.aiEstimatedDate ? (
                      <Input
                        type="date"
                        value={new Date(customer.onboardingDates.aiEstimatedDate).toISOString().split('T')[0]}
                        disabled
                        className="bg-muted"
                      />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAIEstimate}
                        disabled={isEstimating || !customer.onboardingDates?.startDate}
                        className="gap-2 w-full bg-transparent"
                      >
                        {isEstimating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {isEstimating ? 'Estimating...' : 'Estimate'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Admin Override</Label>
                    <input
                      type="checkbox"
                      checked={customer.onboardingDates?.useAdminOverride || false}
                      onChange={(e) => updateCustomer(customer.id, {
                        onboardingDates: { ...customer.onboardingDates!, useAdminOverride: e.target.checked }
                      })}
                      className="h-4 w-4"
                    />
                  </div>
                  <Input
                    type="date"
                    value={customer.onboardingDates?.adminOverrideDate ? new Date(customer.onboardingDates.adminOverrideDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateCustomer(customer.id, {
                      onboardingDates: { ...customer.onboardingDates!, adminOverrideDate: new Date(e.target.value).toISOString() }
                    })}
                    disabled={!customer.onboardingDates?.useAdminOverride}
                  />
                </div>
              </div>

              {estimationResult && (
                <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={
                      estimationResult.confidence === 'high' ? 'bg-green-100 text-green-700' :
                      estimationResult.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                    }>
                      {estimationResult.confidence} confidence
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{estimationResult.reasoning}</p>
                  {estimationResult.riskFactors && estimationResult.riskFactors.length > 0 && (
                    <div className="mt-2">
                      <span className="font-medium text-amber-600">Risk factors:</span>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {estimationResult.riskFactors.map((factor, i) => <li key={i}>{factor}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Target Completion Date</h4>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {customer.installationDate
                    ? (() => {
                        // Parse the date and display in local timezone without shifting
                        const dateStr = customer.installationDate.split('T')[0];
                        const [year, month, day] = dateStr.split('-').map(Number);
                        return new Date(year, month - 1, day).toLocaleDateString();
                      })()
                    : 'Not set'}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Based on Installation Date
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
  
<TabsContent value="processors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Processors
                </CardTitle>
                <CardDescription>Manage payment processor links for this customer</CardDescription>
              </div>
              <Button onClick={() => setIsAddProcessorOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Processor
              </Button>
            </CardHeader>
            <CardContent>
              {(customer.paymentProcessors || []).length > 0 ? (
                <div className="space-y-3">
                  {(customer.paymentProcessors || []).map((processor) => (
                    <div key={processor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{processor.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <LinkIcon className="h-3 w-3" />
                            <a 
                              href={processor.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary truncate max-w-md"
                            >
                              {processor.link}
                            </a>
                            {processor.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Added by {processor.addedBy} on {new Date(processor.addedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(processor.link);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(processor.link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditProcessor(processor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteProcessor(processor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No payment processors configured</p>
                  <p className="text-sm">Add a processor to provide the customer with their merchant application link</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Processor Dialog */}
          <Dialog open={isAddProcessorOpen || !!editingProcessor} onOpenChange={(open) => {
            if (!open) {
              setIsAddProcessorOpen(false);
              setEditingProcessor(null);
              resetProcessorForm();
            }
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingProcessor ? 'Edit' : 'Add'} Payment Processor</DialogTitle>
                <DialogDescription>
                  Configure a payment processor link for this customer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Processor Type</Label>
                  <Select
                    value={newProcessor.type}
                    onValueChange={(value: PaymentProcessorType) => {
                      setNewProcessor({ 
                        ...newProcessor, 
                        type: value,
                        useDefaultLink: value === 'paystri' ? newProcessor.useDefaultLink : false,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select processor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardpointe">CardPointe</SelectItem>
                      <SelectItem value="clover">Clover</SelectItem>
                      <SelectItem value="paystri">Paystri</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newProcessor.type === 'other' && (
                  <div className="space-y-2">
                    <Label>Processor Name</Label>
                    <Input
                      placeholder="Enter processor name"
                      value={newProcessor.customName}
                      onChange={(e) => setNewProcessor({ ...newProcessor, customName: e.target.value })}
                    />
                  </div>
                )}

                {newProcessor.type === 'paystri' && (
                  <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border">
                    <input
                      type="checkbox"
                      id="useDefaultLink"
                      checked={newProcessor.useDefaultLink}
                      onChange={(e) => setNewProcessor({ ...newProcessor, useDefaultLink: e.target.checked })}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="useDefaultLink" className="cursor-pointer font-normal text-sm">
                      Use default Paystri link (applies to all customers)
                    </Label>
                  </div>
                )}

                {!(newProcessor.type === 'paystri' && newProcessor.useDefaultLink) && (
                  <div className="space-y-2">
                    <Label>Processor Link</Label>
                    <Input
                      placeholder="https://..."
                      value={newProcessor.link}
                      onChange={(e) => setNewProcessor({ ...newProcessor, link: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the unique merchant application link for this customer
                    </p>
                  </div>
                )}

                {newProcessor.type === 'paystri' && newProcessor.useDefaultLink && (
                  <div className="p-3 bg-muted/30 rounded-lg text-sm">
                    <p className="text-muted-foreground">Default link:</p>
                    <p className="font-mono text-xs break-all">{DEFAULT_PAYSTRI_LINK}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAddProcessorOpen(false);
                  setEditingProcessor(null);
                  resetProcessorForm();
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={editingProcessor ? handleUpdateProcessor : handleAddProcessor}
                  disabled={
                    (newProcessor.type === 'other' && !newProcessor.customName) ||
                    (!(newProcessor.type === 'paystri' && newProcessor.useDefaultLink) && !newProcessor.link)
                  }
                >
                  {editingProcessor ? 'Update' : 'Add'} Processor
                </Button>
              </DialogFooter>
            </DialogContent>
  </Dialog>
  </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Links
                </CardTitle>
                <CardDescription>Manage payment links for this customer. Only visible links will be shown to the customer.</CardDescription>
              </div>
              <Button onClick={() => setIsAddPaymentLinkOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Link
              </Button>
            </CardHeader>
            <CardContent>
              {(customer.paymentLinks || []).length > 0 ? (
                <div className="space-y-3">
                  {(customer.paymentLinks || []).map((link) => (
                    <div key={link.id} className={`flex items-center justify-between p-4 border rounded-lg ${!link.isVisible ? 'opacity-50 bg-muted/30' : ''}`}>
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${link.isVisible ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                          <DollarSign className={`h-5 w-5 ${link.isVisible ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {link.type === 'other' ? link.customLabel : PAYMENT_LINK_LABELS[link.type]}
                            </p>
                            {!link.isVisible && (
                              <Badge variant="secondary" className="text-xs">Hidden</Badge>
                            )}
                            {link.isVisible && (
                              <Badge variant="default" className="text-xs bg-green-600">Visible</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <LinkIcon className="h-3 w-3" />
                            <a 
                              href={link.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary truncate max-w-md"
                            >
                              {link.link}
                            </a>
                          </div>
  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
  {link.amount && (
  <span className="font-medium">Amount: ${link.amount.toLocaleString()}</span>
  )}
  {link.isPaid && (
  <Badge variant="default" className="text-xs bg-green-600">Paid{link.amountPaid ? `: $${link.amountPaid.toLocaleString()}` : ''}</Badge>
  )}
  {link.paidAt && (
  <span>Paid on {new Date(link.paidAt).toLocaleDateString()}</span>
  )}
  <span>Added by {link.addedBy} on {new Date(link.addedAt).toLocaleDateString()}</span>
  </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => togglePaymentLinkVisibility(link)}
                          title={link.isVisible ? 'Hide from customer' : 'Show to customer'}
                        >
                          {link.isVisible ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(link.link);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(link.link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditPaymentLink(link)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeletePaymentLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No payment links configured</p>
                  <p className="text-sm">Add payment links to provide the customer with payment options</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Payment Link Dialog */}
          <Dialog open={isAddPaymentLinkOpen || !!editingPaymentLink} onOpenChange={(open) => {
            if (!open) {
              setIsAddPaymentLinkOpen(false);
              setEditingPaymentLink(null);
              resetPaymentLinkForm();
            }
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPaymentLink ? 'Edit' : 'Add'} Payment Link</DialogTitle>
                <DialogDescription>
                  Configure a payment link for this customer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select
                    value={newPaymentLink.type}
                    onValueChange={(value: PaymentLinkType) => {
                      setNewPaymentLink({ ...newPaymentLink, type: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_payment">Full Payment</SelectItem>
                      <SelectItem value="1st_installment">1st Installment</SelectItem>
                      <SelectItem value="2nd_installment">2nd Installment</SelectItem>
                      <SelectItem value="final_installment">Final Installment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newPaymentLink.type === 'other' && (
                  <div className="space-y-2">
                    <Label>Custom Label</Label>
                    <Input
                      placeholder="Enter payment label"
                      value={newPaymentLink.customLabel}
                      onChange={(e) => setNewPaymentLink({ ...newPaymentLink, customLabel: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Payment Link</Label>
                  <Input
                    placeholder="https://..."
                    value={newPaymentLink.link}
                    onChange={(e) => setNewPaymentLink({ ...newPaymentLink, link: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the payment link URL for this payment option
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Amount (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newPaymentLink.amount}
                    onChange={(e) => setNewPaymentLink({ ...newPaymentLink, amount: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Display amount for reference (does not affect the actual payment)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Due Date (Optional)</Label>
                  <Input
                    type="date"
                    value={newPaymentLink.dueDate}
                    onChange={(e) => setNewPaymentLink({ ...newPaymentLink, dueDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    When this payment is due. Customer will see reminders in their portal.
                  </p>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border">
                  <input
                    type="checkbox"
                    id="isVisible"
                    checked={newPaymentLink.isVisible}
                    onChange={(e) => setNewPaymentLink({ ...newPaymentLink, isVisible: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
  <Label htmlFor="isVisible" className="cursor-pointer font-normal text-sm">
  Visible to customer
  </Label>
  </div>

                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <input
                    type="checkbox"
                    id="isPaid"
                    checked={newPaymentLink.isPaid}
                    onChange={(e) => setNewPaymentLink({ ...newPaymentLink, isPaid: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="isPaid" className="cursor-pointer font-normal text-sm">
                    Mark as Paid
                  </Label>
                </div>

                {newPaymentLink.isPaid && (
                  <div className="space-y-2">
                    <Label>Amount Paid</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newPaymentLink.amountPaid}
                      onChange={(e) => setNewPaymentLink({ ...newPaymentLink, amountPaid: e.target.value })}
                    />
                  </div>
                )}
  </div>
  <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAddPaymentLinkOpen(false);
                  setEditingPaymentLink(null);
                  resetPaymentLinkForm();
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={editingPaymentLink ? handleUpdatePaymentLink : handleAddPaymentLink}
                  disabled={
                    !newPaymentLink.link ||
                    (newPaymentLink.type === 'other' && !newPaymentLink.customLabel)
                  }
                >
                  {editingPaymentLink ? 'Update' : 'Add'} Payment Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
  
<TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.employees.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>PIN</TableHead>
                        <TableHead>Privilege Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.phone}</TableCell>
                          <TableCell>{employee.pin}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{employee.privilegeLevel}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No employees added yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machines" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Machine Inventory</CardTitle>
                <CardDescription>
                  Washers: 1-99 | Dryers: 101-199
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddMachineOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Machine
              </Button>
            </CardHeader>
            <CardContent>
              {customer.machines.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Make</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Coins</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...customer.machines]
                        .sort((a, b) => a.machineNumber - b.machineNumber)
                        .map((machine) => (
                          <TableRow key={machine.id}>
                            <TableCell className="font-bold text-lb-blue">{machine.machineNumber}</TableCell>
                            <TableCell>
                              <Badge variant={machine.type === 'washer' ? 'default' : 'secondary'} className="capitalize">
                                {machine.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{machine.make}</TableCell>
                            <TableCell>{machine.model}</TableCell>
                            <TableCell>
                      <Input
                        className="font-mono text-sm h-8 w-32"
                        value={machine.serialNumber || ''}
                        onChange={(e) => updateCustomerMachine(customer.id, machine.id, { serialNumber: e.target.value })}
                        placeholder="Enter S/N"
                      />
                    </TableCell>
                            <TableCell className="capitalize">{machine.coinsAccepted}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openRenumberMachine(machine)}
                                  title="Change Number"
                                >
                                  <ArrowUpDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditMachine(machine)}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-lb-blue hover:text-lb-cyan"
                                  onClick={() => { setCloneMachine(machine); setCloneCount(1); }}
                                  title="Clone"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteMachine(machine.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <WashingMachine className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No machines added yet</p>
                  <Button onClick={() => setIsAddMachineOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Machine
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Machine Dialog */}
          <Dialog open={isAddMachineOpen || !!editingMachine} onOpenChange={(open) => {
            if (!open) {
              setIsAddMachineOpen(false);
              setEditingMachine(null);
              resetMachineForm();
            }
          }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingMachine ? 'Edit Machine' : 'Add New Machine'}</DialogTitle>
                <DialogDescription>
                  {editingMachine 
                    ? 'Update machine details' 
                    : 'Add a new washer or dryer to this customer\'s inventory'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newMachine.type}
                      onValueChange={(value: MachineType) => setNewMachine({ ...newMachine, type: value })}
                      disabled={!!editingMachine}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="washer">Washer (1-99)</SelectItem>
                        <SelectItem value="dryer">Dryer (101-199)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Coins Accepted</Label>
                    <Select
                      value={newMachine.coinsAccepted}
                      onValueChange={(value: CoinType) => setNewMachine({ ...newMachine, coinsAccepted: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quarter">Quarter</SelectItem>
                        <SelectItem value="dollar">Dollar</SelectItem>
                        <SelectItem value="token">Token</SelectItem>
                        <SelectItem value="none">None (Card Only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
  <Label>Make</Label>
  <Select
  value={newMachine.make}
  onValueChange={(value) => {
    setNewMachine({ ...newMachine, make: value });
    if (value !== 'Other') setOtherMake('');
  }}
  >
  <SelectTrigger>
  <SelectValue placeholder="Select make" />
  </SelectTrigger>
  <SelectContent>
  {MACHINE_MAKES.map((make) => (
  <SelectItem key={make} value={make}>{make}</SelectItem>
  ))}
  </SelectContent>
  </Select>
  {newMachine.make === 'Other' && (
    <Input
      placeholder="Enter manufacturer name"
      value={otherMake}
      onChange={(e) => setOtherMake(e.target.value)}
      className="mt-2"
    />
  )}
  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      value={newMachine.model || ''}
                      onChange={(e) => setNewMachine({ ...newMachine, model: e.target.value })}
                      placeholder="e.g., SC40"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input
                    value={newMachine.serialNumber || ''}
                    onChange={(e) => setNewMachine({ ...newMachine, serialNumber: e.target.value })}
                    placeholder="Enter serial number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>After Market Upgrades (Optional)</Label>
                  <Input
                    value={newMachine.afterMarketUpgrades || ''}
                    onChange={(e) => setNewMachine({ ...newMachine, afterMarketUpgrades: e.target.value })}
                    placeholder="e.g., Coin slide, drain valve"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAddMachineOpen(false);
                  setEditingMachine(null);
                  resetMachineForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={editingMachine ? handleUpdateMachine : handleAddMachine} disabled={!(newMachine.make === 'Other' ? otherMake : newMachine.make) || !newMachine.model}>
                  {editingMachine ? 'Save Changes' : 'Add Machine'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Clone Machine Dialog */}
          <Dialog open={!!cloneMachine} onOpenChange={(open) => !open && setCloneMachine(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Clone Machine</DialogTitle>
                <DialogDescription>
                  Create copies of this {cloneMachine?.type} with the same settings
                </DialogDescription>
              </DialogHeader>
              {cloneMachine && (
                <div className="space-y-4 py-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <p className="font-medium text-foreground">Machine to Clone:</p>
                    <p className="text-muted-foreground capitalize">
                      #{cloneMachine.machineNumber} - {cloneMachine.type} - {cloneMachine.make} {cloneMachine.model}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Similar Machine Types and Sizes</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={cloneCount}
                      onChange={(e) => setCloneCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will add {cloneCount} new {cloneMachine.type}{cloneCount > 1 ? 's' : ''} with automatic numbering. Serial numbers will be blank.
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setCloneMachine(null)}>Cancel</Button>
                <Button onClick={handleCloneMachines}>
                  <Copy className="h-4 w-4 mr-2" />
                  Clone {cloneCount} Machine{cloneCount > 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Renumber Machine Dialog */}
          <Dialog open={!!renumberMachine} onOpenChange={(open) => !open && setRenumberMachine(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Change Machine Number</DialogTitle>
                <DialogDescription>
                  Assign a new number to this {renumberMachine?.type}
                </DialogDescription>
              </DialogHeader>
              {renumberMachine && (
                <div className="space-y-4 py-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <p className="font-medium text-foreground">Current Machine:</p>
                    <p className="text-muted-foreground capitalize">
                      #{renumberMachine.machineNumber} - {renumberMachine.type} - {renumberMachine.make} {renumberMachine.model}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>New Machine Number</Label>
                    <Input
                      type="number"
                      min={1}
                      max={199}
                      value={newMachineNumber}
                      onChange={(e) => setNewMachineNumber(parseInt(e.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {renumberMachine.type === 'washer' ? 'Washers: 1-99' : 'Dryers: 101-199'}
                    </p>
                    {customer && !isNumberInRange(newMachineNumber, renumberMachine.type) && (
                      currentAdminUser?.role === 'super_admin' ? (
                        <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs">
                          <p className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Warning: Out of Standard Range
                          </p>
                          <p className="text-amber-700 dark:text-amber-300 mt-1">
                            Standard ranges are Washers: 1-99, Dryers: 101-199. As a Super Admin, you can override this, but it may cause confusion in reporting and machine identification.
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-destructive">
                          Number is out of valid range. Only Super Admins can override standard ranges.
                        </p>
                      )
                    )}
                    {customer && isNumberInRange(newMachineNumber, renumberMachine.type) && (() => {
                      const existingMachine = getMachineByNumber(newMachineNumber, customer.machines);
                      if (existingMachine && existingMachine.id !== renumberMachine.id) {
                        return (
                          <div className="p-2 rounded bg-lb-cyan/10 border border-lb-cyan/20 text-xs">
                            <p className="font-medium text-lb-blue">Swap with existing machine:</p>
                            <p className="text-muted-foreground capitalize">
                              #{existingMachine.machineNumber} {existingMachine.make} {existingMachine.model} will become #{renumberMachine.machineNumber}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setRenumberMachine(null)}>Cancel</Button>
                <Button 
                  onClick={handleRenumberMachine}
                  disabled={!customer || !renumberMachine || (!isNumberInRange(newMachineNumber, renumberMachine.type) && currentAdminUser?.role !== 'super_admin')}
                >
                  {customer && getMachineByNumber(newMachineNumber, customer.machines)?.id !== renumberMachine?.id && getMachineByNumber(newMachineNumber, customer.machines) 
                    ? 'Swap Numbers' 
                    : 'Update Number'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
  </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          {/* Store Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Building2 className="h-5 w-5" />
                Store Logo
              </CardTitle>
              <CardDescription>
                The store logo displayed in the customer portal and admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.storeLogo ? (
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-lg overflow-hidden bg-white border border-border flex items-center justify-center p-2">
                    <img 
                      src={customer.storeLogo.url || "/placeholder.svg"} 
                      alt="Store Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{customer.storeLogo.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(customer.storeLogo.uploadedAt).toLocaleDateString()}
                      {customer.storeLogo.uploadedBy && ` by ${customer.storeLogo.uploadedBy}`}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-transparent"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const url = URL.createObjectURL(file)
                            updateCustomer(customer.id, {
                              storeLogo: {
                                id: crypto.randomUUID(),
                                url,
                                name: file.name,
                                uploadedAt: new Date().toISOString(),
                                uploadedBy: currentAdminUser?.name || 'Admin',
                              }
                            })
                          }
                        }
                        input.click()
                      }}
                    >
                      Change Logo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Logo Uploaded</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a store logo to display in the customer portal.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          const url = URL.createObjectURL(file)
                          updateCustomer(customer.id, {
                            storeLogo: {
                              id: crypto.randomUUID(),
                              url,
                              name: file.name,
                              uploadedAt: new Date().toISOString(),
                              uploadedBy: currentAdminUser?.name || 'Admin',
                            }
                          })
                        }
                      }
                      input.click()
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos & Videos Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Camera className="h-5 w-5" />
                    Store Photos & Videos
                  </CardTitle>
                  <CardDescription>
                    Media uploaded by the customer or admin
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('[v0] Add Media button clicked')
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*,video/*,.mov,.mp4,.avi,.mkv,.wmv,.flv,.mts,.m2ts'
                    input.multiple = true
                    input.onchange = async (e) => {
                      console.log('[v0] File input changed')
                      const files = (e.target as HTMLInputElement).files
                      if (files && files.length > 0) {
                        console.log('[v0] Files selected:', files.length)
                        const videoExtensions = ['.mov', '.mp4', '.avi', '.mkv', '.wmv', '.flv', '.mts', '.m2ts', '.webm', '.ogv', '.3gp']
                        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                        
                        console.log('[v0] Supabase URL:', supabaseUrl ? 'set' : 'missing')
                        console.log('[v0] Supabase Key:', supabaseAnonKey ? 'set' : 'missing')
                        
                        if (!supabaseUrl || !supabaseAnonKey) {
                          alert('Storage not configured')
                          return
                        }
                        
                        const newMedia: Array<{id: string; type: 'image' | 'video'; url: string; name: string; uploadedAt: string; uploadedBy: string}> = []
                        for (const file of Array.from(files)) {
                          console.log('[v0] Processing file:', file.name, file.type)
                          const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
                          const isVideo = file.type.startsWith('video/') || videoExtensions.includes(fileExt)
                          
                          // Generate unique filename
                          const timestamp = Date.now()
                          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                          const filename = `customers/${customer.id}/media/${timestamp}-${safeName}`
                          
                          // Upload to Supabase Storage
                          const uploadUrl = `${supabaseUrl}/storage/v1/object/media/${filename}`
                          console.log('[v0] Uploading to:', uploadUrl)
                          
                          try {
                            const arrayBuffer = await file.arrayBuffer()
                            console.log('[v0] File size:', arrayBuffer.byteLength)
                            
                            const response = await fetch(uploadUrl, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${supabaseAnonKey}`,
                                'Content-Type': file.type || 'application/octet-stream',
                                'x-upsert': 'true',
                              },
                              body: arrayBuffer,
                            })
                            
                            console.log('[v0] Upload response:', response.status)
                            
                            if (response.ok) {
                              const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${filename}`
                              newMedia.push({
                                id: crypto.randomUUID(),
                                type: isVideo ? 'video' : 'image',
                                url: publicUrl,
                                name: file.name,
                                uploadedAt: new Date().toISOString(),
                                uploadedBy: currentAdminUser?.name || 'Admin',
                              })
                              console.log('[v0] Upload successful:', publicUrl)
                            } else {
                              const errorText = await response.text()
                              console.error('[v0] Upload failed:', errorText)
                            }
                          } catch (err) {
                            console.error('[v0] Upload error:', err)
                          }
                        }
                        
                        if (newMedia.length > 0) {
                          // IMPORTANT: Fetch fresh data from database before merging to avoid overwriting
                          // This prevents race conditions where local state might be stale
                          try {
                            const fetchResponse = await fetch(`/api/customers/${customer.id}`)
                            let existingMedia: typeof newMedia = []
                            
                            if (fetchResponse.ok) {
                              const fetchData = await fetchResponse.json()
                              existingMedia = fetchData.customer?.storeMedia || []
                            }
                            
                            const updatedMedia = [...existingMedia, ...newMedia]
                            
                            // Save merged media to database
                            const response = await fetch(`/api/customers/${customer.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ storeMedia: updatedMedia }),
                            })
                            
                            if (response.ok) {
                              // Update local store with the merged data
                              updateCustomer(customer.id, { storeMedia: updatedMedia })
                            }
                          } catch (err) {
                            console.error('Error saving media:', err)
                          }
                        }
                      }
                    }
                    input.click()
                    console.log('[v0] File input click triggered')
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Media
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customer.storeMedia && customer.storeMedia.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {customer.storeMedia.map((media) => (
                    <div key={media.id} className="relative group rounded-lg overflow-hidden border border-border">
                      {media.type === 'image' ? (
                        <div className="aspect-square relative">
                          <img 
                            src={media.url || "/placeholder.svg"} 
                            alt={media.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square relative bg-muted">
                          <video 
                            src={media.url}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                          />
                          <span className="absolute top-2 left-2 text-xs bg-background/80 px-2 py-1 rounded flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            Video
                          </span>
                        </div>
                      )}
                      {/* Action buttons overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setPreviewMedia({ url: media.url, type: media.type, name: media.name })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            updateCustomer(customer.id, {
                              storeMedia: customer.storeMedia?.filter(m => m.id !== media.id)
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-2 bg-background">
                        <p className="text-sm font-medium truncate">{media.name}</p>
                        {media.description && (
                          <p className="text-xs text-muted-foreground truncate">{media.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(media.uploadedAt).toLocaleDateString()}
                          {media.uploadedBy && ` by ${media.uploadedBy}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Photos Yet</h3>
                  <p className="text-muted-foreground">
                    No photos or videos have been uploaded yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
              <CardDescription>
                Shipping address and delivery preferences from onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.shippingInfo ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">Address Type</Label>
                        <p className="font-medium text-foreground">
                          {customer.shippingInfo.sameAsLocation ? 'Same as Location Address' : 'Different Address'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Street Address</Label>
                        <p className="font-medium text-foreground">{customer.shippingInfo.address || '—'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">City</Label>
                        <p className="font-medium text-foreground">{customer.shippingInfo.city || '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">State</Label>
                        <p className="font-medium text-foreground">{customer.shippingInfo.state || '—'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">ZIP Code</Label>
                        <p className="font-medium text-foreground">{customer.shippingInfo.zipCode || '—'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Shipment Method</Label>
                        <Badge variant="secondary" className="mt-1">
                          {customer.shippingInfo.shipmentMethod === 'ltl_freight' ? 'LTL Freight' :
                           customer.shippingInfo.shipmentMethod === 'ups' ? 'UPS' : 
                           customer.shippingInfo.shipmentMethod || '—'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {customer.shippingInfo.notes && (
                    <div className="border-t pt-4">
                      <Label className="text-muted-foreground">Shipping Notes</Label>
                      <p className="font-medium text-foreground mt-1">{customer.shippingInfo.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Shipping Info</h3>
                  <p className="text-muted-foreground">
                    Shipping information will appear here once the customer completes that step.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PCI Compliance Tab */}
        <TabsContent value="pci" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5" />
                PCI Compliance Attestation
              </CardTitle>
              <CardDescription>
                PCI compliance consent and attestation details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.pciCompliance ? (
                <div className="space-y-6">
                  {/* Consent Status */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                    {customer.pciCompliance.hasConsented ? (
                      <>
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-600">PCI Compliance Attested</p>
                          <p className="text-sm text-muted-foreground">
                            Consent given on {new Date(customer.pciCompliance.consentDate).toLocaleDateString()}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-amber-600">Pending Attestation</p>
                          <p className="text-sm text-muted-foreground">
                            Customer has not yet attested to PCI compliance
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Signatory Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">Representative Name</Label>
                        <p className="font-medium text-foreground">{customer.pciCompliance.representativeName || '—'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Company Name</Label>
                        <p className="font-medium text-foreground">{customer.pciCompliance.companyName || '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">Title</Label>
                        <p className="font-medium text-foreground">{customer.pciCompliance.title || '—'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Consent Date</Label>
                        <p className="font-medium text-foreground">
                          {customer.pciCompliance.consentDate 
                            ? new Date(customer.pciCompliance.consentDate).toLocaleString() 
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attestation Text */}
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground mb-2 block">Attestation Statement</Label>
                    <div className="p-4 bg-muted/30 rounded-lg border border-border text-sm text-muted-foreground">
                      <p>
                        The signer attests that their company maintains PCI DSS compliance and follows all applicable 
                        data security standards for the protection of cardholder data. They acknowledge understanding 
                        of their responsibilities under the Payment Card Industry Data Security Standard.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No PCI Attestation</h3>
                  <p className="text-muted-foreground">
                    PCI compliance attestation will appear here once the customer completes that step.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
  
<TabsContent value="notes" className="space-y-4">
          {/* Add New Note */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Plus className="h-4 w-4" />
                Add Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your note here..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes List with Audit Trail */}
          {(() => {
            // Ensure notes is always an array (handle legacy string format)
            const notesArray: CustomerNote[] = Array.isArray(customer.notes) 
              ? customer.notes 
              : (typeof customer.notes === 'string' && customer.notes) 
                ? [{ id: 'legacy', content: customer.notes, createdAt: customer.createdAt, createdBy: 'System', isEdited: false }]
                : [];
            
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Notes History
                  </CardTitle>
                  <CardDescription>
                    {notesArray.length} note{notesArray.length !== 1 ? 's' : ''} total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {notesArray.length > 0 ? (
                    <div className="space-y-4">
                      {[...notesArray]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((note) => (
                          <div key={note.id} className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-foreground whitespace-pre-wrap flex-1">{note.content}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditNote(note)}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteNoteId(note.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Audit Trail */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-3">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>Created by {note.createdBy || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{note.createdAt ? formatNoteDate(note.createdAt) : 'Unknown date'}</span>
                              </div>
                              {note.isEdited && note.updatedAt && (
                                <div className="flex items-center gap-1 text-lb-blue">
                                  <History className="h-3 w-3" />
                                  <span>Edited by {note.updatedBy} on {formatNoteDate(note.updatedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No notes added yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Add a note above to start tracking activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Edit Note Dialog */}
          <Dialog open={!!editingNote} onOpenChange={(open) => {
            if (!open) {
              setEditingNote(null);
              setEditNoteContent("");
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Note</DialogTitle>
                <DialogDescription>
                  Update the note content. Changes will be tracked in the audit trail.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  value={editNoteContent}
                  onChange={(e) => setEditNoteContent(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingNote(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateNote} disabled={!editNoteContent.trim()}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Note Confirmation */}
          <Dialog open={!!deleteNoteId} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Note</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this note? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteNoteId(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteNote}>
                  Delete Note
                </Button>
              </DialogFooter>
            </DialogContent>
  </Dialog>
  </TabsContent>

  {/* Portal Access Tab */}
  <TabsContent value="portal-access" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <User className="h-5 w-5" />
          Portal Users
        </CardTitle>
        <CardDescription>
          Manage users who can access the customer portal for this business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PortalAccessManager customerId={customer.id} customerEmail={customer.email} customerName={customer.ownerName} />
      </CardContent>
    </Card>
  </TabsContent>
  </Tabs>

      {/* Media Preview Modal */}
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate pr-8">{previewMedia?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center bg-black/5">
            {previewMedia?.type === 'image' ? (
              <img 
                src={previewMedia.url || "/placeholder.svg"} 
                alt={previewMedia.name}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            ) : previewMedia?.type === 'video' ? (
              <video 
                src={previewMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[70vh] rounded"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
  
      {/* Edit Customer Dialog */}
      <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-businessName">Business Name</Label>
              <Input
                id="edit-businessName"
                value={editCustomerData.businessName}
                onChange={(e) => setEditCustomerData({ ...editCustomerData, businessName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ownerName">Owner Name</Label>
              <Input
                id="edit-ownerName"
                value={editCustomerData.ownerName}
                onChange={(e) => setEditCustomerData({ ...editCustomerData, ownerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editCustomerData.email}
                onChange={(e) => setEditCustomerData({ ...editCustomerData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editCustomerData.phone}
                onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editCustomerData.status}
                onValueChange={(value: OnboardingStatus) => setEditCustomerData({ ...editCustomerData, status: value })}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="needs_review">Needs Review</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-contractSigned"
                  checked={editCustomerData.contractSigned}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, contractSigned: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-contractSigned">Contract Signed</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-installationDate">Installation Date</Label>
              <Input
                id="edit-installationDate"
                type="date"
                value={editCustomerData.installationDate}
                onChange={(e) => setEditCustomerData({ ...editCustomerData, installationDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goLiveDate">Go Live Date</Label>
              <Input
                id="edit-goLiveDate"
                type="date"
                value={editCustomerData.goLiveDate}
                onChange={(e) => setEditCustomerData({ ...editCustomerData, goLiveDate: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                value={editCustomerData.notes}
                onChange={(e) => setEditCustomerData({ ...editCustomerData, notes: e.target.value })}
                placeholder="Internal notes about this customer..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCustomerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCustomer}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  </div>
  );
  }
