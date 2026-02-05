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
import { WashingMachine, Plus, Pencil, Trash2, Copy } from 'lucide-react'
import type { Machine, MachineType, CoinType } from '@/lib/types'

const MACHINE_MAKES = ['Fagor', 'Domus', 'Electrolux', 'IPSO', 'ADC', 'Speed Queen', 'Dexter', 'Maytag', 'Continental', 'Wascomat', 'UniMac', 'Huebsch', 'Other']

// Default pricing values
const DEFAULT_PRICING = {
  cold: 5.00,
  warm: 5.50,
  hot: 6.00,
  standard: 0.25, // For dryers
}

export function MachineInventoryStep() {
  const { formData, addMachine, updateMachine, removeMachine, nextStep, prevStep } = useOnboardingStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null)
  const [cloneCount, setCloneCount] = useState(1)
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [machineToClone, setMachineToClone] = useState<Machine | null>(null)
  const [otherMake, setOtherMake] = useState('')
  const [newMachine, setNewMachine] = useState<Partial<Machine>>({
    type: 'washer',
    coinsAccepted: 'quarter',
    pricing: { cold: DEFAULT_PRICING.cold, warm: DEFAULT_PRICING.warm, hot: DEFAULT_PRICING.hot },
  })

  const resetForm = () => {
    setNewMachine({
      type: 'washer',
      coinsAccepted: 'quarter',
      pricing: { cold: DEFAULT_PRICING.cold, warm: DEFAULT_PRICING.warm, hot: DEFAULT_PRICING.hot },
    })
    setEditingMachine(null)
    setOtherMake('')
  }

  // Get next machine number based on type (Washers: 1-99, Dryers: 101-199)
  const getNextMachineNumber = (type: MachineType): number => {
    const existingMachines = formData.machines.filter(m => m.type === type)
    const baseNumber = type === 'washer' ? 1 : 101
    const maxNumber = type === 'washer' ? 99 : 199
    
    if (existingMachines.length === 0) {
      return baseNumber
    }
    
    const usedNumbers = existingMachines.map(m => m.machineNumber)
    for (let i = baseNumber; i <= maxNumber; i++) {
      if (!usedNumbers.includes(i)) {
        return i
      }
    }
    return existingMachines.length + baseNumber
  }

  const handleSave = () => {
    const finalMake = newMachine.make === 'Other' ? otherMake : (newMachine.make || '')
    
    if (editingMachine) {
      updateMachine(editingMachine.id, { ...newMachine, make: finalMake })
    } else {
      const machineType = newMachine.type as MachineType
      const machine: Machine = {
        id: crypto.randomUUID(),
        machineNumber: getNextMachineNumber(machineType),
        type: machineType,
        make: finalMake,
        model: newMachine.model || '',
        serialNumber: newMachine.serialNumber || '',
        coinsAccepted: newMachine.coinsAccepted as CoinType,
        pricing: newMachine.pricing || {},
        afterMarketUpgrades: newMachine.afterMarketUpgrades,
      }
      addMachine(machine)
    }
    setIsDialogOpen(false)
    resetForm()
  }

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine)
    // Check if the make is in the standard list or is a custom "Other" value
    const isStandardMake = MACHINE_MAKES.includes(machine.make)
    if (isStandardMake) {
      setNewMachine(machine)
      setOtherMake('')
    } else {
      setNewMachine({ ...machine, make: 'Other' })
      setOtherMake(machine.make)
    }
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    removeMachine(id)
  }

  const handleCloneClick = (machine: Machine) => {
    setMachineToClone(machine)
    setCloneCount(1)
    setShowCloneDialog(true)
  }

  const handleClone = () => {
    if (!machineToClone) return
    
    const machineType = machineToClone.type
    // Dryers start at 101 (100 is reserved for super admin override only)
    const baseNumber = machineType === 'washer' ? 1 : 101
    const maxNumber = machineType === 'washer' ? 99 : 199
    
    // Get all used numbers for this type
    const usedNumbers = new Set(
      formData.machines.filter(m => m.type === machineType).map(m => m.machineNumber)
    )
    
    let clonedCount = 0
    for (let num = baseNumber; num <= maxNumber && clonedCount < cloneCount; num++) {
      if (!usedNumbers.has(num)) {
        const clonedMachine: Machine = {
          ...machineToClone,
          id: crypto.randomUUID(),
          machineNumber: num,
          serialNumber: '', // Clear serial number as it must be unique
        }
        addMachine(clonedMachine)
        usedNumbers.add(num)
        clonedCount++
      }
    }
    
    setShowCloneDialog(false)
    setMachineToClone(null)
    setCloneCount(1)
  }

  const isFormValid = (newMachine.make === 'Other' ? otherMake : newMachine.make) && newMachine.model

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <WashingMachine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Machine Inventory</CardTitle>
              <CardDescription>Add all washers and dryers at your location</CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Machine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMachine ? 'Edit Machine' : 'Add New Machine'}</DialogTitle>
                <DialogDescription>
                  Enter the details for this machine. Fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Machine Type *</Label>
                    <Select
                      value={newMachine.type}
                      onValueChange={(value: MachineType) => {
                        const pricing = value === 'washer' 
                          ? { cold: DEFAULT_PRICING.cold, warm: DEFAULT_PRICING.warm, hot: DEFAULT_PRICING.hot }
                          : { standard: DEFAULT_PRICING.standard }
                        setNewMachine({ ...newMachine, type: value, pricing })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="washer">Washer</SelectItem>
                        <SelectItem value="dryer">Dryer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Make *</Label>
                    <Select
                      value={newMachine.make}
                      onValueChange={(value) => {
                        setNewMachine({ ...newMachine, make: value })
                        if (value !== 'Other') setOtherMake('')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select manufacturer" />
                      </SelectTrigger>
                      <SelectContent>
                        {MACHINE_MAKES.map((make) => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newMachine.make === 'Other' && (
                      <Input
                        placeholder="Enter manufacturer name"
                        value={otherMake}
                        onChange={(e) => setOtherMake(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Model Number *</Label>
                    <Input
                      placeholder="e.g., SFNNCAJP113TW"
                      value={newMachine.model || ''}
                      onChange={(e) => setNewMachine({ ...newMachine, model: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input
                      placeholder="e.g., 0165890565"
                      value={newMachine.serialNumber || ''}
                      onChange={(e) => setNewMachine({ ...newMachine, serialNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coins Accepted</Label>
                    <Select
                      value={newMachine.coinsAccepted}
                      onValueChange={(value: CoinType) => setNewMachine({ ...newMachine, coinsAccepted: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quarter">Quarter</SelectItem>
                        <SelectItem value="dollar">Dollar</SelectItem>
                        <SelectItem value="token">Token</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>After Market Upgrades</Label>
                    <Input
                      placeholder="e.g., N/A"
                      value={newMachine.afterMarketUpgrades || ''}
                      onChange={(e) => setNewMachine({ ...newMachine, afterMarketUpgrades: e.target.value })}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-medium">Pricing</Label>
                  {newMachine.type === 'washer' ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Cold ($)</Label>
                        <Input
                          type="number"
                          step="0.25"
                          placeholder="5.00"
                          value={newMachine.pricing?.cold ?? DEFAULT_PRICING.cold}
                          onChange={(e) => setNewMachine({
                            ...newMachine,
                            pricing: { ...newMachine.pricing, cold: parseFloat(e.target.value) || 0 }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Warm ($)</Label>
                        <Input
                          type="number"
                          step="0.25"
                          placeholder="5.50"
                          value={newMachine.pricing?.warm ?? DEFAULT_PRICING.warm}
                          onChange={(e) => setNewMachine({
                            ...newMachine,
                            pricing: { ...newMachine.pricing, warm: parseFloat(e.target.value) || 0 }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Hot ($)</Label>
                        <Input
                          type="number"
                          step="0.25"
                          placeholder="6.00"
                          value={newMachine.pricing?.hot ?? DEFAULT_PRICING.hot}
                          onChange={(e) => setNewMachine({
                            ...newMachine,
                            pricing: { ...newMachine.pricing, hot: parseFloat(e.target.value) || 0 }
                          })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-w-xs">
                      <Label className="text-sm text-muted-foreground">Standard Price ($)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        placeholder="0.25"
                        value={newMachine.pricing?.standard ?? DEFAULT_PRICING.standard}
                        onChange={(e) => setNewMachine({
                          ...newMachine,
                          pricing: { standard: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!isFormValid}>
                  {editingMachine ? 'Update' : 'Add'} Machine
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {formData.machines.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <WashingMachine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No machines added yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your washers and dryers to continue with the onboarding process.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Machine
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Make</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Serial #</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.machines.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell className="font-medium">{machine.machineNumber}</TableCell>
                      <TableCell className="capitalize">{machine.type}</TableCell>
                      <TableCell>{machine.make}</TableCell>
                      <TableCell className="font-mono text-sm">{machine.model}</TableCell>
                      <TableCell>
                        <Input
                          className="font-mono text-sm h-8 w-32"
                          value={machine.serialNumber || ''}
                          onChange={(e) => updateMachine(machine.id, { serialNumber: e.target.value })}
                          placeholder="Enter S/N"
                        />
                      </TableCell>
                      <TableCell className="capitalize">{machine.coinsAccepted}</TableCell>
                      <TableCell>
                        {machine.type === 'washer' ? (
                          <span className="text-sm">
                            {machine.pricing.cold && `C:$${machine.pricing.cold} `}
                            {machine.pricing.warm && `W:$${machine.pricing.warm} `}
                            {machine.pricing.hot && `H:$${machine.pricing.hot}`}
                          </span>
                        ) : (
                          <span className="text-sm">
                            {machine.pricing.standard ? `$${machine.pricing.standard}` : '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(machine)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-lb-blue hover:text-lb-cyan"
                            onClick={() => handleCloneClick(machine)}
                            title="Clone"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(machine.id)}
                            title="Delete"
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

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Important Note</p>
            <p>Any inaccurate information provided can result in installation issues/delays, additional shipping, and expedited change fees. Please verify all machine details carefully.</p>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button onClick={nextStep} disabled={formData.machines.length === 0}>
              Continue
            </Button>
          </div>
        </div>

        {/* Clone Dialog */}
        <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Clone Machine</DialogTitle>
              <DialogDescription>
                Create copies of this {machineToClone?.type} with the same settings. Serial numbers will need to be entered separately.
              </DialogDescription>
            </DialogHeader>
            {machineToClone && (
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium text-foreground">Machine to Clone:</p>
                  <p className="text-muted-foreground capitalize">
                    {machineToClone.type} - {machineToClone.make} {machineToClone.model}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Number of Similar Machine Types and Sizes</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={cloneCount}
                    onChange={(e) => setCloneCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will add {cloneCount} new {machineToClone.type}{cloneCount > 1 ? 's' : ''} with the same settings.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCloneDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleClone}>
                <Copy className="h-4 w-4 mr-2" />
                Clone {cloneCount} Machine{cloneCount > 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
