"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAdminStore, useOnboardingStore } from "@/lib/store";
import type { Customer } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Building2,
  WashingMachine,
  Users,
  FileText,
  Truck,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { StageProgress, StageProgressBar } from "@/components/onboarding/stage-progress";
import { getDefaultTaskStatuses, ONBOARDING_STAGES, calculateProgress } from "@/lib/onboarding-config";
import { getCustomerByEmail } from "@/lib/supabase/customers";

const statusColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
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

const statusIcons = {
  pending: Clock,
  "in-progress": AlertCircle,
  completed: CheckCircle2,
};

const Loading = () => null;

export default function PortalPage() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const { customers } = useAdminStore();
  const { submissions } = useOnboardingStore();
  const [searchEmail, setSearchEmail] = useState(emailParam || "");
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [foundSubmission, setFoundSubmission] = useState<typeof submissions[0] | null>(null);
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // First try Supabase
      const supabaseCustomer = await getCustomerByEmail(searchEmail);
      
      if (supabaseCustomer) {
        setFoundCustomer(supabaseCustomer);
        setFoundSubmission(null);
        setSearched(true);
        return;
      }
      
      // Fall back to local store
      const localCustomer = customers.find(
        (c) => c.email.toLowerCase() === searchEmail.toLowerCase()
      );
      const foundSubmission = submissions.find(
        (s) => s.generalInfo.email.toLowerCase() === searchEmail.toLowerCase()
      );
      setFoundCustomer(localCustomer || null);
      setFoundSubmission(foundSubmission || null);
      setSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const completedTasks = foundSubmission?.projectTasks.filter(
    (t) => t.status === "completed"
  ).length || 0;
  const totalTasks = foundSubmission?.projectTasks.length || 0;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Customer Portal</h1>
            <p className="mt-2 text-muted-foreground">
              Track your onboarding progress and view your project status
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Find Your Onboarding Status</CardTitle>
              <CardDescription>
                Enter the email address you used during registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Label htmlFor="email" className="sr-only">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  {isSearching ? "Searching..." : "Look Up Status"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {searched && !foundSubmission && !foundCustomer && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-foreground">No Record Found</h3>
                    <p className="text-sm text-muted-foreground">
                      We couldn&apos;t find an onboarding record with that email address.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/onboarding">
                      Start Onboarding
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {foundCustomer && !foundSubmission && (() => {
            const taskStatuses = foundCustomer.taskStatuses || getDefaultTaskStatuses();
            const completedTaskIds = Object.entries(taskStatuses)
              .filter(([_, status]) => status === 'complete')
              .map(([taskId]) => taskId);
            const overallProgress = calculateProgress(completedTaskIds);
            const totalTasks = ONBOARDING_STAGES.reduce((sum, s) => sum + s.tasks.length, 0);
            
            return (
            <div className="space-y-6">
              {/* Installation Date Banner - Prominent at top */}
              {foundCustomer.installationDate && (
                <Card className="border-2 border-primary bg-primary/5">
                  <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Estimated Installation Date</p>
                        <p className="text-2xl font-bold text-primary">
                          {new Date(foundCustomer.installationDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-sm px-4 py-1">
                      {Math.ceil((new Date(foundCustomer.installationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days away
                    </Badge>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-foreground">
                        {foundCustomer.businessName}
                      </CardTitle>
                      <CardDescription>
                        Created {new Date(foundCustomer.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[foundCustomer.status]}>
                      {foundCustomer.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
                    currentStageId={foundCustomer.currentStageId || 'contract_setup'} 
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
                    currentStageId={foundCustomer.currentStageId || 'contract_setup'}
                    showTasks={false}
                  />
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Owner:</span> {foundCustomer.ownerName}</p>
                    <p><span className="text-muted-foreground">Email:</span> {foundCustomer.email}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {foundCustomer.phone}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">Project Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Contract Signed:</span> {foundCustomer.contractSigned ? "Yes" : "No"}</p>
                    {foundCustomer.installationDate && (
                      <p><span className="text-muted-foreground">Installation Date:</span> {new Date(foundCustomer.installationDate).toLocaleDateString()}</p>
                    )}
                    {foundCustomer.goLiveDate && (
                      <p><span className="text-muted-foreground">Go Live Date:</span> {new Date(foundCustomer.goLiveDate).toLocaleDateString()}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
          })()}

          {foundSubmission && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-foreground">
                        {foundSubmission.generalInfo.companyName}
                      </CardTitle>
                      <CardDescription>
                        Submitted {new Date(foundSubmission.submittedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[foundSubmission.status]}>
                      {foundSubmission.status.charAt(0).toUpperCase() +
                        foundSubmission.status.slice(1).replace("-", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium text-foreground">
                        {completedTasks} of {totalTasks} tasks completed
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                    <p className="text-center text-lg font-semibold text-primary">
                      {Math.round(progressPercentage)}% Complete
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium text-foreground">
                        {foundSubmission.locationInfo.locationName || "Configured"}
                      </p>
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
                      <p className="font-medium text-foreground">
                        {foundSubmission.machineInventory.machines.length} registered
                      </p>
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
                      <p className="font-medium text-foreground">
                        {foundSubmission.employeeSetup.employees.length} added
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PCI Compliance</p>
                      <p className="font-medium text-foreground">
                        {foundSubmission.pciCompliance.consentGiven ? "Signed" : "Pending"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="tasks" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tasks">Project Tasks</TabsTrigger>
                  <TabsTrigger value="details">Submission Details</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-foreground">Task Progress</CardTitle>
                      <CardDescription>
                        Track the progress of your onboarding tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {foundSubmission.projectTasks.map((task) => {
                          const Icon = statusIcons[task.status];
                          return (
                            <div
                              key={task.id}
                              className="flex items-center justify-between rounded-lg border p-4"
                            >
                              <div className="flex items-center gap-3">
                                <Icon
                                  className={`h-5 w-5 ${
                                    task.status === "completed"
                                      ? "text-green-600"
                                      : task.status === "in-progress"
                                      ? "text-blue-600"
                                      : "text-yellow-600"
                                  }`}
                                />
                                <div>
                                  <p className="font-medium text-foreground">{task.name}</p>
                                  {task.dueDate && (
                                    <p className="text-sm text-muted-foreground">
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge className={statusColors[task.status]}>
                                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="details">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-foreground">Submission Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="mb-2 font-medium text-foreground">Contact Information</h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="text-muted-foreground">Name: </span>
                              {foundSubmission.generalInfo.primaryContactName}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Email: </span>
                              {foundSubmission.generalInfo.email}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Phone: </span>
                              {foundSubmission.generalInfo.phone}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 font-medium text-foreground">Location</h4>
                          <div className="space-y-1 text-sm">
                            <p>{foundSubmission.locationInfo.streetAddress}</p>
                            <p>
                              {foundSubmission.locationInfo.city},{" "}
                              {foundSubmission.locationInfo.state}{" "}
                              {foundSubmission.locationInfo.zipCode}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-2 font-medium text-foreground">
                          Shipping Information
                        </h4>
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {foundSubmission.shippingDetails.deliveryMethod || "Standard"} delivery
                            {foundSubmission.shippingDetails.preferredDeliveryDate &&
                              ` - Preferred date: ${new Date(
                                foundSubmission.shippingDetails.preferredDeliveryDate
                              ).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                    <div className="rounded-full bg-primary/10 p-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Need to update your information?</h3>
                      <p className="text-sm text-muted-foreground">
                        Contact our support team to make changes to your onboarding submission.
                      </p>
                    </div>
                    <Button variant="outline">
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!searched && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Enter your email to get started</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the search above to find your onboarding status
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export { Loading };
