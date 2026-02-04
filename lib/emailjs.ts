// EmailJS Integration Utility
// This file provides helper functions for sending emails via EmailJS

import emailjs from '@emailjs/browser';

interface EmailParams {
  to_email: string;
  to_name: string;
  customer_name?: string;
  business_name?: string;
  task_name?: string;
  status?: string;
  portal_link?: string;
  message?: string;
  [key: string]: string | undefined;
}

interface EmailJSConfig {
  serviceId: string;
  publicKey: string;
  templates: {
    welcomeEmail: string;
    kickoffEmail: string;
    statusUpdate: string;
    taskReminder: string;
    completionNotice: string;
  };
}

// Initialize EmailJS with public key
export const initEmailJS = (publicKey: string) => {
  emailjs.init(publicKey);
};

// Send an email using a specific template
export const sendEmail = async (
  serviceId: string,
  templateId: string,
  params: EmailParams
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await emailjs.send(serviceId, templateId, params);
    console.log('Email sent successfully:', response);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Send welcome email to new customer
export const sendWelcomeEmail = async (
  config: EmailJSConfig,
  customer: { name: string; email: string; businessName: string }
) => {
  return sendEmail(config.serviceId, config.templates.welcomeEmail, {
    to_email: customer.email,
    to_name: customer.name,
    customer_name: customer.name,
    business_name: customer.businessName,
    portal_link: `${typeof window !== 'undefined' ? window.location.origin : ''}/portal`,
  });
};

// Send kickoff email
export const sendKickoffEmail = async (
  config: EmailJSConfig,
  customer: { name: string; email: string; businessName: string }
) => {
  return sendEmail(config.serviceId, config.templates.kickoffEmail, {
    to_email: customer.email,
    to_name: customer.name,
    customer_name: customer.name,
    business_name: customer.businessName,
  });
};

// Send status update email
export const sendStatusUpdateEmail = async (
  config: EmailJSConfig,
  customer: { name: string; email: string; businessName: string },
  taskName: string,
  status: string
) => {
  return sendEmail(config.serviceId, config.templates.statusUpdate, {
    to_email: customer.email,
    to_name: customer.name,
    customer_name: customer.name,
    business_name: customer.businessName,
    task_name: taskName,
    status: status,
    portal_link: `${typeof window !== 'undefined' ? window.location.origin : ''}/portal`,
  });
};

// Send task reminder email
export const sendTaskReminderEmail = async (
  config: EmailJSConfig,
  customer: { name: string; email: string; businessName: string },
  taskName: string
) => {
  return sendEmail(config.serviceId, config.templates.taskReminder, {
    to_email: customer.email,
    to_name: customer.name,
    customer_name: customer.name,
    business_name: customer.businessName,
    task_name: taskName,
  });
};

// Send completion notice email
export const sendCompletionNoticeEmail = async (
  config: EmailJSConfig,
  customer: { name: string; email: string; businessName: string }
) => {
  return sendEmail(config.serviceId, config.templates.completionNotice, {
    to_email: customer.email,
    to_name: customer.name,
    customer_name: customer.name,
    business_name: customer.businessName,
    portal_link: `${typeof window !== 'undefined' ? window.location.origin : ''}/portal`,
  });
};

/*
 * EmailJS Template Examples
 * 
 * When setting up templates in EmailJS, use the following variable names:
 * 
 * WELCOME EMAIL TEMPLATE (template_welcome):
 * Subject: Welcome to Laundry Boss - {{business_name}}
 * Body:
 *   Hello {{customer_name}},
 *   
 *   Welcome to The Laundry Boss! We're excited to begin your onboarding journey.
 *   
 *   Business: {{business_name}}
 *   
 *   You can track your onboarding progress at: {{portal_link}}
 *   
 *   Our onboarding team will be in touch shortly to schedule your kickoff call.
 *   
 *   Best regards,
 *   The Laundry Boss Team
 *   onboarding@thelaundryboss.com
 * 
 * KICKOFF EMAIL TEMPLATE (template_kickoff):
 * Subject: Schedule Your Kickoff Call - {{business_name}}
 * Body:
 *   Hello {{customer_name}},
 *   
 *   It's time to schedule your kickoff call for {{business_name}}.
 *   
 *   During this call, we'll:
 *   - Review your location details
 *   - Discuss your machine inventory
 *   - Answer any questions you have
 *   - Set expectations for the onboarding process
 *   
 *   Please reply to this email with your availability for the next week.
 *   
 *   Best regards,
 *   The Laundry Boss Onboarding Team
 * 
 * STATUS UPDATE TEMPLATE (template_status):
 * Subject: Task Update - {{task_name}} - {{business_name}}
 * Body:
 *   Hello {{customer_name}},
 *   
 *   This is an update on your onboarding progress for {{business_name}}.
 *   
 *   Task: {{task_name}}
 *   Status: {{status}}
 *   
 *   View your full progress at: {{portal_link}}
 *   
 *   Best regards,
 *   The Laundry Boss Team
 * 
 * TASK REMINDER TEMPLATE (template_reminder):
 * Subject: Action Needed - {{task_name}} - {{business_name}}
 * Body:
 *   Hello {{customer_name}},
 *   
 *   This is a reminder that the following task requires your attention:
 *   
 *   Task: {{task_name}}
 *   Business: {{business_name}}
 *   
 *   Please complete this at your earliest convenience to keep your onboarding on track.
 *   
 *   Best regards,
 *   The Laundry Boss Team
 * 
 * COMPLETION NOTICE TEMPLATE (template_complete):
 * Subject: Congratulations! Onboarding Complete - {{business_name}}
 * Body:
 *   Hello {{customer_name}},
 *   
 *   Congratulations! Your onboarding for {{business_name}} is now complete!
 *   
 *   Your Laundry Boss system is ready to go. You can access your dashboard at: {{portal_link}}
 *   
 *   Thank you for choosing The Laundry Boss!
 *   
 *   Best regards,
 *   The Laundry Boss Team
 */
