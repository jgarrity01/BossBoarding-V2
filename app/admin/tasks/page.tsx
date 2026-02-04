"use client";

import { useState } from "react";
import { useAdminStore, useUserStore } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Save,
} from "lucide-react";
import Link from "next/link";
import { ONBOARDING_STAGES, getDefaultTaskStatuses, calculateProgress } from "@/lib/onboarding-config";
import { StageProgressBar } from "@/components/onboarding/stage-progress";

const statusColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusIcons: Record<string, typeof Clock> = {
  not_started: CircleDashed,
  in_progress: Clock,
  complete: CheckCircle2,
};

export default function TasksPage() {
  const { customers, updateTaskStatus, updateStageTasksStatus } = useAdminStore();
  const { currentAdminUser } = useUserStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set(customers.map(c => c.id)));
  const [pendingChanges, setPendingChanges] = useState<Map<string, TaskStatus>>(new Map());

  // Total tasks count
  const totalTaskCount = ONBOARDING_STAGES.reduce((sum, s) => sum + s.tasks.length, 0);

  // Get all tasks across all customers
  const getAllTaskStats = () => {
    let notStarted = 0;
    let inProgress = 0;
    let complete = 0;

    customers.forEach(customer => {
      const taskStatuses = customer.taskStatuses || getDefaultTaskStatuses();
      ONBOARDING_STAGES.forEach(stage => {
        stage.tasks.forEach(task => {
          const status = taskStatuses[task.id] || 'not_started';
          if (status === 'not_started') notStarted++;
          else if (status === 'in_progress') inProgress++;
          else if (status === 'complete') complete++;
        });
      });
    });

    return { not_started: notStarted, in_progress: inProgress, complete };
  };

  const taskStats = getAllTaskStats();

  // Filter customers based on task status
  const filteredCustomers = customers.filter(customer => {
    const taskStatuses = customer.taskStatuses || getDefaultTaskStatuses();
    
    // Filter by status
    if (statusFilter !== "all") {
      const hasMatchingTask = ONBOARDING_STAGES.some(stage => 
        stage.tasks.some(task => taskStatuses[task.id] === statusFilter)
      );
      if (!hasMatchingTask) return false;
    }
    
    // Filter by stage
    if (stageFilter !== "all") {
      const stage = ONBOARDING_STAGES.find(s => s.id === stageFilter);
      if (stage) {
        const hasTaskInStage = stage.tasks.some(task => {
          const status = taskStatuses[task.id] || 'not_started';
          return statusFilter === "all" || status === statusFilter;
        });
        if (!hasTaskInStage) return false;
      }
    }
    
    return true;
  });

  const toggleCustomerExpanded = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const handleTaskStatusChange = (
    customerId: string,
    taskId: string,
    newStatus: TaskStatus
  ) => {
    const key = `${customerId}-${taskId}`;
    const newPending = new Map(pendingChanges);
    newPending.set(key, newStatus);
    setPendingChanges(newPending);
  };

  const saveChanges = () => {
    pendingChanges.forEach((status, key) => {
      const [customerId, taskId] = key.split('-');
      updateTaskStatus(customerId, taskId, status, currentAdminUser?.name);
    });
    setPendingChanges(new Map());
  };

  const getEffectiveStatus = (customerId: string, taskId: string, currentStatus: TaskStatus): TaskStatus => {
    const key = `${customerId}-${taskId}`;
    return pendingChanges.get(key) || currentStatus;
  };

  const getCustomerProgress = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    const taskStatuses = customer?.taskStatuses || getDefaultTaskStatuses();
    
    let completed = 0;
    ONBOARDING_STAGES.forEach(stage => {
      stage.tasks.forEach(task => {
        const effective = getEffectiveStatus(customerId, task.id, taskStatuses[task.id] || 'not_started');
        if (effective === "complete") completed++;
      });
    });
    
    return {
      completed,
      total: totalTaskCount,
      percentage: Math.round((completed / totalTaskCount) * 100)
    };
  };

  const expandAll = () => setExpandedCustomers(new Set(customers.map(c => c.id)));
  const collapseAll = () => setExpandedCustomers(new Set());

  // Get stages to show based on filter
  const getFilteredStages = () => {
    if (stageFilter === "all") return ONBOARDING_STAGES;
    return ONBOARDING_STAGES.filter(s => s.id === stageFilter);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Tasks</h1>
          <p className="text-muted-foreground">
            Manage all {totalTaskCount} onboarding tasks across {ONBOARDING_STAGES.length} stages
          </p>
        </div>
        {pendingChanges.size > 0 && (
          <Button onClick={saveChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes ({pendingChanges.size})
          </Button>
        )}
      </div>

      {/* Task Status Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'not_started' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'not_started' ? 'all' : 'not_started')}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
              <CircleDashed className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{taskStats.not_started}</p>
              <p className="text-sm text-muted-foreground">Not Started</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'in_progress' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{taskStats.in_progress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'complete' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'complete' ? 'all' : 'complete')}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{taskStats.complete}</p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Tasks */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-foreground">Tasks by Customer</CardTitle>
              <CardDescription>{filteredCustomers.length} customers shown</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {ONBOARDING_STAGES.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.shortName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length > 0 ? (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => {
                const progress = getCustomerProgress(customer.id);
                const isExpanded = expandedCustomers.has(customer.id);
                const taskStatuses = customer.taskStatuses || getDefaultTaskStatuses();
                const filteredStages = getFilteredStages();

                return (
                  <Collapsible 
                    key={customer.id} 
                    open={isExpanded}
                    onOpenChange={() => toggleCustomerExpanded(customer.id)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-foreground">{customer.businessName}</p>
                              <p className="text-sm text-muted-foreground">{customer.ownerName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-medium text-foreground">
                                {progress.completed}/{progress.total} complete
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {progress.percentage}% done
                              </p>
                            </div>
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className="h-full bg-primary transition-all"
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t bg-muted/20">
                          {/* Stage Progress Bar */}
                          <div className="p-3 border-b">
                            <StageProgressBar 
                              taskStatuses={taskStatuses} 
                              currentStageId={customer.currentStageId || 'contract_setup'} 
                            />
                          </div>
                          
                          {/* Tasks by Stage */}
                          {filteredStages.map(stage => {
                            const stageTasks = stage.tasks.filter(task => {
                              if (statusFilter === "all") return true;
                              const status = taskStatuses[task.id] || 'not_started';
                              return status === statusFilter;
                            });
                            
                            if (stageTasks.length === 0) return null;
                            
                            const stageCompleted = stage.tasks.filter(t => 
                              (taskStatuses[t.id] || 'not_started') === 'complete'
                            ).length;
                            const stageTotal = stage.tasks.length;
                            const isStageComplete = stageCompleted === stageTotal;
                            
                            return (
                              <div key={stage.id} className="border-b last:border-b-0">
                                <div className={`px-4 py-2 flex items-center justify-between ${isStageComplete ? 'bg-green-50 dark:bg-green-900/10' : 'bg-muted/30'}`}>
                                  <div className="flex items-center gap-2">
                                    {isStageComplete ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <span className="h-4 w-4" />
                                    )}
                                    <span className={`text-sm font-semibold ${isStageComplete ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}>
                                      {stage.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {stageCompleted}/{stageTotal}
                                    </Badge>
                                    <Select
                                      value=""
                                      onValueChange={(value: TaskStatus) => {
                                        updateStageTasksStatus(customer.id, stage.id, value, currentAdminUser?.name)
                                      }}
                                    >
                                      <SelectTrigger className="h-7 w-28 text-xs">
                                        <SelectValue placeholder="Set All..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="not_started">All Not Started</SelectItem>
                                        <SelectItem value="in_progress">All In Progress</SelectItem>
                                        <SelectItem value="complete">All Complete</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                {stageTasks.map((task) => {
                                  const currentStatus = taskStatuses[task.id] || 'not_started';
                                  const effectiveStatus = getEffectiveStatus(customer.id, task.id, currentStatus);
                                  const Icon = statusIcons[effectiveStatus] || CircleDashed;
                                  const hasChange = pendingChanges.has(`${customer.id}-${task.id}`);
                                  
                                  return (
                                    <div
                                      key={task.id}
                                      className={`flex items-center justify-between px-4 py-2 border-b last:border-b-0 ${hasChange ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Icon
                                          className={`h-4 w-4 shrink-0 ${
                                            effectiveStatus === "complete"
                                              ? "text-green-600"
                                              : effectiveStatus === "in_progress"
                                              ? "text-blue-600"
                                              : "text-gray-400"
                                          }`}
                                        />
                                                    <div className="min-w-0">
                                                          <p className={`text-sm truncate ${effectiveStatus === 'complete' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                                            {task.name}
                                                          </p>
                                                          <p className="text-xs text-muted-foreground">
                                                            {(customer.taskMetadata || {})[task.id] 
                                                              ? `Updated by ${(customer.taskMetadata || {})[task.id].updatedBy} on ${new Date((customer.taskMetadata || {})[task.id].updatedAt).toLocaleDateString()}`
                                                              : `Team: ${task.team.join(', ')}`
                                                            }
                                                          </p>
                                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <Badge className={statusColors[effectiveStatus]}>
                                          {effectiveStatus.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </Badge>
                                        <Select
                                          value={effectiveStatus}
                                          onValueChange={(value: TaskStatus) =>
                                            handleTaskStatusChange(customer.id, task.id, value)
                                          }
                                        >
                                          <SelectTrigger className="w-[130px]">
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
                                  );
                                })}
                              </div>
                            );
                          })}
                          <div className="p-3 border-t bg-muted/30">
                            <Link 
                              href={`/admin/customers/${customer.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              View full customer details
                            </Link>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No customers found</p>
              {customers.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Customers will appear here once they are added
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
