'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Pencil, Trash2 } from 'lucide-react'
import type { Employee, PrivilegeLevel } from '@/lib/types'

const PRIVILEGE_LEVELS: { value: PrivilegeLevel; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Full access to perform all functions' },
  { value: 'attendant', label: 'Attendant', description: 'Can free start machines and limited access' },
  { value: 'employee', label: 'Employee', description: 'Can only clock in and out' },
]

export function EmployeeSetupStep() {
  const { formData, addEmployee, updateEmployee, removeEmployee, nextStep, prevStep } = useOnboardingStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    privilegeLevel: 'employee',
  })

  const resetForm = () => {
    setNewEmployee({
      privilegeLevel: 'employee',
    })
    setEditingEmployee(null)
  }

  const handleSave = () => {
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, newEmployee)
    } else {
      const employee: Employee = {
        id: crypto.randomUUID(),
        name: newEmployee.name || '',
        phone: newEmployee.phone || '',
        pin: newEmployee.pin || '',
        privilegeLevel: newEmployee.privilegeLevel as PrivilegeLevel,
      }
      addEmployee(employee)
    }
    setIsDialogOpen(false)
    resetForm()
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setNewEmployee(employee)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    removeEmployee(id)
  }

  const isFormValid = newEmployee.name && newEmployee.phone && newEmployee.pin && newEmployee.pin.length === 4

  const getPrivilegeBadgeVariant = (level: PrivilegeLevel) => {
    switch (level) {
      case 'admin':
        return 'default'
      case 'attendant':
        return 'secondary'
      case 'employee':
        return 'outline'
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Employee Setup</CardTitle>
              <CardDescription>Add employees who will use the Laundry Boss dashboard</CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                <DialogDescription>
                  Enter employee details and assign their privilege level.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="empName">Name *</Label>
                  <Input
                    id="empName"
                    placeholder="John Doe"
                    value={newEmployee.name || ''}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empPhone">Phone Number *</Label>
                  <Input
                    id="empPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={newEmployee.phone || ''}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empPin">4-Digit PIN *</Label>
                  <Input
                    id="empPin"
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={newEmployee.pin || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setNewEmployee({ ...newEmployee, pin: value })
                    }}
                  />
                  <p className="text-sm text-muted-foreground">Used to log in to the dashboard</p>
                </div>
                <div className="space-y-2">
                  <Label>Privilege Level *</Label>
                  <Select
                    value={newEmployee.privilegeLevel}
                    onValueChange={(value: PrivilegeLevel) => setNewEmployee({ ...newEmployee, privilegeLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIVILEGE_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <span className="font-medium">{level.label}</span>
                            <span className="text-muted-foreground ml-2">- {level.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!isFormValid}>
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Privilege Level Info */}
          <div className="grid gap-3 sm:grid-cols-3">
            {PRIVILEGE_LEVELS.map((level) => (
              <div key={level.value} className="p-3 rounded-lg border border-border bg-muted/30">
                <Badge variant={getPrivilegeBadgeVariant(level.value)} className="mb-2">
                  {level.label}
                </Badge>
                <p className="text-sm text-muted-foreground">{level.description}</p>
              </div>
            ))}
          </div>

          {formData.employees.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No employees added yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add employees who will need access to the Laundry Boss dashboard.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Employee
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Privilege Level</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell className="font-mono">****</TableCell>
                      <TableCell>
                        <Badge variant={getPrivilegeBadgeVariant(employee.privilegeLevel)}>
                          {employee.privilegeLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(employee)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button onClick={nextStep}>
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
