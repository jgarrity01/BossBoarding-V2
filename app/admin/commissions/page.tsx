"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdminStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Building2,
} from "lucide-react";
import { SALES_REPS } from "@/lib/types";

interface CommissionEntry {
  customerId: string;
  customerName: string;
  salesRepId: string;
  salesRepName: string;
  dealAmount: number;
  commissionRate: number;
  commissionPercent: number; // Rep's split percentage
  totalCommission: number; // Total commission on deal
  repCommission: number; // Rep's portion
  paymentStatus: 'unpaid' | 'paid_partial' | 'paid_in_full';
  paidToDate: number;
  commissionOnPaid: number; // Commission owed on paid amount
  commissionPaid: number; // Commission already paid out
  commissionOwedNow: number; // Commission owed now based on payments
  paymentTermMonths: number;
  monthlyCommission: number; // For ongoing monthly payments
  paidDate?: string;
  status: string;
}

export default function CommissionsPage() {
  const { customers } = useAdminStore();
  const [filterRep, setFilterRep] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Calculate all commission entries
  const commissionEntries = useMemo(() => {
    const entries: CommissionEntry[] = [];
    
    customers.forEach((customer) => {
      if (!customer.salesRepAssignments || customer.salesRepAssignments.length === 0) return;
      if (!customer.dealAmount || customer.dealAmount <= 0) return;
      
      const dealAmount = customer.dealAmount || 0;
      const commissionRate = customer.commissionRate || 10;
      const totalCommission = dealAmount * commissionRate / 100;
      const paidToDate = customer.paidToDateAmount || 0;
      const commissionOnPaid = paidToDate * commissionRate / 100;
      const commissionPaid = customer.commissionPaidAmount || 0;
      const remainingDeal = dealAmount - paidToDate;
      const paymentTermMonths = customer.paymentTermMonths || 48;
      const monthlyPayment = remainingDeal / paymentTermMonths;
      const monthlyCommission = monthlyPayment * commissionRate / 100;
      
      customer.salesRepAssignments.forEach((assignment) => {
        const repTotalCommission = totalCommission * assignment.commissionPercent / 100;
        const repCommissionOnPaid = commissionOnPaid * assignment.commissionPercent / 100;
        const repCommissionPaid = commissionPaid * assignment.commissionPercent / 100;
        const repCommissionOwedNow = repCommissionOnPaid - repCommissionPaid;
        const repMonthlyCommission = monthlyCommission * assignment.commissionPercent / 100;
        
        entries.push({
          customerId: customer.id,
          customerName: customer.businessName,
          salesRepId: assignment.salesRepId,
          salesRepName: assignment.salesRepName,
          dealAmount: dealAmount,
          commissionRate: commissionRate,
          commissionPercent: assignment.commissionPercent,
          totalCommission: totalCommission,
          repCommission: repTotalCommission,
          paymentStatus: customer.paymentStatus || 'unpaid',
          paidToDate: paidToDate,
          commissionOnPaid: repCommissionOnPaid,
          commissionPaid: repCommissionPaid,
          commissionOwedNow: Math.max(0, repCommissionOwedNow),
          paymentTermMonths: paymentTermMonths,
          monthlyCommission: repMonthlyCommission,
          paidDate: customer.paidDate,
          status: customer.status,
        });
      });
    });
    
    return entries;
  }, [customers]);

  // Apply filters
  const filteredEntries = useMemo(() => {
    return commissionEntries.filter((entry) => {
      if (filterRep !== "all" && entry.salesRepId !== filterRep) return false;
      if (filterStatus === "paid_full" && entry.paymentStatus !== 'paid_in_full') return false;
      if (filterStatus === "paid_partial" && entry.paymentStatus !== 'paid_partial') return false;
      if (filterStatus === "unpaid" && entry.paymentStatus !== 'unpaid') return false;
      if (filterStatus === "complete" && entry.status !== "complete") return false;
      if (filterStatus === "owed_now" && entry.commissionOwedNow <= 0) return false;
      
      if (dateFrom && entry.paidDate) {
        if (new Date(entry.paidDate) < new Date(dateFrom)) return false;
      }
      if (dateTo && entry.paidDate) {
        if (new Date(entry.paidDate) > new Date(dateTo)) return false;
      }
      
      return true;
    });
  }, [commissionEntries, filterRep, filterStatus, dateFrom, dateTo]);

  // Calculate summaries by sales rep
  const repSummaries = useMemo(() => {
    const summaries: Record<string, { 
      totalDeals: number; 
      totalCommission: number; 
      commissionOwedNow: number;
      commissionPaid: number;
      monthlyCommission: number;
    }> = {};
    
    SALES_REPS.forEach((rep) => {
      summaries[rep.id] = { totalDeals: 0, totalCommission: 0, commissionOwedNow: 0, commissionPaid: 0, monthlyCommission: 0 };
    });
    
    commissionEntries.forEach((entry) => {
      if (!summaries[entry.salesRepId]) {
        summaries[entry.salesRepId] = { totalDeals: 0, totalCommission: 0, commissionOwedNow: 0, commissionPaid: 0, monthlyCommission: 0 };
      }
      summaries[entry.salesRepId].totalDeals += 1;
      summaries[entry.salesRepId].totalCommission += entry.repCommission;
      summaries[entry.salesRepId].commissionOwedNow += entry.commissionOwedNow;
      summaries[entry.salesRepId].commissionPaid += entry.commissionPaid;
      if (entry.paymentStatus !== 'paid_in_full') {
        summaries[entry.salesRepId].monthlyCommission += entry.monthlyCommission;
      }
    });
    
    return summaries;
  }, [commissionEntries]);

  // Total commissions owed now (based on payments received)
  const totalOwedNow = filteredEntries.reduce((sum, e) => sum + e.commissionOwedNow, 0);

  const totalPaid = filteredEntries.reduce((sum, e) => sum + e.commissionPaid, 0);

  const totalMonthly = filteredEntries
    .filter(e => e.paymentStatus !== 'paid_in_full')
    .reduce((sum, e) => sum + e.monthlyCommission, 0);

  const totalCommission = filteredEntries.reduce((sum, e) => sum + e.repCommission, 0);

  const exportToCSV = () => {
    const headers = ["Customer", "Sales Rep", "Deal Amount", "Commission Rate", "Rep Split %", "Total Commission", "Rep Commission", "Payment Status", "Paid to Date", "Commission Owed Now", "Commission Paid", "Monthly Commission", "Paid Date", "Status"];
    const rows = filteredEntries.map(e => [
      e.customerName,
      e.salesRepName,
      e.dealAmount.toFixed(2),
      e.commissionRate.toFixed(1) + "%",
      e.commissionPercent.toFixed(1) + "%",
      e.totalCommission.toFixed(2),
      e.repCommission.toFixed(2),
      e.paymentStatus,
      e.paidToDate.toFixed(2),
      e.commissionOwedNow.toFixed(2),
      e.commissionPaid.toFixed(2),
      e.monthlyCommission.toFixed(2),
      e.paidDate ? new Date(e.paidDate).toLocaleDateString() : "",
      e.status,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commissions-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Commission Report</h1>
            <p className="text-muted-foreground">View and export commission data for accounting</p>
          </div>
        </div>
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Owed Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalOwedNow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Based on payments received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Already paid to reps</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Ongoing monthly payout</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Across {filteredEntries.length} entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deal Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredEntries.reduce((sum, e) => sum + e.dealAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Across all deals</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Rep Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Commission by Sales Rep
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SALES_REPS.map((rep) => {
              const summary = repSummaries[rep.id];
              return (
                <div key={rep.id} className="p-4 rounded-lg border bg-card">
                  <h4 className="font-medium text-foreground">{rep.name}</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deals:</span>
                      <span>{summary?.totalDeals || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span>${(summary?.totalCommission || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Owed Now:</span>
                      <span className="font-medium">${(summary?.commissionOwedNow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>Paid:</span>
                      <span>${(summary?.commissionPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Monthly:</span>
                      <span>${(summary?.monthlyCommission || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Sales Rep</Label>
              <Select value={filterRep} onValueChange={setFilterRep}>
                <SelectTrigger>
                  <SelectValue placeholder="All Reps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reps</SelectItem>
                  {SALES_REPS.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>{rep.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="owed_now">Commission Owed Now</SelectItem>
                  <SelectItem value="paid_full">Paid in Full</SelectItem>
                  <SelectItem value="paid_partial">Paid Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="complete">Complete Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paid From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Paid To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commission Details
          </CardTitle>
          <CardDescription>
            Showing {filteredEntries.length} commission entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Sales Rep</TableHead>
                <TableHead className="text-right">Deal</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Rep Comm.</TableHead>
                <TableHead className="text-right text-green-600">Owed Now</TableHead>
                <TableHead className="text-right text-blue-600">Paid Out</TableHead>
                <TableHead className="text-right text-amber-600">Monthly</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No commission entries found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry, index) => (
                  <TableRow key={`${entry.customerId}-${entry.salesRepId}-${index}`}>
                    <TableCell>
                      <Link 
                        href={`/admin/customers/${entry.customerId}`}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[120px]">{entry.customerName}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{entry.salesRepName}</TableCell>
                    <TableCell className="text-right text-sm">
                      ${entry.dealAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {entry.commissionRate}% ({entry.commissionPercent}%)
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${entry.repCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ${entry.commissionOwedNow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      ${entry.commissionPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      {entry.paymentStatus !== 'paid_in_full' 
                        ? `$${entry.monthlyCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        entry.paymentStatus === "paid_in_full" 
                          ? "bg-green-100 text-green-700" 
                          : entry.paymentStatus === "paid_partial"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }>
                        {entry.paymentStatus === 'paid_in_full' ? 'Paid Full' : 
                         entry.paymentStatus === 'paid_partial' ? `Partial ($${entry.paidToDate.toLocaleString()})` : 
                         'Unpaid'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
