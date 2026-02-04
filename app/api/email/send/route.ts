import { NextRequest, NextResponse } from 'next/server';
import {
  sendCustomerWelcomeEmail,
  sendAdminNewSubmissionEmail,
  sendCustomerCompletionEmail,
  sendAdminCompletionEmail,
  type CustomerEmailData,
} from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, customer, completedBy } = body as {
      type: 'onboarding_submitted' | 'onboarding_complete';
      customer: CustomerEmailData;
      completedBy?: string;
    };

    if (!type || !customer) {
      return NextResponse.json(
        { error: 'Missing required fields: type and customer' },
        { status: 400 }
      );
    }

    const results: { customerEmail?: { success: boolean; error?: string }; adminEmail?: { success: boolean; error?: string } } = {};

    if (type === 'onboarding_submitted') {
      // Send welcome email to customer
      results.customerEmail = await sendCustomerWelcomeEmail(customer);
      
      // Send notification to admin
      results.adminEmail = await sendAdminNewSubmissionEmail(customer);
    } else if (type === 'onboarding_complete') {
      // Send completion email to customer
      results.customerEmail = await sendCustomerCompletionEmail(customer);
      
      // Send notification to admin
      results.adminEmail = await sendAdminCompletionEmail(customer, completedBy);
    } else {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      );
    }

    // Check if any emails failed
    const hasErrors = !results.customerEmail?.success || !results.adminEmail?.success;

    return NextResponse.json({
      success: !hasErrors,
      results,
      message: hasErrors 
        ? 'Some emails failed to send' 
        : 'All emails sent successfully',
    });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to send emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
