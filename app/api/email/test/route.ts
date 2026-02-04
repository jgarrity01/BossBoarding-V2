import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("[v0] Email test endpoint called");

  // Check environment variables
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  console.log("[v0] Environment check:");
  console.log("[v0] - RESEND_API_KEY exists:", !!apiKey);
  console.log("[v0] - RESEND_FROM_EMAIL:", fromEmail || "NOT SET");
  console.log("[v0] - ADMIN_NOTIFICATION_EMAIL:", adminEmail || "NOT SET");

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "RESEND_API_KEY is not configured",
        debug: {
          hasApiKey: false,
          fromEmail: fromEmail || null,
          adminEmail: adminEmail || null,
        },
      },
      { status: 500 }
    );
  }

  if (!fromEmail) {
    return NextResponse.json(
      {
        success: false,
        error: "RESEND_FROM_EMAIL is not configured",
        debug: {
          hasApiKey: true,
          fromEmail: null,
          adminEmail: adminEmail || null,
        },
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const testEmail = body.email || adminEmail;

    if (!testEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No email address provided and ADMIN_NOTIFICATION_EMAIL is not set",
        },
        { status: 400 }
      );
    }

    console.log("[v0] Attempting to send test email to:", testEmail);

    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: "BossBoarding - Email Test Successful!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">Email Configuration Working!</h1>
          <p>This is a test email from your BossBoarding application.</p>
          <p>If you're seeing this, your Resend email integration is properly configured.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Configuration Details:</strong><br />
            From: ${fromEmail}<br />
            To: ${testEmail}<br />
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    console.log("[v0] Resend API response:", JSON.stringify(result));

    if (result.error) {
      console.log("[v0] Resend returned error:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error.message,
          details: result.error,
        },
        { status: 400 }
      );
    }

    console.log("[v0] Email sent successfully, ID:", result.data?.id);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      emailId: result.data?.id,
      debug: {
        fromEmail,
        toEmail: testEmail,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[v0] Email test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
