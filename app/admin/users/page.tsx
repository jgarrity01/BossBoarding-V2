"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore, useAdminStore } from "@/lib/store";
import type { AdminUser, CustomerUser } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  Building2,
  LogIn,
  Pencil,
  Key,
  Trash2,
  Mail,
  MoreHorizontal,
  Shield,
} from "lucide-react";

const roleColors: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  staff: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default function UsersPage() {
  const router = useRouter();
  const { adminUsers: localAdminUsers, customerUsers, addAdminUser, updateAdminUser, updateAdminPassword, deleteAdminUser: deleteLocalAdminUser, addCustomerUser, updateCustomerUser, deleteCustomerUser, setCurrentCustomerUser } = useUserStore();
  const { customers } = useAdminStore();
  
  // State for Supabase admin users
  const [supabaseAdminUsers, setSupabaseAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  
  // State for Supabase customer users
  const [supabaseCustomerUsers, setSupabaseCustomerUsers] = useState<CustomerUser[]>([]);
  const [isLoadingCustomerUsers, setIsLoadingCustomerUsers] = useState(true);
  
  // Load admin users from Supabase on mount via API
  const loadAdminUsers = async () => {
    setIsLoadingAdmins(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Error loading admin users:', text);
        return;
      }
      
      const result = await response.json();
      
      if (result.users) {
        // Convert to our AdminUser type
        const mappedUsers: AdminUser[] = result.users.map((u: { id: string; name: string; email: string; role: string; last_login?: string; created_at?: string }) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: (u.role as AdminUser["role"]) || 'staff',
          createdAt: u.created_at || new Date().toISOString(),
          lastLogin: u.last_login || undefined,
          permissions: u.role === 'super_admin' ? ['all'] : ['view_customers', 'edit_customers'],
        }));
        setSupabaseAdminUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    
    async function fetchAdminUsers() {
      setIsLoadingAdmins(true);
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'list' }),
          signal: abortController.signal,
        });
        
        if (!response.ok) return;
        
        const result = await response.json();
        
        if (result.users) {
          const mappedUsers: AdminUser[] = result.users.map((u: { id: string; name: string; email: string; role: string; last_login?: string; created_at?: string }) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: (u.role as AdminUser["role"]) || 'staff',
            createdAt: u.created_at || new Date().toISOString(),
            lastLogin: u.last_login || undefined,
            permissions: u.role === 'super_admin' ? ['all'] : ['view_customers', 'edit_customers'],
          }));
          setSupabaseAdminUsers(mappedUsers);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error loading admin users:', error);
        }
      } finally {
        setIsLoadingAdmins(false);
      }
    }
    
    fetchAdminUsers();
    return () => abortController.abort();
  }, []);
  
  // Load customer users from Supabase on mount via API
  useEffect(() => {
    const abortController = new AbortController();
    
    async function loadCustomerUsers() {
      setIsLoadingCustomerUsers(true);
      try {
        const response = await fetch('/api/admin/customer-users', {
          signal: abortController.signal,
        });
        
        if (!response.ok) return;
        
        const result = await response.json();
        
        if (result.users) {
          setSupabaseCustomerUsers(result.users);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error loading customer users:', error);
        }
      } finally {
        setIsLoadingCustomerUsers(false);
      }
    }
    
    loadCustomerUsers();
    return () => abortController.abort();
  }, []);
  
  // Use Supabase admin users if available, otherwise fall back to local
  const adminUsers = supabaseAdminUsers.length > 0 ? supabaseAdminUsers : localAdminUsers;
  
  // Use Supabase customer users - always prefer database over local store
  const displayCustomerUsers = supabaseCustomerUsers.length > 0 ? supabaseCustomerUsers : customerUsers;
  
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [passwordResetAdmin, setPasswordResetAdmin] = useState<AdminUser | null>(null);
  const [passwordResetCustomer, setPasswordResetCustomer] = useState<CustomerUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showDirectPasswordSet, setShowDirectPasswordSet] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordSetSuccess, setPasswordSetSuccess] = useState(false);
  
  const [newAdminUser, setNewAdminUser] = useState({
    name: "",
    email: "",
    role: "staff" as AdminUser["role"],
  });
  
  const [newCustomerUser, setNewCustomerUser] = useState({
    customerId: "",
    name: "",
    email: "",
  });

  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [addAdminError, setAddAdminError] = useState("");

  // Delete admin user from Supabase via API
  const handleDeleteAdminUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        // Remove from local state
        setSupabaseAdminUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error deleting admin user:', error);
    }
  };

  const handleAddAdminUser = async () => {
    setIsAddingAdmin(true);
    setAddAdminError("");
    
    try {
      // Create user via server-side API to avoid browser CORS/network issues
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email: newAdminUser.email,
          password: crypto.randomUUID().slice(0, 12), // Temporary password - user will reset
          name: newAdminUser.name,
          role: newAdminUser.role === 'super_admin' ? 'super_admin' : 'admin',
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        setAddAdminError(result.error || 'Failed to create admin user');
        return;
      }
      
      // Refresh the admin users list via API
      const listResponse = await fetch('/api/admin/users');
      const listResult = await listResponse.json();
      
      if (listResult.users) {
        const mappedUsers: AdminUser[] = listResult.users.map((u: { id: string; name: string; email: string; role: string }) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: (u.role as AdminUser["role"]) || 'staff',
          createdAt: new Date().toISOString(),
          permissions: u.role === 'super_admin' ? ['all'] : ['view_customers', 'edit_customers'],
        }));
        setSupabaseAdminUsers(mappedUsers);
      }
      
      // Send password reset email via API (non-blocking - don't fail if this errors)
      fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email: newAdminUser.email,
        }),
      }).catch(e => console.error('Password reset email failed:', e));
      
      setNewAdminUser({ name: "", email: "", role: "staff" });
      setIsAddAdminOpen(false);
      setAddAdminError("");
    } catch (error) {
      console.error('handleAddAdminUser error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setAddAdminError(errorMessage || "An unexpected error occurred");
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleUpdateAdminUser = async () => {
    if (editingAdmin) {
      // Update in local store
      updateAdminUser(editingAdmin.id, {
        name: editingAdmin.name,
        email: editingAdmin.email,
        role: editingAdmin.role,
      });
      
      // Also update in Supabase
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update-role',
            userId: editingAdmin.id,
            name: editingAdmin.name,
            email: editingAdmin.email,
            role: editingAdmin.role,
          }),
        });
        
        if (response.ok) {
          // Refresh admin users list from Supabase
          loadAdminUsers();
        }
      } catch (error) {
        console.error('Error updating admin user in Supabase:', error);
      }
      
      setEditingAdmin(null);
    }
  };

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handlePasswordReset = async () => {
    if (!passwordResetAdmin) return;
    
    setIsResettingPassword(true);
    setPasswordError("");
    
    try {
      // Use API to send password reset email
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email: passwordResetAdmin.email,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setResetEmailSent(true);
        // Keep dialog open to show success message
      } else {
        setPasswordError(result.error || "Failed to send reset email");
      }
    } catch (error) {
      setPasswordError("An unexpected error occurred");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const closePasswordResetDialog = () => {
    setPasswordResetAdmin(null);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setResetEmailSent(false);
    setShowDirectPasswordSet(false);
    setPasswordSetSuccess(false);
  };

  const handleDirectPasswordSet = async () => {
    if (!passwordResetAdmin) return;
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    setIsSettingPassword(true);
    setPasswordError("");
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-password',
          userId: passwordResetAdmin.id,
          newPassword,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setPasswordSetSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(result.error || "Failed to set password");
      }
    } catch (error) {
      setPasswordError("An unexpected error occurred");
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleCustomerPasswordReset = () => {
    if (!passwordResetCustomer) return;
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    updateCustomerUser(passwordResetCustomer.id, { 
      password: newPassword,
      passwordSet: true 
    });
    setPasswordResetCustomer(null);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleAddCustomerUser = () => {
    const customer = customers.find(c => c.id === newCustomerUser.customerId);
    if (!customer) return;
    
    const user: CustomerUser = {
      id: Date.now().toString(),
      customerId: newCustomerUser.customerId,
      name: newCustomerUser.name || customer.ownerName,
      email: newCustomerUser.email || customer.email,
      createdAt: new Date().toISOString(),
      passwordSet: false,
    };
    addCustomerUser(user);
    setNewCustomerUser({ customerId: "", name: "", email: "" });
    setIsAddCustomerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Administration</h1>
        <p className="text-muted-foreground">
          Manage admin team members and customer portal access
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{adminUsers.length}</p>
              <p className="text-sm text-muted-foreground">Admin Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{displayCustomerUsers.length}</p>
              <p className="text-sm text-muted-foreground">Customer Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <Key className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {displayCustomerUsers.filter(u => u.passwordSet).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Logins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="admin" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admin">Admin Team</TabsTrigger>
          <TabsTrigger value="customers">Customer Access</TabsTrigger>
        </TabsList>

        {/* Admin Users Tab */}
        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Admin Team Members</CardTitle>
                <CardDescription>
                  Staff with access to the admin dashboard
                </CardDescription>
              </div>
              <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Admin User</DialogTitle>
                    <DialogDescription>
                      Add a new team member with admin access
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newAdminUser.name}
                        onChange={(e) => setNewAdminUser({ ...newAdminUser, name: e.target.value })}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newAdminUser.email}
                        onChange={(e) => setNewAdminUser({ ...newAdminUser, email: e.target.value })}
                        placeholder="email@thelaundryboss.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={newAdminUser.role}
                        onValueChange={(value: AdminUser["role"]) => setNewAdminUser({ ...newAdminUser, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {addAdminError && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {addAdminError}
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddAdminOpen(false)} disabled={isAddingAdmin}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddAdminUser} 
                      disabled={!newAdminUser.name || !newAdminUser.email || isAddingAdmin}
                    >
                      {isAddingAdmin ? "Adding..." : "Add User"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">Last Login</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role]}>
                            {user.role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setEditingAdmin(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPasswordResetAdmin(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteAdminUser(user.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Admin Dialog */}
          <Dialog open={!!editingAdmin} onOpenChange={(open) => !open && setEditingAdmin(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Admin User</DialogTitle>
                <DialogDescription>
                  Update admin user details
                </DialogDescription>
              </DialogHeader>
              {editingAdmin && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name / Username</Label>
                    <Input
                      value={editingAdmin.name}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                      placeholder="This is used for login"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editingAdmin.email}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={editingAdmin.role}
                      onValueChange={(value: AdminUser["role"]) => setEditingAdmin({ ...editingAdmin, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingAdmin(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateAdminUser}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Password Reset Dialog */}
          <Dialog open={!!passwordResetAdmin} onOpenChange={(open) => {
            if (!open) {
              closePasswordResetDialog();
            }
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Reset password for {passwordResetAdmin?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {passwordError && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {passwordError}
                  </div>
                )}
                
                {/* Success States */}
                {resetEmailSent && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
                    <p className="font-medium">Password reset email sent!</p>
                    <p className="text-sm mt-1">
                      An email has been sent to <strong>{passwordResetAdmin?.email}</strong> with instructions to reset their password.
                    </p>
                  </div>
                )}
                
                {passwordSetSuccess && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
                    <p className="font-medium">Password updated successfully!</p>
                    <p className="text-sm mt-1">
                      The password for <strong>{passwordResetAdmin?.name}</strong> has been changed.
                    </p>
                  </div>
                )}
                
                {/* Options when not showing success */}
                {!resetEmailSent && !passwordSetSuccess && (
                  <>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-sm"><strong>User:</strong> {passwordResetAdmin?.name}</p>
                      <p className="text-sm"><strong>Email:</strong> {passwordResetAdmin?.email}</p>
                    </div>
                    
                    {!showDirectPasswordSet ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Choose how to reset this user's password:
                        </p>
                        <div className="grid gap-2">
                          <Button 
                            variant="outline" 
                            className="justify-start bg-transparent h-auto py-3"
                            onClick={handlePasswordReset}
                            disabled={isResettingPassword}
                          >
                            <Mail className="mr-3 h-4 w-4" />
                            <div className="text-left">
                              <div className="font-medium">{isResettingPassword ? "Sending..." : "Send Reset Email"}</div>
                              <div className="text-xs text-muted-foreground">User receives email to set new password</div>
                            </div>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="justify-start bg-transparent h-auto py-3"
                            onClick={() => setShowDirectPasswordSet(true)}
                          >
                            <Key className="mr-3 h-4 w-4" />
                            <div className="text-left">
                              <div className="font-medium">Set Password Directly</div>
                              <div className="text-xs text-muted-foreground">Enter a new password for this user</div>
                            </div>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 6 characters long.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
              <DialogFooter>
                {(resetEmailSent || passwordSetSuccess) ? (
                  <Button onClick={closePasswordResetDialog}>
                    Done
                  </Button>
                ) : showDirectPasswordSet ? (
                  <>
                    <Button variant="outline" className="bg-transparent" onClick={() => setShowDirectPasswordSet(false)}>
                      Back
                    </Button>
                    <Button onClick={handleDirectPasswordSet} disabled={isSettingPassword || !newPassword || !confirmPassword}>
                      {isSettingPassword ? "Setting..." : "Set Password"}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="bg-transparent" onClick={closePasswordResetDialog}>
                    Cancel
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Customer Users Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Customer Portal Access</CardTitle>
                <CardDescription>
                  Customer accounts for tracking their onboarding progress
                </CardDescription>
              </div>
              <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Customer User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Customer User</DialogTitle>
                    <DialogDescription>
                      Create portal access for a customer
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Customer</Label>
                      <Select
                        value={newCustomerUser.customerId}
                        onValueChange={(value) => {
                          const customer = customers.find(c => c.id === value);
                          setNewCustomerUser({
                            customerId: value,
                            name: customer?.ownerName || "",
                            email: customer?.email || "",
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.businessName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newCustomerUser.name}
                        onChange={(e) => setNewCustomerUser({ ...newCustomerUser, name: e.target.value })}
                        placeholder="User's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newCustomerUser.email}
                        onChange={(e) => setNewCustomerUser({ ...newCustomerUser, email: e.target.value })}
                        placeholder="user@example.com"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddCustomerOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCustomerUser} disabled={!newCustomerUser.customerId}>
                      Create User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Last Login</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayCustomerUsers.map((user) => {
                      const customer = customers.find(c => c.id === user.customerId);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {customer?.businessName || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.passwordSet ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending Setup</Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setCurrentCustomerUser(user);
                                    router.push("/portal/dashboard");
                                  }}
                                >
                                  <LogIn className="mr-2 h-4 w-4" />
                                  Login as Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Credentials
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setPasswordResetCustomer(user)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => deleteCustomerUser(user.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Customer Password Reset Dialog */}
          <Dialog open={!!passwordResetCustomer} onOpenChange={(open) => {
            if (!open) {
              setPasswordResetCustomer(null);
              setNewPassword("");
              setConfirmPassword("");
              setPasswordError("");
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Customer Password</DialogTitle>
                <DialogDescription>
                  Set a new password for {passwordResetCustomer?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {passwordError && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {passwordError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPasswordResetCustomer(null)}>
                  Cancel
                </Button>
                <Button onClick={handleCustomerPasswordReset} disabled={!newPassword || !confirmPassword}>
                  Update Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
