"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore, useAdminStore } from "@/lib/store";
import { getCustomerById, updateCustomer as updateSupabaseCustomer } from "@/lib/supabase/customers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/header";
import { StageProgress, StageProgressBar } from "@/components/onboarding/stage-progress";
import { getDefaultTaskStatuses, ONBOARDING_STAGES, calculateProgress } from "@/lib/onboarding-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  LogOut,
  User,
  CreditCard,
  ExternalLink,
  DollarSign,
  Camera,
  Video,
  Plus,
  Trash2,
  ImageIcon,
  Truck,
  CalendarDays,
  Users,
  WashingMachine,
  Package,
  Shield,
  UserPlus,
  Pencil,
  Eye,
  X,
} from "lucide-react";
import { PAYMENT_LINK_LABELS, type Customer, type Employee, type Machine, type ShippingInfo, type PCICompliance } from "@/lib/types";

const statusColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  needs_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function PortalDashboardPage() {
  const router = useRouter();
  const { currentCustomerUser, setCurrentCustomerUser } = useUserStore();
  const { customers, updateCustomer, setCustomers } = useAdminStore();
  const [supabaseCustomer, setSupabaseCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Employee dialog state
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({ name: '', phone: '', pin: '', privilegeLevel: 'employee' });
  
  // Machine dialog state
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [newMachine, setNewMachine] = useState<Partial<Machine>>({ type: 'washer', make: '', model: '', serialNumber: '' });
  
  // Shipping dialog state
  const [isEditShippingOpen, setIsEditShippingOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState<Partial<ShippingInfo>>({});
  
  // PCI dialog state
  const [isEditPCIOpen, setIsEditPCIOpen] = useState(false);
  const [pciForm, setPciForm] = useState<Partial<PCICompliance>>({});
  
  // Portal user dialog state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newPortalUser, setNewPortalUser] = useState({ username: '', password: '', name: '', email: '' });
  
  // Media preview state
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  
  // Portal users state (from customer_users table)
  const [portalUsers, setPortalUsers] = useState<Array<{ id: string; name: string; email: string; role: string; is_active: boolean; created_at: string }>>([]);
  
  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentCustomerUser) {
      router.push("/portal/login");
    }
  }, [currentCustomerUser, router]);

  // Load customer from Supabase via API (bypasses RLS)
  useEffect(() => {
    async function loadCustomer() {
      if (!currentCustomerUser?.customerId) return;
      
      setIsLoading(true);
      try {
        // Use API route that uses admin client to bypass RLS
        const response = await fetch(`/api/portal/customer?id=${currentCustomerUser.customerId}`);
        const result = await response.json();
        
        if (response.ok && result.customer) {
          setSupabaseCustomer(result.customer);
          // Also update the local store
          setCustomers(prev => {
            const existing = prev.find(c => c.id === result.customer.id);
            if (existing) {
              return prev.map(c => c.id === result.customer.id ? { ...existing, ...result.customer } : c);
            }
            return [...prev, result.customer];
          });
        }
      } catch (error) {
        console.error('Error loading customer:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomer();
  }, [currentCustomerUser?.customerId, setCustomers]);

  // Load portal users from customer_users table
  useEffect(() => {
    async function loadPortalUsers() {
      if (!currentCustomerUser?.customerId) return;
      try {
        const response = await fetch(`/api/portal/users?customerId=${currentCustomerUser.customerId}`);
        if (response.ok) {
          const data = await response.json();
          setPortalUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error loading portal users:', error);
      }
    }
    loadPortalUsers();
  }, [currentCustomerUser?.customerId]);

  if (!currentCustomerUser) {
    return null;
  }

  // Use Supabase customer data if available, otherwise fall back to local store
  const localCustomer = customers.find(c => c.id === currentCustomerUser.customerId);
  const customer = supabaseCustomer || localCustomer;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Customer not found. Please contact support.</p>
              <Button 
                variant="outline" 
                className="mt-4 bg-transparent"
                onClick={() => {
                  setCurrentCustomerUser(null);
                  router.push("/portal/login");
                }}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const taskStatuses = customer.taskStatuses || getDefaultTaskStatuses();
  const completedTaskIds = Object.entries(taskStatuses)
    .filter(([_, status]) => status === 'complete')
    .map(([taskId]) => taskId);
  const overallProgress = calculateProgress(completedTaskIds);
  const totalTasks = ONBOARDING_STAGES.reduce((sum, s) => sum + s.tasks.length, 0);

  const handleLogout = () => {
    setCurrentCustomerUser(null);
    router.push("/portal/login");
  };

  // Save to database via API
  const saveToDatabase = async (updates: Partial<Customer>) => {
    if (!customer) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        // Update local state
        updateCustomer(customer.id, updates);
        setSupabaseCustomer(prev => prev ? { ...prev, ...updates } : prev);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Employee handlers
  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.phone || !newEmployee.pin) return;
    const employee: Employee = {
      id: crypto.randomUUID(),
      name: newEmployee.name,
      phone: newEmployee.phone,
      pin: newEmployee.pin,
      privilegeLevel: newEmployee.privilegeLevel || 'employee',
    };
    const updatedEmployees = [...(customer.employees || []), employee];
    await saveToDatabase({ employees: updatedEmployees });
    setNewEmployee({ name: '', phone: '', pin: '', privilegeLevel: 'employee' });
    setIsAddEmployeeOpen(false);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;
    const updatedEmployees = (customer.employees || []).map(e => 
      e.id === editingEmployee.id ? editingEmployee : e
    );
    await saveToDatabase({ employees: updatedEmployees });
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = async (id: string) => {
    const updatedEmployees = (customer.employees || []).filter(e => e.id !== id);
    await saveToDatabase({ employees: updatedEmployees });
  };

  // Machine handlers
  const getNextMachineNumber = (type: 'washer' | 'dryer') => {
    const machines = customer.machines || [];
    const typeMachines = machines.filter(m => m.type === type);
    const baseNumber = type === 'washer' ? 1 : 101;
    const maxNumber = type === 'washer' ? 99 : 199;
    for (let i = baseNumber; i <= maxNumber; i++) {
      if (!typeMachines.find(m => m.machineNumber === i)) return i;
    }
    return baseNumber;
  };

  const handleAddMachine = async () => {
    if (!newMachine.type || !newMachine.make || !newMachine.model) return;
    const machine: Machine = {
      id: crypto.randomUUID(),
      machineNumber: getNextMachineNumber(newMachine.type as 'washer' | 'dryer'),
      type: newMachine.type as 'washer' | 'dryer',
      make: newMachine.make,
      model: newMachine.model,
      serialNumber: newMachine.serialNumber || '',
      coinsAccepted: 'quarter',
      pricing: {},
    };
    const updatedMachines = [...(customer.machines || []), machine];
    await saveToDatabase({ machines: updatedMachines });
    setNewMachine({ type: 'washer', make: '', model: '', serialNumber: '' });
    setIsAddMachineOpen(false);
  };

  const handleUpdateMachine = async () => {
    if (!editingMachine) return;
    const updatedMachines = (customer.machines || []).map(m => 
      m.id === editingMachine.id ? editingMachine : m
    );
    await saveToDatabase({ machines: updatedMachines });
    setEditingMachine(null);
  };

  const handleDeleteMachine = async (id: string) => {
    const updatedMachines = (customer.machines || []).filter(m => m.id !== id);
    await saveToDatabase({ machines: updatedMachines });
  };

  // Shipping handler
  const handleSaveShipping = async () => {
    await saveToDatabase({ shippingInfo: shippingForm as ShippingInfo });
    setIsEditShippingOpen(false);
  };

  // PCI handler
  const handleSavePCI = async () => {
    await saveToDatabase({ pciCompliance: pciForm as PCICompliance });
    setIsEditPCIOpen(false);
  };

  // Portal user handler - uses customer_users table via API
  const handleAddPortalUser = async () => {
    if (!newPortalUser.username || !newPortalUser.password || !newPortalUser.name) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/portal/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          name: newPortalUser.name,
          email: newPortalUser.username, // username is the email
          password: newPortalUser.password,
          role: 'staff',
        }),
      });
      if (response.ok) {
        // Refresh portal users list
        await fetchPortalUsers();
        setNewPortalUser({ username: '', password: '', name: '', email: '' });
        setIsAddUserOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating portal user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePortalUser = async (id: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/portal/users?userId=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchPortalUsers();
      }
    } catch (error) {
      console.error('Error deleting portal user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch portal users from customer_users table
  const fetchPortalUsers = async () => {
    try {
      const response = await fetch(`/api/portal/users?customerId=${customer.id}`);
      if (response.ok) {
        const data = await response.json();
        setPortalUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching portal users:', error);
    }
  };

  // Media upload handler
  const handleMediaUpload = async (files: FileList) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return;

    const videoExtensions = ['.mov', '.mp4', '.avi', '.mkv', '.wmv', '.flv', '.mts', '.m2ts', '.webm', '.ogv', '.3gp'];
    const newMedia: Array<{id: string; type: 'image' | 'video'; url: string; name: string; uploadedAt: string; uploadedBy: string}> = [];

    for (const file of Array.from(files)) {
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      const isVideo = file.type.startsWith('video/') || videoExtensions.includes(fileExt);
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `customers/${customer.id}/media/${timestamp}-${safeName}`;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const response = await fetch(`${supabaseUrl}/storage/v1/object/media/${filename}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': file.type || 'application/octet-stream',
            'x-upsert': 'true',
          },
          body: arrayBuffer,
        });

        if (response.ok) {
          newMedia.push({
            id: crypto.randomUUID(),
            type: isVideo ? 'video' : 'image',
            url: `${supabaseUrl}/storage/v1/object/public/media/${filename}`,
            name: file.name,
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentCustomerUser?.name || 'Customer',
          });
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    if (newMedia.length > 0) {
      await saveToDatabase({ storeMedia: [...(customer.storeMedia || []), ...newMedia] });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Installation Date Banner - Prominent at top */}
          {customer.installationDate && (
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estimated Installation Date</p>
                    <p className="text-2xl font-bold text-primary">
                      {new Date(customer.installationDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground text-sm px-4 py-1">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {Math.ceil((new Date(customer.installationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days away
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Payment Due Banner - Shows urgent payment notifications */}
          {(() => {
            const unpaidPayments = (customer.paymentLinks || []).filter(p => p.isVisible && !p.isPaid && p.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const urgentPayments = unpaidPayments.map(payment => {
              const dueDate = new Date(payment.dueDate!);
              dueDate.setHours(0, 0, 0, 0);
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return { ...payment, daysUntilDue, dueDate };
            }).filter(p => p.daysUntilDue <= 5).sort((a, b) => a.daysUntilDue - b.daysUntilDue);

            if (urgentPayments.length === 0) return null;

            return urgentPayments.map(payment => {
              const isPastDue = payment.daysUntilDue < 0;
              const isDueToday = payment.daysUntilDue === 0;
              const paymentLabel = payment.type === 'other' ? payment.customLabel : PAYMENT_LINK_LABELS[payment.type];
              
              let bannerStyle = 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
              let iconColor = 'text-amber-600';
              let title = 'Payment Due Soon';
              let subtitle = `Due in ${payment.daysUntilDue} day${payment.daysUntilDue !== 1 ? 's' : ''}`;
              
              if (isPastDue) {
                bannerStyle = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                iconColor = 'text-red-600';
                title = 'Pay Now to Keep Account Current';
                subtitle = `Was due ${new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
              } else if (isDueToday) {
                bannerStyle = 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
                iconColor = 'text-orange-600';
                title = 'Payment is Due Today';
                subtitle = 'Due Today';
              }

              return (
                <Card key={payment.id} className={`border-2 ${bannerStyle}`}>
                  <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-full p-3 ${isPastDue ? 'bg-red-100 dark:bg-red-900/30' : isDueToday ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                        <AlertCircle className={`h-6 w-6 ${iconColor}`} />
                      </div>
                      <div>
                        <p className={`text-lg font-semibold ${isPastDue ? 'text-red-700 dark:text-red-400' : isDueToday ? 'text-orange-700 dark:text-orange-400' : 'text-amber-700 dark:text-amber-400'}`}>
                          {title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {paymentLabel}{payment.amount ? ` - $${payment.amount.toLocaleString()}` : ''} • {subtitle}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => window.open(payment.link, '_blank')}
                      className={isPastDue ? 'bg-red-600 hover:bg-red-700' : isDueToday ? 'bg-orange-600 hover:bg-orange-700' : 'bg-amber-600 hover:bg-amber-700'}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Pay Now
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            });
          })()}

          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome, {currentCustomerUser.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Building2 className="h-4 w-4" />
                {customer.businessName}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Main Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto gap-1">
              <TabsTrigger value="overview" className="text-xs px-2 py-2">
                <CheckCircle2 className="h-4 w-4 mr-1 hidden sm:inline" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs px-2 py-2">
                <DollarSign className="h-4 w-4 mr-1 hidden sm:inline" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="employees" className="text-xs px-2 py-2">
                <Users className="h-4 w-4 mr-1 hidden sm:inline" />
                Employees
              </TabsTrigger>
              <TabsTrigger value="machines" className="text-xs px-2 py-2">
                <WashingMachine className="h-4 w-4 mr-1 hidden sm:inline" />
                Machines
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs px-2 py-2">
                <Camera className="h-4 w-4 mr-1 hidden sm:inline" />
                Media
              </TabsTrigger>
              <TabsTrigger value="shipping" className="text-xs px-2 py-2">
                <Package className="h-4 w-4 mr-1 hidden sm:inline" />
                Shipping
              </TabsTrigger>
              <TabsTrigger value="pci" className="text-xs px-2 py-2">
                <Shield className="h-4 w-4 mr-1 hidden sm:inline" />
                PCI
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs px-2 py-2">
                <UserPlus className="h-4 w-4 mr-1 hidden sm:inline" />
                Portal Users
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-foreground">Onboarding Status</CardTitle>
                      <CardDescription>
                        Track your progress through the onboarding process
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[customer.status]}>
                      {customer.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium text-foreground">
                        {completedTaskIds.length} of {totalTasks} tasks complete
                      </span>
                    </div>
                    <Progress value={overallProgress} className="h-3" />
                    <p className="text-center text-lg font-semibold text-primary">
                      {overallProgress}% Complete
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stage Progress Bar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground">Onboarding Stages</CardTitle>
                  <CardDescription>
                    Track progress through each phase of your onboarding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StageProgressBar 
                    taskStatuses={taskStatuses} 
                    currentStageId={customer.currentStageId || 'contract_setup'} 
                  />
                </CardContent>
              </Card>

              {/* Detailed Stage Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Stage Details</CardTitle>
                  <CardDescription>
                    See detailed progress for each stage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StageProgress 
                    taskStatuses={taskStatuses} 
                    currentStageId={customer.currentStageId || 'contract_setup'}
                    showTasks={false}
                  />
                </CardContent>
              </Card>

              {/* Payment Processors */}
              {(customer.paymentProcessors || []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Merchant Account Applications
                    </CardTitle>
                    <CardDescription>
                      Complete your merchant application(s) to enable payment processing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(customer.paymentProcessors || []).map((processor) => (
                        <div key={processor.id} className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{processor.name}</p>
                              <p className="text-sm text-muted-foreground">Click to complete your merchant application</p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => window.open(processor.link, '_blank')}
                            className="gap-2"
                          >
                            Apply Now
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Please complete your merchant application as soon as possible. This is required before your system can go live.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Payment Links - Unpaid */}
              {(customer.paymentLinks || []).filter(l => l.isVisible && !l.isPaid).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Payment Options
                    </CardTitle>
                    <CardDescription>
                      Make payments for your order using the links below
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(customer.paymentLinks || []).filter(l => l.isVisible && !l.isPaid).map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {link.type === 'other' ? link.customLabel : PAYMENT_LINK_LABELS[link.type]}
                              </p>
                              {link.amount && (
                                <p className="text-sm text-muted-foreground">Amount Due: ${link.amount.toLocaleString()}</p>
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
                  </CardContent>
                </Card>
              )}

              {/* Completed Payments */}
              {(customer.paymentLinks || []).filter(l => l.isVisible && l.isPaid).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Completed Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(customer.paymentLinks || []).filter(l => l.isVisible && l.isPaid).map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
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
                  </CardContent>
                </Card>
              )}

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{currentCustomerUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Business Contact</p>
                      <p className="font-medium text-foreground">{customer.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Business Phone</p>
                      <p className="font-medium text-foreground">{customer.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium text-foreground">{new Date(customer.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Store Logo Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Store Logo
                  </CardTitle>
                  <CardDescription>
                    Your store logo displayed throughout the portal
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
                                    uploadedBy: currentCustomerUser.name,
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
                        Upload your store logo to personalize your portal.
                      </p>
                      <Button
                        variant="outline"
                        className="bg-transparent"
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
                                  uploadedBy: currentCustomerUser.name,
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

              {/* Store Photos & Videos Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Store Photos & Videos
                      </CardTitle>
                      <CardDescription>
                        Upload photos and videos of your laundromat
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*,video/*'
                        input.multiple = true
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files
                          if (files && files.length > 0) {
                            const newMedia = Array.from(files).map(file => {
                              const isVideo = file.type.startsWith('video/')
                              return {
                                id: crypto.randomUUID(),
                                type: isVideo ? 'video' as const : 'image' as const,
                                url: URL.createObjectURL(file),
                                name: file.name,
                                uploadedAt: new Date().toISOString(),
                                uploadedBy: currentCustomerUser.name,
                              }
                            })
                            updateCustomer(customer.id, {
                              storeMedia: [...(customer.storeMedia || []), ...newMedia]
                            })
                          }
                        }
                        input.click()
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
                            <div className="aspect-square relative bg-muted flex items-center justify-center">
                              <Video className="h-12 w-12 text-muted-foreground" />
                              <span className="absolute bottom-2 left-2 text-xs bg-background/80 px-2 py-1 rounded">
                                Video
                              </span>
                            </div>
                          )}
                          {/* Delete button overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
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
                        Upload photos and videos of your laundromat to help with the onboarding process.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PAYMENTS TAB */}
            <TabsContent value="payments" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payments Due
                  </CardTitle>
                  <CardDescription>Outstanding payments for your order</CardDescription>
                </CardHeader>
                <CardContent>
                  {(customer.paymentLinks || []).filter(l => l.isVisible && !l.isPaid).length > 0 ? (
                    <div className="space-y-3">
                      {(customer.paymentLinks || []).filter(l => l.isVisible && !l.isPaid).map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {link.type === 'other' ? link.customLabel : PAYMENT_LINK_LABELS[link.type]}
                              </p>
                              {link.amount && (
                                <p className="text-sm text-muted-foreground">Amount Due: ${link.amount.toLocaleString()}</p>
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
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">All Caught Up!</h3>
                      <p className="text-muted-foreground">No outstanding payments at this time.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Completed Payments */}
              {(customer.paymentLinks || []).filter(l => l.isVisible && l.isPaid).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Completed Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(customer.paymentLinks || []).filter(l => l.isVisible && l.isPaid).map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
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
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* EMPLOYEES TAB */}
            <TabsContent value="employees" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Employees
                    </CardTitle>
                    <CardDescription>Manage your store employees</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddEmployeeOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </CardHeader>
                <CardContent>
                  {(customer.employees || []).length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>PIN</TableHead>
                            <TableHead>Privilege Level</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(customer.employees || []).map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell className="font-medium">{employee.name}</TableCell>
                              <TableCell>{employee.phone}</TableCell>
                              <TableCell className="font-mono">{employee.pin}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">{employee.privilegeLevel}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setEditingEmployee(employee)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteEmployee(employee.id)}
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
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Employees Yet</h3>
                      <p className="text-muted-foreground mb-4">Add your first employee to get started.</p>
                      <Button onClick={() => setIsAddEmployeeOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Employee
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* MACHINES TAB */}
            <TabsContent value="machines" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <WashingMachine className="h-5 w-5" />
                      Machine Inventory
                    </CardTitle>
                    <CardDescription>Washers: 1-99 | Dryers: 100-199</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddMachineOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Machine
                  </Button>
                </CardHeader>
                <CardContent>
                  {(customer.machines || []).length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">#</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Make</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Serial Number</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...(customer.machines || [])]
                            .sort((a, b) => a.machineNumber - b.machineNumber)
                            .map((machine) => (
                              <TableRow key={machine.id}>
                                <TableCell className="font-bold text-primary">{machine.machineNumber}</TableCell>
                                <TableCell>
                                  <Badge variant={machine.type === 'washer' ? 'default' : 'secondary'} className="capitalize">
                                    {machine.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{machine.make}</TableCell>
                                <TableCell>{machine.model}</TableCell>
                                <TableCell className="font-mono">{machine.serialNumber}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setEditingMachine(machine)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteMachine(machine.id)}
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
                    <div className="text-center py-12">
                      <WashingMachine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Machines Yet</h3>
                      <p className="text-muted-foreground mb-4">Add your first machine to get started.</p>
                      <Button onClick={() => setIsAddMachineOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Machine
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="media" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Store Photos & Videos
                    </CardTitle>
                    <CardDescription>Upload photos and videos of your laundromat</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,video/*,.mov,.mp4';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) handleMediaUpload(files);
                      };
                      input.click();
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Media
                  </Button>
                </CardHeader>
                <CardContent>
                  {(customer.storeMedia || []).length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {(customer.storeMedia || []).map((media) => (
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
                                preload="metadata"
                              />
                              <span className="absolute top-2 left-2 text-xs bg-background/80 px-2 py-1 rounded flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                Video
                              </span>
                            </div>
                          )}
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
                              onClick={() => saveToDatabase({ storeMedia: (customer.storeMedia || []).filter(m => m.id !== media.id) })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="p-2 bg-background">
                            <p className="text-sm font-medium truncate">{media.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(media.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Media Yet</h3>
                      <p className="text-muted-foreground">Upload photos and videos of your laundromat.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Store Logo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Store Logo
                  </CardTitle>
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
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No logo uploaded yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SHIPPING TAB */}
            <TabsContent value="shipping" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Shipping Information
                    </CardTitle>
                    <CardDescription>Where should we ship your equipment?</CardDescription>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShippingForm(customer.shippingInfo || {});
                      setIsEditShippingOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent>
                  {customer.shippingInfo ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{customer.shippingInfo.address || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">City, State, ZIP</p>
                        <p className="font-medium">
                          {customer.shippingInfo.city && `${customer.shippingInfo.city}, `}
                          {customer.shippingInfo.state} {customer.shippingInfo.zipCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Shipment Method</p>
                        <p className="font-medium capitalize">{customer.shippingInfo.shipmentMethod?.replace('_', ' ') || '-'}</p>
                      </div>
                      {customer.shippingInfo.notes && (
                        <div className="sm:col-span-2">
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="font-medium">{customer.shippingInfo.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Shipping Info</h3>
                      <p className="text-muted-foreground mb-4">Add your shipping information.</p>
                      <Button onClick={() => { setShippingForm({}); setIsEditShippingOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Shipping Info
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PCI TAB */}
            <TabsContent value="pci" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      PCI Compliance
                    </CardTitle>
                    <CardDescription>Payment Card Industry compliance certification</CardDescription>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setPciForm(customer.pciCompliance || {});
                      setIsEditPCIOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent>
                  {customer.pciCompliance?.hasConsented ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">PCI Compliance Certified</span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Representative Name</p>
                          <p className="font-medium">{customer.pciCompliance.representativeName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Company</p>
                          <p className="font-medium">{customer.pciCompliance.companyName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Title</p>
                          <p className="font-medium">{customer.pciCompliance.title}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Consent Date</p>
                          <p className="font-medium">{new Date(customer.pciCompliance.consentDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Not Yet Certified</h3>
                      <p className="text-muted-foreground mb-4">Complete your PCI compliance certification.</p>
                      <Button onClick={() => { setPciForm({}); setIsEditPCIOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Complete Certification
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PORTAL USERS TAB */}
            <TabsContent value="users" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Portal Users
                    </CardTitle>
                    <CardDescription>Manage who can access this customer portal</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddUserOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </CardHeader>
                <CardContent>
                  {portalUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {portalUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">{user.role}</Badge>
                              </TableCell>
                              <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeletePortalUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Portal Users</h3>
                      <p className="text-muted-foreground mb-4">Add users who can access this portal.</p>
                      <Button onClick={() => setIsAddUserOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* DIALOGS */}

      {/* Add Employee Dialog */}
      <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Add a new employee to your store.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input 
                value={newEmployee.name || ''} 
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="Employee name"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                value={newEmployee.phone || ''} 
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label>PIN</Label>
              <Input 
                value={newEmployee.pin || ''} 
                onChange={(e) => setNewEmployee({ ...newEmployee, pin: e.target.value })}
                placeholder="4-digit PIN"
                maxLength={4}
              />
            </div>
            <div>
              <Label>Privilege Level</Label>
              <Select 
                value={newEmployee.privilegeLevel || 'employee'} 
                onValueChange={(v) => setNewEmployee({ ...newEmployee, privilegeLevel: v as 'admin' | 'attendant' | 'employee' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="attendant">Attendant</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEmployee} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input 
                  value={editingEmployee.name} 
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={editingEmployee.phone} 
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>PIN</Label>
                <Input 
                  value={editingEmployee.pin} 
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, pin: e.target.value })}
                  maxLength={4}
                />
              </div>
              <div>
                <Label>Privilege Level</Label>
                <Select 
                  value={editingEmployee.privilegeLevel} 
                  onValueChange={(v) => setEditingEmployee({ ...editingEmployee, privilegeLevel: v as 'admin' | 'attendant' | 'employee' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="attendant">Attendant</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEmployee(null)}>Cancel</Button>
            <Button onClick={handleUpdateEmployee} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Machine Dialog */}
      <Dialog open={isAddMachineOpen} onOpenChange={setIsAddMachineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Machine</DialogTitle>
            <DialogDescription>Add a new machine to your inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select 
                value={newMachine.type || 'washer'} 
                onValueChange={(v) => setNewMachine({ ...newMachine, type: v as 'washer' | 'dryer' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="washer">Washer (1-99)</SelectItem>
                  <SelectItem value="dryer">Dryer (100-199)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Make/Brand</Label>
              <Input 
                value={newMachine.make || ''} 
                onChange={(e) => setNewMachine({ ...newMachine, make: e.target.value })}
                placeholder="e.g., Speed Queen"
              />
            </div>
            <div>
              <Label>Model</Label>
              <Input 
                value={newMachine.model || ''} 
                onChange={(e) => setNewMachine({ ...newMachine, model: e.target.value })}
                placeholder="Model number"
              />
            </div>
            <div>
              <Label>Serial Number</Label>
              <Input 
                value={newMachine.serialNumber || ''} 
                onChange={(e) => setNewMachine({ ...newMachine, serialNumber: e.target.value })}
                placeholder="Serial number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMachineOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMachine} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Add Machine'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Machine Dialog */}
      <Dialog open={!!editingMachine} onOpenChange={(open) => !open && setEditingMachine(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Machine #{editingMachine?.machineNumber}</DialogTitle>
          </DialogHeader>
          {editingMachine && (
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select 
                  value={editingMachine.type} 
                  onValueChange={(v) => setEditingMachine({ ...editingMachine, type: v as 'washer' | 'dryer' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="washer">Washer</SelectItem>
                    <SelectItem value="dryer">Dryer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Make/Brand</Label>
                <Input 
                  value={editingMachine.make} 
                  onChange={(e) => setEditingMachine({ ...editingMachine, make: e.target.value })}
                />
              </div>
              <div>
                <Label>Model</Label>
                <Input 
                  value={editingMachine.model} 
                  onChange={(e) => setEditingMachine({ ...editingMachine, model: e.target.value })}
                />
              </div>
              <div>
                <Label>Serial Number</Label>
                <Input 
                  value={editingMachine.serialNumber} 
                  onChange={(e) => setEditingMachine({ ...editingMachine, serialNumber: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMachine(null)}>Cancel</Button>
            <Button onClick={handleUpdateMachine} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shipping Dialog */}
      <Dialog open={isEditShippingOpen} onOpenChange={setIsEditShippingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shipping Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Address</Label>
              <Input 
                value={shippingForm.address || ''} 
                onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input 
                  value={shippingForm.city || ''} 
                  onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input 
                  value={shippingForm.state || ''} 
                  onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>ZIP Code</Label>
              <Input 
                value={shippingForm.zipCode || ''} 
                onChange={(e) => setShippingForm({ ...shippingForm, zipCode: e.target.value })}
              />
            </div>
            <div>
              <Label>Shipment Method</Label>
              <Select 
                value={shippingForm.shipmentMethod || ''} 
                onValueChange={(v) => setShippingForm({ ...shippingForm, shipmentMethod: v as ShippingInfo['shipmentMethod'] })}
              >
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ltl_freight">LTL Freight</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea 
                value={shippingForm.notes || ''} 
                onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}
                placeholder="Any special instructions"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditShippingOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveShipping} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PCI Dialog */}
      <Dialog open={isEditPCIOpen} onOpenChange={setIsEditPCIOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PCI Compliance Certification</DialogTitle>
            <DialogDescription>
              Complete the form below to certify PCI compliance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Representative Name</Label>
              <Input 
                value={pciForm.representativeName || ''} 
                onChange={(e) => setPciForm({ ...pciForm, representativeName: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label>Company Name</Label>
              <Input 
                value={pciForm.companyName || ''} 
                onChange={(e) => setPciForm({ ...pciForm, companyName: e.target.value })}
                placeholder="Your company name"
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input 
                value={pciForm.title || ''} 
                onChange={(e) => setPciForm({ ...pciForm, title: e.target.value })}
                placeholder="Your title"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="pci-consent"
                checked={pciForm.hasConsented || false}
                onCheckedChange={(checked) => setPciForm({ 
                  ...pciForm, 
                  hasConsented: !!checked,
                  consentDate: checked ? new Date().toISOString() : undefined
                })}
              />
              <Label htmlFor="pci-consent" className="text-sm">
                I certify that our business complies with PCI DSS requirements
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPCIOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePCI} disabled={isSaving || !pciForm.hasConsented}>
              {isSaving ? 'Saving...' : 'Save Certification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Portal User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Portal User</DialogTitle>
            <DialogDescription>Add a new user who can access this customer portal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input 
                value={newPortalUser.name} 
                onChange={(e) => setNewPortalUser({ ...newPortalUser, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input 
                value={newPortalUser.username} 
                onChange={(e) => setNewPortalUser({ ...newPortalUser, username: e.target.value })}
                placeholder="Username for login"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input 
                type="password"
                value={newPortalUser.password} 
                onChange={(e) => setNewPortalUser({ ...newPortalUser, password: e.target.value })}
                placeholder="Password"
              />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input 
                type="email"
                value={newPortalUser.email} 
                onChange={(e) => setNewPortalUser({ ...newPortalUser, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPortalUser} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
