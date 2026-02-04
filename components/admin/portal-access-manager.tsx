"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Mail, Key, User, Clock, RefreshCw, Lock, Send } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CustomerUser {
  id: string
  customerId: string
  name: string
  email: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  passwordSet?: boolean
}

interface PortalAccessManagerProps {
  customerId: string
  customerEmail: string
  customerName: string
}

export function PortalAccessManager({ customerId, customerEmail, customerName }: PortalAccessManagerProps) {
  const [users, setUsers] = useState<CustomerUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "owner",
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [passwordResetUser, setPasswordResetUser] = useState<CustomerUser | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch users on mount and when customerId changes
  useEffect(() => {
    fetchUsers()
  }, [customerId])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/customer-users?customerId=${customerId}`)
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users || [])
      } else {
        setError(data.error || "Failed to fetch users")
      }
    } catch (err) {
      setError("Failed to fetch users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError("All fields are required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/customer-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setUsers([data.user, ...users])
        setIsAddingUser(false)
        setNewUser({ name: "", email: "", password: "", role: "owner" })
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (err) {
      setError("Failed to create user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserId) return

    try {
      const response = await fetch("/api/admin/customer-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteUserId }),
      })

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== deleteUserId))
        setDeleteUserId(null)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete user")
      }
    } catch (err) {
      setError("Failed to delete user")
    }
  }

  const openAddWithDefaults = () => {
    setNewUser({
      name: customerName || "",
      email: customerEmail || "",
      password: "",
      role: "owner",
    })
    setIsAddingUser(true)
    setError(null)
  }

  const handleSetPassword = async () => {
    if (!passwordResetUser || !newPassword) {
      setError("Password is required")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/portal/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-password",
          userId: passwordResetUser.id,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordResetUser(null)
        setNewPassword("")
        setSuccessMessage(`Password updated for ${passwordResetUser.name}`)
        setTimeout(() => setSuccessMessage(null), 5000)
        fetchUsers() // Refresh to update passwordSet status
      } else {
        setError(data.error || "Failed to set password")
      }
    } catch (err) {
      setError("Failed to set password")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendResetEmail = async (user: CustomerUser) => {
    setIsSendingReset(true)
    setError(null)

    try {
      const response = await fetch("/api/portal/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-reset-email",
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage(`Password reset email sent to ${user.email}`)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setError(data.error || "Failed to send reset email")
      }
    } catch (err) {
      setError("Failed to send reset email")
    } finally {
      setIsSendingReset(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-600 rounded-lg p-3 text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* Add User Button */}
      <div className="flex justify-end">
        <Button onClick={openAddWithDefaults}>
          <Plus className="mr-2 h-4 w-4" />
          Add Portal User
        </Button>
      </div>

      {/* Users List */}
      {users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{user.name}</span>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                    {user.passwordSet && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Key className="h-3 w-3 mr-1" />
                        Password Set
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                    {user.lastLoginAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Key className="mr-2 h-4 w-4" />
                    Password
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPasswordResetUser(user)}>
                    <Lock className="mr-2 h-4 w-4" />
                    Set New Password
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSendResetEmail(user)}
                    disabled={isSendingReset}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Reset Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteUserId(user.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Portal Users</h3>
          <p className="text-muted-foreground mb-4">
            Add a user to allow access to the customer portal
          </p>
          <Button onClick={openAddWithDefaults}>
            <Plus className="mr-2 h-4 w-4" />
            Add First User
          </Button>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Portal User</DialogTitle>
            <DialogDescription>
              Create a new user who can access the customer portal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingUser(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this portal user? They will no longer be able to access the customer portal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={!!passwordResetUser} onOpenChange={(open) => { if (!open) { setPasswordResetUser(null); setNewPassword(""); setError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set New Password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordResetUser?.name} ({passwordResetUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordResetUser(null); setNewPassword(""); setError(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSetPassword} disabled={isSubmitting}>
              {isSubmitting ? "Setting Password..." : "Set Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
