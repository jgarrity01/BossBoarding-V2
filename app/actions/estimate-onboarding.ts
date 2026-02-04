'use server';

import { generateObject } from 'ai';
import { z } from 'zod';

const estimationSchema = z.object({
  estimatedDaysRemaining: z.number().describe('Estimated number of days until onboarding completion'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level of the estimate'),
  reasoning: z.string().describe('Brief explanation of the estimate'),
  riskFactors: z.array(z.string()).optional().describe('Any identified risk factors that could delay completion'),
});

export interface TaskProgress {
  stageName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
}

export interface OnboardingContext {
  customerId: string;
  customerName: string;
  startDate: string;
  currentProgress: number; // percentage
  daysElapsed: number;
  stageProgress: TaskProgress[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
}

export async function estimateOnboardingCompletion(context: OnboardingContext) {
  const prompt = `You are an AI assistant helping to estimate onboarding completion dates for a laundry equipment business.

Based on the following customer onboarding data, estimate when the onboarding will be complete:

Customer: ${context.customerName}
Start Date: ${new Date(context.startDate).toLocaleDateString()}
Days Elapsed: ${context.daysElapsed}
Overall Progress: ${context.currentProgress}%
Total Tasks: ${context.totalTasks}
Completed Tasks: ${context.completedTasks}
In Progress Tasks: ${context.inProgressTasks}

Stage-by-Stage Progress:
${context.stageProgress.map(s => `- ${s.stageName}: ${s.completedTasks}/${s.totalTasks} tasks complete`).join('\n')}

The standard onboarding takes 4 weeks (28 days). Consider:
1. Current velocity (tasks completed per day)
2. How much progress has been made relative to time elapsed
3. Whether any stages are blocked or behind schedule
4. Industry typical timelines for equipment onboarding

Provide a realistic estimate of days remaining and any risk factors.`;

  try {
    const { object } = await generateObject({
      model: 'openai/gpt-4o-mini',
      schema: estimationSchema,
      prompt,
      maxOutputTokens: 500,
    });

    // Calculate the estimated completion date
    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + object.estimatedDaysRemaining);

    return {
      success: true,
      estimatedCompletionDate: estimatedCompletionDate.toISOString(),
      estimatedDaysRemaining: object.estimatedDaysRemaining,
      confidence: object.confidence,
      reasoning: object.reasoning,
      riskFactors: object.riskFactors || [],
    };
  } catch (error) {
    console.error('Error estimating onboarding completion:', error);
    return {
      success: false,
      error: 'Failed to generate estimate. Please try again.',
    };
  }
}
