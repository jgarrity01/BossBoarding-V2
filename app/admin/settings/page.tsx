"use client";

import Link from "next/link";
import { Users } from "lucide-react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Bell,
  Mail,
  Shield,
  Building2,
  Save,
  CheckCircle2,
  Info,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface CompanySettings {
  companyName: string;
  supportEmail: string;
  phone: string;
  website: string;
}

interface OnboardingSettings {
  autoAssignTasks: boolean;
  requirePciConsent: boolean;
  enableSelfRegistration: boolean;
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

interface NotificationSettings {
  emailNotifications: boolean;
  taskReminders: boolean;
  statusUpdates: boolean;
  weeklyReports: boolean;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Company settings
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: "Laundry Boss",
    supportEmail: "onboarding@thelaundryboss.com",
    phone: "(555) 123-4567",
    website: "https://thelaundryboss.com",
  });
  
  // Onboarding settings
  const [onboardingSettings, setOnboardingSettings] = useState<OnboardingSettings>({
    autoAssignTasks: true,
    requirePciConsent: true,
    enableSelfRegistration: false,
  });
  
  // EmailJS config
  const [emailJSConfig, setEmailJSConfig] = useState<EmailJSConfig>({
    serviceId: "",
    publicKey: "",
    templates: {
      welcomeEmail: "",
      kickoffEmail: "",
      statusUpdate: "",
      taskReminder: "",
      completionNotice: "",
    },
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    taskReminders: true,
    statusUpdates: true,
    weeklyReports: false,
  });

  const [localConfig, setLocalConfig] = useState<EmailJSConfig>({
    serviceId: "",
    publicKey: "",
    templates: {
      welcomeEmail: "",
      kickoffEmail: "",
      statusUpdate: "",
      taskReminder: "",
      completionNotice: "",
    },
  });
  
  // Load settings from Supabase on mount
  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          const settings = data.settings || {};
          
          if (settings.company) setCompanySettings(settings.company);
          if (settings.onboarding) setOnboardingSettings(settings.onboarding);
          if (settings.emailjs) setEmailJSConfig(settings.emailjs);
          if (settings.notifications) setNotificationSettings(settings.notifications);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);
  
  // Save all settings to Supabase
  const saveSettings = async (key: string, value: unknown) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompany = () => saveSettings('company', companySettings);
  const handleSaveOnboarding = () => saveSettings('onboarding', onboardingSettings);
  const handleSaveEmailJS = () => saveSettings('emailjs', emailJSConfig);
  const handleSaveNotifications = () => saveSettings('notifications', notificationSettings);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage application settings and preferences
        </p>
      </div>

      {saved && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">Settings Saved</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Your settings have been saved to the database successfully.
          </AlertDescription>
        </Alert>
      )}
      
      {saveError && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <Info className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-200">Error Saving Settings</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">
            {saveError}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="emailjs">EmailJS</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Update your company details and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName" 
                    value={companySettings.companyName}
                    onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Onboarding Manager Email</Label>
                  <Input 
                    id="supportEmail" 
                    type="email" 
                    value={companySettings.supportEmail}
                    onChange={(e) => setCompanySettings({ ...companySettings, supportEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Onboarding Settings</CardTitle>
              <CardDescription>
                Configure default onboarding workflow options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-assign Tasks</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign project tasks when new customers are added
                  </p>
                </div>
                <Switch 
                  checked={onboardingSettings.autoAssignTasks}
                  onCheckedChange={(checked) => setOnboardingSettings({ ...onboardingSettings, autoAssignTasks: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require PCI Consent</Label>
                  <p className="text-sm text-muted-foreground">
                    Require PCI compliance consent before completing onboarding
                  </p>
                </div>
                <Switch 
                  checked={onboardingSettings.requirePciConsent}
                  onCheckedChange={(checked) => setOnboardingSettings({ ...onboardingSettings, requirePciConsent: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Employee Self-Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow employees to register themselves via email invitation
                  </p>
                </div>
                <Switch 
                  checked={onboardingSettings.enableSelfRegistration}
                  onCheckedChange={(checked) => setOnboardingSettings({ ...onboardingSettings, enableSelfRegistration: checked })}
                />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveOnboarding} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Onboarding Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emailjs" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>EmailJS Integration</AlertTitle>
            <AlertDescription>
              Configure EmailJS to send automated emails for onboarding notifications, welcome packets, and status updates.
              <a 
                href="https://www.emailjs.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline inline-flex items-center"
              >
                Visit EmailJS
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          {saved && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Settings Saved</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Your EmailJS configuration has been saved successfully.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Mail className="h-5 w-5" />
                EmailJS Configuration
              </CardTitle>
              <CardDescription>
                Enter your EmailJS credentials from your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="serviceId">Service ID</Label>
                  <Input
                    id="serviceId"
                    placeholder="service_xxxxxxx"
                    value={emailJSConfig.serviceId}
                    onChange={(e) => setEmailJSConfig({ ...emailJSConfig, serviceId: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in EmailJS Dashboard under Email Services
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicKey">Public Key</Label>
                  <Input
                    id="publicKey"
                    placeholder="xxxxxxxxxxxxxxx"
                    value={emailJSConfig.publicKey}
                    onChange={(e) => setEmailJSConfig({ ...emailJSConfig, publicKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in EmailJS Dashboard under Account Settings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Email Templates</CardTitle>
              <CardDescription>
                Configure template IDs for each email type. Create these templates in your EmailJS dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="welcomeTemplate">Welcome Email Template</Label>
                  <Input
                    id="welcomeTemplate"
                    placeholder="template_welcome"
                    value={emailJSConfig.templates.welcomeEmail}
                    onChange={(e) => setEmailJSConfig({
                      ...emailJSConfig,
                      templates: { ...emailJSConfig.templates, welcomeEmail: e.target.value }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sent when a new customer is added
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kickoffTemplate">Kickoff Email Template</Label>
                  <Input
                    id="kickoffTemplate"
                    placeholder="template_kickoff"
                    value={emailJSConfig.templates.kickoffEmail}
                    onChange={(e) => setEmailJSConfig({
                      ...emailJSConfig,
                      templates: { ...emailJSConfig.templates, kickoffEmail: e.target.value }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sent to schedule kickoff call
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusTemplate">Status Update Template</Label>
                  <Input
                    id="statusTemplate"
                    placeholder="template_status"
                    value={emailJSConfig.templates.statusUpdate}
                    onChange={(e) => setEmailJSConfig({
                      ...emailJSConfig,
                      templates: { ...emailJSConfig.templates, statusUpdate: e.target.value }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sent when task status changes
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminderTemplate">Task Reminder Template</Label>
                  <Input
                    id="reminderTemplate"
                    placeholder="template_reminder"
                    value={emailJSConfig.templates.taskReminder}
                    onChange={(e) => setEmailJSConfig({
                      ...emailJSConfig,
                      templates: { ...emailJSConfig.templates, taskReminder: e.target.value }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sent for task reminders
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="completionTemplate">Completion Notice Template</Label>
                  <Input
                    id="completionTemplate"
                    placeholder="template_complete"
                    value={emailJSConfig.templates.completionNotice}
                    onChange={(e) => setEmailJSConfig({
                      ...emailJSConfig,
                      templates: { ...emailJSConfig.templates, completionNotice: e.target.value }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sent when onboarding is complete
                  </p>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Template Variables</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Use these variables in your EmailJS templates:
                </p>
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  <code className="bg-muted px-2 py-1 rounded">{"{{customer_name}}"}</code>
                  <code className="bg-muted px-2 py-1 rounded">{"{{business_name}}"}</code>
                  <code className="bg-muted px-2 py-1 rounded">{"{{customer_email}}"}</code>
                  <code className="bg-muted px-2 py-1 rounded">{"{{task_name}}"}</code>
                  <code className="bg-muted px-2 py-1 rounded">{"{{status}}"}</code>
                  <code className="bg-muted px-2 py-1 rounded">{"{{portal_link}}"}</code>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveEmailJS} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save EmailJS Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Customer Submissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a new customer completes onboarding
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Completion</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when project tasks are completed
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.taskReminders}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, taskReminders: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overdue Tasks</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when tasks are overdue
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.statusUpdates}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, statusUpdates: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of onboarding progress
                  </p>
                </div>
                <Switch 
                  checked={notificationSettings.weeklyReports}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, weeklyReports: checked })}
                />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Mail className="h-5 w-5" />
                Email Recipients
              </CardTitle>
              <CardDescription>
                Configure who receives email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Primary Notification Email</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  defaultValue="onboarding@thelaundryboss.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ccEmails">CC Recipients</Label>
                <Input
                  id="ccEmails"
                  placeholder="email1@company.com, email2@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple emails with commas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for admin access
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out inactive users after 30 minutes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>IP Whitelisting</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict admin access to specific IP addresses
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">User Management</CardTitle>
              <CardDescription>
                Manage admin and customer user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use the User Administration page to manage team members and customer portal access.
                </p>
                <Button asChild variant="outline" className="bg-transparent">
                  <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4" />
                    Go to User Administration
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
