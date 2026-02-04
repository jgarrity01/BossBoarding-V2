"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EmailTestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    debug?: Record<string, unknown>;
  } | null>(null);

  const sendTestEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration Test
            </CardTitle>
            <CardDescription>
              Test your Resend email configuration to ensure emails are being
              sent correctly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Test Email Address (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Leave blank to use ADMIN_NOTIFICATION_EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                If left blank, the test email will be sent to your configured
                admin email.
              </p>
            </div>

            <Button onClick={sendTestEmail} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {result.success ? "Success!" : "Error"}
                </AlertTitle>
                <AlertDescription>
                  {result.success
                    ? result.message
                    : result.error || "Unknown error occurred"}
                </AlertDescription>
              </Alert>
            )}

            {result?.debug && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2 text-sm">Debug Information:</p>
                <pre className="text-xs overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(result.debug, null, 2)}
                </pre>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Troubleshooting Tips:</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>
                  <strong>1.</strong> Ensure RESEND_API_KEY is set in the Vars
                  section of the v0 sidebar
                </li>
                <li>
                  <strong>2.</strong> Ensure RESEND_FROM_EMAIL is set to a
                  verified email/domain in Resend
                </li>
                <li>
                  <strong>3.</strong> If using onboarding@resend.dev, you can
                  only send to your own verified email
                </li>
                <li>
                  <strong>4.</strong> Check your spam/junk folder for test
                  emails
                </li>
                <li>
                  <strong>5.</strong> Verify your domain in Resend dashboard for
                  production use
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
