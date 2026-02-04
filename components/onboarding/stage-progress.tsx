"use client"

import { ONBOARDING_STAGES, calculateProgress, getStageById } from "@/lib/onboarding-config"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskStatus } from "@/lib/types"

interface StageProgressProps {
  taskStatuses: Record<string, TaskStatus>
  currentStageId: string
  showTasks?: boolean
  compact?: boolean
}

export function StageProgress({ taskStatuses, currentStageId, showTasks = false, compact = false }: StageProgressProps) {
  // Calculate completed tasks
  const completedTaskIds = Object.entries(taskStatuses || {})
    .filter(([_, status]) => status === 'complete')
    .map(([taskId]) => taskId)
  
  const overallProgress = calculateProgress(completedTaskIds)
  const totalTasks = ONBOARDING_STAGES.reduce((sum, stage) => sum + stage.tasks.length, 0)
  
  // Get stage status
  const getStageStatus = (stageId: string): 'complete' | 'in_progress' | 'not_started' => {
    const stage = getStageById(stageId)
    if (!stage) return 'not_started'
    
    const stageTasks = stage.tasks.map(t => t.id)
    const completedInStage = stageTasks.filter(taskId => completedTaskIds.includes(taskId)).length
    
    if (completedInStage === stageTasks.length) return 'complete'
    if (completedInStage > 0) return 'in_progress'
    
    // Check if previous stages are complete
    const stageIndex = ONBOARDING_STAGES.findIndex(s => s.id === stageId)
    if (stageIndex > 0) {
      const prevStage = ONBOARDING_STAGES[stageIndex - 1]
      const prevStatus = getStageStatus(prevStage.id)
      if (prevStatus === 'complete') return 'not_started'
    }
    
    return 'not_started'
  }

  // Find current stage index
  const currentStageIndex = ONBOARDING_STAGES.findIndex(s => s.id === currentStageId)

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium text-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="text-xs">
            {getStageById(currentStageId)?.name || 'Not Started'}
          </Badge>
          <span className="text-muted-foreground">
            {completedTaskIds.length} / {totalTasks} tasks
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium text-foreground">{overallProgress}% ({completedTaskIds.length}/{totalTasks} tasks)</span>
        </div>
        <Progress value={overallProgress} className="h-3" />
      </div>

      {/* Stage Progress Indicators */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-border" />
        
        <div className="space-y-1">
          {ONBOARDING_STAGES.map((stage, index) => {
            const stageStatus = getStageStatus(stage.id)
            const stageTasks = stage.tasks.map(t => t.id)
            const completedInStage = stageTasks.filter(taskId => completedTaskIds.includes(taskId)).length
            const stageProgress = Math.round((completedInStage / stageTasks.length) * 100)
            const isCurrentStage = stage.id === currentStageId
            
            return (
              <div key={stage.id} className="relative">
                <div className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  isCurrentStage && "bg-lb-cyan/10"
                )}>
                  {/* Status Icon */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2",
                    stageStatus === 'complete' && "bg-green-500 border-green-500 text-white",
                    stageStatus === 'in_progress' && "bg-lb-blue border-lb-blue text-white",
                    stageStatus === 'not_started' && "bg-background border-muted-foreground/30"
                  )}>
                    {stageStatus === 'complete' && <CheckCircle2 className="h-4 w-4" />}
                    {stageStatus === 'in_progress' && <Loader2 className="h-3 w-3 animate-spin" />}
                    {stageStatus === 'not_started' && <Circle className="h-3 w-3 text-muted-foreground/50" />}
                  </div>
                  
                  {/* Stage Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "font-medium text-sm",
                        stageStatus === 'complete' && "text-green-600 dark:text-green-400",
                        stageStatus === 'in_progress' && "text-lb-blue",
                        stageStatus === 'not_started' && "text-muted-foreground"
                      )}>
                        {stage.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {completedInStage}/{stageTasks.length}
                      </span>
                    </div>
                    {stageStatus === 'in_progress' && (
                      <Progress value={stageProgress} className="h-1 mt-1" />
                    )}
                  </div>
                </div>
                
                {/* Expanded Tasks View */}
                {showTasks && isCurrentStage && (
                  <div className="ml-9 mt-2 space-y-1 pb-2">
                    {stage.tasks.map(task => {
                      const taskStatus = taskStatuses?.[task.id] || 'not_started'
                      return (
                        <div key={task.id} className="flex items-center gap-2 text-xs">
                          {taskStatus === 'complete' && (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          )}
                          {taskStatus === 'in_progress' && (
                            <Loader2 className="h-3 w-3 text-lb-blue animate-spin" />
                          )}
                          {taskStatus === 'not_started' && (
                            <Circle className="h-3 w-3 text-muted-foreground/40" />
                          )}
                          <span className={cn(
                            taskStatus === 'complete' && "text-muted-foreground line-through",
                            taskStatus === 'in_progress' && "text-foreground font-medium",
                            taskStatus === 'not_started' && "text-muted-foreground"
                          )}>
                            {task.name}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Horizontal compact version for headers - beautified and centered
export function StageProgressBar({ taskStatuses, currentStageId }: { taskStatuses: Record<string, TaskStatus>, currentStageId: string }) {
  const completedTaskIds = Object.entries(taskStatuses || {})
    .filter(([_, status]) => status === 'complete')
    .map(([taskId]) => taskId)
  
  const overallProgress = calculateProgress(completedTaskIds)
  const totalTasks = ONBOARDING_STAGES.reduce((sum, stage) => sum + stage.tasks.length, 0)
  
  const getStageStatus = (stageId: string): 'complete' | 'in_progress' | 'not_started' => {
    const stage = getStageById(stageId)
    if (!stage) return 'not_started'
    
    const stageTasks = stage.tasks.map(t => t.id)
    const completedInStage = stageTasks.filter(taskId => completedTaskIds.includes(taskId)).length
    
    if (completedInStage === stageTasks.length) return 'complete'
    if (completedInStage > 0) return 'in_progress'
    return 'not_started'
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress Summary */}
      <div className="text-center space-y-2">
        <div className="text-3xl font-bold text-foreground">{overallProgress}%</div>
        <div className="text-sm text-muted-foreground">{completedTaskIds.length} of {totalTasks} tasks complete</div>
        <Progress value={overallProgress} className="h-2 max-w-md mx-auto" />
      </div>
      
      {/* Stage Timeline - Centered */}
      <div className="flex items-center justify-center gap-1 overflow-x-auto py-4 px-2">
        {ONBOARDING_STAGES.map((stage, index) => {
          const status = getStageStatus(stage.id)
          const isCurrentStage = stage.id === currentStageId
          const stageTasks = stage.tasks.map(t => t.id)
          const completedInStage = stageTasks.filter(taskId => completedTaskIds.includes(taskId)).length
          
          return (
            <div key={stage.id} className="flex items-center">
              <div className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                status === 'complete' && "bg-green-50 dark:bg-green-950/30",
                status === 'in_progress' && "bg-lb-cyan/10",
                status === 'not_started' && "bg-muted/50",
                isCurrentStage && "ring-2 ring-lb-blue ring-offset-2 ring-offset-background shadow-md scale-105"
              )}>
                {/* Status Icon */}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  status === 'complete' && "bg-green-500 border-green-500 text-white",
                  status === 'in_progress' && "bg-lb-blue border-lb-blue text-white",
                  status === 'not_started' && "bg-background border-muted-foreground/30 text-muted-foreground"
                )}>
                  {status === 'complete' && <CheckCircle2 className="h-5 w-5" />}
                  {status === 'in_progress' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {status === 'not_started' && <Circle className="h-4 w-4" />}
                </div>
                
                {/* Stage Name */}
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  status === 'complete' && "text-green-700 dark:text-green-400",
                  status === 'in_progress' && "text-lb-blue",
                  status === 'not_started' && "text-muted-foreground"
                )}>
                  {stage.shortName}
                </span>
                
                {/* Task Count */}
                <span className="text-[10px] text-muted-foreground">
                  {completedInStage}/{stageTasks.length}
                </span>
              </div>
              
              {/* Connector Line */}
              {index < ONBOARDING_STAGES.length - 1 && (
                <div className={cn(
                  "w-6 h-1 mx-1 rounded-full transition-colors",
                  status === 'complete' ? "bg-green-500" : "bg-border"
                )} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
