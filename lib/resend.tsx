import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

export interface CustomerEmailData {
  customerName: string;
  businessName: string;
  email: string;
  phone?: string;
  locationName?: string;
  machineCount?: number;
  employeeCount?: number;
}

// Email sent to customer after they submit onboarding form
export async function sendCustomerWelcomeEmail(customer: CustomerEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[v0] RESEND_API_KEY is not set');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: customer.email,
      subject: `Welcome to BossBoarding, ${customer.customerName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin: 0;">Welcome Aboard!</h1>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Dear ${customer.customerName},
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Thank you for submitting your onboarding information for <strong>${customer.businessName}</strong>. 
            We're excited to have you join us!
          </p>
          
          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1a1a1a; margin-top: 0;">What happens next?</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>Our team will review your submission</li>
              <li>We'll reach out if we need any additional information</li>
              <li>You'll receive a confirmation email once onboarding is complete</li>
            </ul>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            If you have any questions in the meantime, please don't hesitate to reach out.
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The BossBoarding Team</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            This email was sent to ${customer.email} because you submitted an onboarding form.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[v0] Failed to send customer welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('[v0] Customer welcome email sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[v0] Error sending customer welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email sent to admin when a new customer submits onboarding
export async function sendAdminNewSubmissionEmail(customer: CustomerEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[v0] RESEND_API_KEY is not set');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  if (!adminEmail) {
    console.error('[v0] ADMIN_NOTIFICATION_EMAIL is not set');
    return { success: false, error: 'ADMIN_NOTIFICATION_EMAIL not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New Onboarding Submission: ${customer.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">New Customer Submission</h1>
          </div>
          
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Customer Details</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;">Business Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a; font-weight: bold;">${customer.businessName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Owner Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">${customer.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">
                  <a href="mailto:${customer.email}" style="color: #2563eb;">${customer.email}</a>
                </td>
              </tr>
              ${customer.phone ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Phone</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">${customer.phone}</td>
              </tr>
              ` : ''}
              ${customer.locationName ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Location</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">${customer.locationName}</td>
              </tr>
              ` : ''}
              ${customer.machineCount ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Machines</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">${customer.machineCount}</td>
              </tr>
              ` : ''}
              ${customer.employeeCount ? `
              <tr>
                <td style="padding: 10px 0; color: #666;">Employees</td>
                <td style="padding: 10px 0; color: #1a1a1a;">${customer.employeeCount}</td>
              </tr>
              ` : ''}
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Action Required:</strong> Please review this submission and begin the onboarding process.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[v0] Failed to send admin notification email:', error);
      return { success: false, error: error.message };
    }

    console.log('[v0] Admin notification email sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[v0] Error sending admin notification email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email sent to customer when onboarding is marked complete
export async function sendCustomerCompletionEmail(customer: CustomerEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[v0] RESEND_API_KEY is not set');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: customer.email,
      subject: `Congratulations! Your Onboarding is Complete - ${customer.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #10b981; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 30px;">
              &#10003;
            </div>
            <h1 style="color: #1a1a1a; margin: 20px 0 0 0;">Onboarding Complete!</h1>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Dear ${customer.customerName},
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Great news! The onboarding process for <strong>${customer.businessName}</strong> has been completed successfully.
          </p>
          
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #065f46; margin-top: 0;">You're all set!</h3>
            <p style="color: #047857; margin-bottom: 0;">
              Your account is now fully configured and ready to use. You can now access all features and start using the system.
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            If you have any questions or need assistance, our support team is here to help.
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Thank you for choosing BossBoarding!
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The BossBoarding Team</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            This email was sent to ${customer.email} regarding your onboarding status.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[v0] Failed to send customer completion email:', error);
      return { success: false, error: error.message };
    }

    console.log('[v0] Customer completion email sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[v0] Error sending customer completion email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email sent to admin when onboarding is marked complete
export async function sendAdminCompletionEmail(customer: CustomerEmailData, completedBy?: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[v0] RESEND_API_KEY is not set');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  if (!adminEmail) {
    console.error('[v0] ADMIN_NOTIFICATION_EMAIL is not set');
    return { success: false, error: 'ADMIN_NOTIFICATION_EMAIL not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `Onboarding Completed: ${customer.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Onboarding Completed</h1>
          </div>
          
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 0;">
              The onboarding process for the following customer has been marked as complete${completedBy ? ` by <strong>${completedBy}</strong>` : ''}.
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;">Business Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a; font-weight: bold;">${customer.businessName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Owner Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">${customer.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666;">Email</td>
                <td style="padding: 10px 0; color: #1a1a1a;">
                  <a href="mailto:${customer.email}" style="color: #2563eb;">${customer.email}</a>
                </td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #ecfdf5; border-radius: 8px;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                The customer has been notified of their onboarding completion.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[v0] Failed to send admin completion email:', error);
      return { success: false, error: error.message };
    }

    console.log('[v0] Admin completion email sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[v0] Error sending admin completion email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
