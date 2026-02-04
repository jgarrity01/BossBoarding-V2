"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/store";
import type { Customer, OnboardingStatus } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Building2 } from "lucide-react";
import Link from "next/link";

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const { customers, updateCustomer } = useAdminStore();
  const [saving, setSaving] = useState(false);

  const customer = customers.find((c) => c.id === params.id);

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    status: "not_started" as OnboardingStatus,
    contractSigned: false,
    installationDate: "",
    goLiveDate: "",
    notes: "",
  });

  useEffect(() => {
    if (customer) {
      // Convert ISO dates to YYYY-MM-DD format for date inputs
      const formatDateForInput = (dateStr: string | undefined) => {
        if (!dateStr) return "";
        try {
          return new Date(dateStr).toISOString().split('T')[0];
        } catch {
          return "";
        }
      };
      
      setFormData({
        businessName: customer.businessName,
        ownerName: customer.ownerName,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        contractSigned: customer.contractSigned,
        installationDate: formatDateForInput(customer.installationDate),
        goLiveDate: formatDateForInput(customer.goLiveDate),
        notes: customer.notes || "",
      });
    }
  }, [customer]);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          Customer not found
        </h2>
        <Button asChild variant="outline">
          <Link href="/admin/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert date strings to ISO format for database
      const installationDate = formData.installationDate 
        ? new Date(formData.installationDate).toISOString() 
        : undefined;
      const goLiveDate = formData.goLiveDate 
        ? new Date(formData.goLiveDate).toISOString() 
        : undefined;
      
      // Await the update to ensure it completes before navigating
      await updateCustomer(customer.id, {
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        contractSigned: formData.contractSigned,
        installationDate,
        goLiveDate,
        notes: formData.notes || undefined,
      });
      router.push(`/admin/customers/${customer.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/admin/customers/${customer.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Customer</h1>
            <p className="text-muted-foreground">{customer.businessName}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Business Information</CardTitle>
            <CardDescription>Basic business and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Owner Name</Label>
              <Input
                value={formData.ownerName}
                onChange={(e) =>
                  setFormData({ ...formData, ownerName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Status & Dates</CardTitle>
            <CardDescription>Onboarding progress and key dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: OnboardingStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="needs_review">Needs Review</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="contractSigned"
                checked={formData.contractSigned}
                onChange={(e) =>
                  setFormData({ ...formData, contractSigned: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="contractSigned">Contract Signed</Label>
            </div>
            <div className="space-y-2">
              <Label>Installation Date</Label>
              <Input
                type="date"
                value={formData.installationDate}
                onChange={(e) =>
                  setFormData({ ...formData, installationDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Go Live Date</Label>
              <Input
                type="date"
                value={formData.goLiveDate}
                onChange={(e) =>
                  setFormData({ ...formData, goLiveDate: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Notes</CardTitle>
            <CardDescription>Internal notes about this customer</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any notes about this customer..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
