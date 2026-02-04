// Onboarding Stages and Tasks based on Zoho Project structure

export interface OnboardingTask {
  id: string
  name: string
  team: string[]
  priority: 'low' | 'medium' | 'high'
  description?: string
  customerVisible?: boolean // Whether this task is visible to the customer
}

export interface OnboardingStage {
  id: string
  name: string
  shortName: string
  tasks: OnboardingTask[]
}

export const ONBOARDING_STAGES: OnboardingStage[] = [
  {
    id: 'contract_setup',
    name: 'Contract & Setup',
    shortName: 'Contract',
    tasks: [
      { id: 'confirm_data', name: 'Confirm Data', team: ['Sales', 'Onboarding'], priority: 'high', customerVisible: true },
      { id: 'send_contract', name: 'Send Contract', team: ['Sales', 'Onboarding'], priority: 'high', customerVisible: true },
      { id: 'confirm_contract_sent', name: 'Confirm Contract Sent to Vicki', team: ['Operations', 'Onboarding'], priority: 'high' },
      { id: 'send_welcome_packet', name: 'Send Welcome Packet to Customer', team: ['Onboarding'], priority: 'high', customerVisible: true },
      { id: 'inventory_check', name: 'Inventory Check', team: ['Operations'], priority: 'high' },
      { id: 'add_customer_cp', name: 'Add Customer in CP', team: ['Operations'], priority: 'high' },
      { id: 'add_customer_salesforce', name: 'Add Customer in Salesforce', team: ['Operations'], priority: 'high' },
      { id: 'add_contact_zoom', name: 'Add Contact(s) to Zoom List', team: ['Operations'], priority: 'high' },
    ]
  },
  {
    id: 'internal_kickoff',
    name: 'Internal Kickoff',
    shortName: 'Kickoff',
    tasks: [
      { id: 'schedule_internal_kickoff', name: 'Schedule Internal Kickoff Call', team: ['Onboarding'], priority: 'high' },
      { id: 'host_internal_call', name: 'Host Internal Call', team: ['Onboarding'], priority: 'high' },
      { id: 'confirm_matterport_complete', name: 'Confirm if Matterport is Complete', team: ['Onboarding'], priority: 'high', customerVisible: true },
      { id: 'send_matterport', name: 'Send Matterport to Shop and Customer', team: ['Production', 'Onboarding'], priority: 'high', customerVisible: true },
      { id: 'send_customer_kickoff_email', name: 'Send Customer Kickoff Email', team: ['Onboarding'], priority: 'high', customerVisible: true },
      { id: 'confirm_date_of_call', name: 'Confirm Date of Call', team: ['Onboarding'], priority: 'high', customerVisible: true },
      { id: 'hold_kickoff_call', name: 'Hold Kickoff Call', team: ['Onboarding'], priority: 'high', customerVisible: true },
    ]
  },
  {
    id: 'planning_layout',
    name: 'Planning & Layout',
    shortName: 'Planning',
    tasks: [
      { id: 'review_matterport_machine_list', name: 'Review Matterport and Machine List', team: ['Operations', 'Onboarding'], priority: 'high', customerVisible: true },
      { id: 'draft_location_layout', name: 'Draft Location Layout', team: ['Operations'], priority: 'high', customerVisible: true },
      { id: 'get_written_approval', name: 'Get WRITTEN Customer Approval', team: ['Onboarding'], priority: 'high', customerVisible: true },
      { id: 'prepare_docs_production', name: 'Prepare Docs for Production Submittal', team: ['Onboarding'], priority: 'high' },
      { id: 'prepare_work_order', name: 'Prepare Work Order for Approval', team: ['Production'], priority: 'high' },
      { id: 'work_order_issued', name: 'Work Order Issued', team: ['Production'], priority: 'high', customerVisible: true },
    ]
  },
  {
    id: 'production',
    name: 'Production',
    shortName: 'Production',
    tasks: [
      { id: 'mibs', name: 'MIBs', team: ['Production'], priority: 'medium', description: 'Dip, Flash, Label and Test MIBs for location' },
      { id: 'wire_harnesses', name: 'Wire Harnesses', team: ['Production'], priority: 'medium', description: 'Gather and/or Build Wire Harnesses' },
      { id: 'network_equipment', name: 'Network Equipment & Board Set-Up', team: ['Production'], priority: 'medium' },
      { id: 'kiosk_setup', name: 'Kiosk Setup (if applicable)', team: ['Production'], priority: 'medium' },
      { id: 'pos_setup', name: 'POS Setup (if applicable)', team: ['Production'], priority: 'medium' },
      { id: 'add_machine_groups', name: 'Add Machine Groups/Lists', team: ['Production'], priority: 'medium' },
      { id: 'enter_employee_info', name: 'Enter Employee Information', team: ['Operations'], priority: 'medium', customerVisible: true },
      { id: 'add_products', name: 'Add Products (if applicable)', team: ['Operations'], priority: 'medium' },
      { id: 'move_qrs', name: 'Move QRs to Customer Folder', team: ['Operations'], priority: 'high' },
      { id: 'send_qrs_printer', name: 'Send QRs to Printer', team: ['Production'], priority: 'high' },
    ]
  },
  {
    id: 'pre_ship',
    name: 'Pre-Ship',
    shortName: 'Pre-Ship',
    tasks: [
      { id: 'create_merchant_account', name: 'Create Merchant Account in Copilot/Send Application', team: ['Operations'], priority: 'high', customerVisible: true },
      { id: 'send_login_credentials', name: 'Send Login Credentials to Customer', team: ['Operations'], priority: 'medium', customerVisible: true },
      { id: 'confirm_dashboard_completion', name: 'Confirm Dashboard Completion', team: ['Onboarding'], priority: 'high', customerVisible: true },
      { id: 'confirm_merchant_boarded', name: 'Confirm Merchant Account Boarded', team: ['Onboarding'], priority: 'high', customerVisible: true },
      { id: 'onboarding_manager_communication', name: 'Onboarding Manager Communication to Customer', team: ['Onboarding'], priority: 'high', customerVisible: true },
      { id: 'install_date_shared', name: 'Install Date Shared with Company via Email', team: ['Onboarding'], priority: 'medium', customerVisible: true },
      { id: 'travel_arrangements', name: 'Travel Arrangements', team: ['Onboarding'], priority: 'high' },
    ]
  },
  {
    id: 'shipment',
    name: 'Shipment',
    shortName: 'Shipment',
    tasks: [
      { id: 'shipment_review_checklist', name: 'Perform Shipment Review Checklist', team: ['Production', 'Operations', 'Onboarding'], priority: 'high' },
      { id: 'shipment_triggered', name: 'Shipment Triggered', team: ['Production', 'Operations'], priority: 'high', customerVisible: true },
      { id: 'tracking_sent', name: 'Tracking Sent to Customer', team: ['Onboarding'], priority: 'high', customerVisible: true },
    ]
  },
  {
    id: 'installation',
    name: 'Installation',
    shortName: 'Install',
    tasks: [
      { id: 'pre_install_walkthrough', name: 'Pre-Install Walk-through and Testing', team: ['Operations', 'Onboarding'], priority: 'high', customerVisible: true },
      { id: 'install_network_board', name: 'Install Network Board', team: ['Operations', 'Onboarding'], priority: 'medium' },
      { id: 'install_broadcasting_mibs', name: 'Install Broadcasting MIBs', team: ['Operations', 'Onboarding'], priority: 'medium' },
      { id: 'install_washer_mibs', name: 'Install Washer MIBs', team: ['Operations', 'Onboarding'], priority: 'medium' },
      { id: 'test_washers', name: 'Test Washers', team: ['Operations', 'Onboarding'], priority: 'high', customerVisible: true },
      { id: 'install_dryer_mibs', name: 'Install Dryer MIBs', team: ['Operations', 'Onboarding'], priority: 'medium' },
      { id: 'test_dryers', name: 'Test Dryers', team: ['Operations', 'Onboarding'], priority: 'high', customerVisible: true },
      { id: 'install_kiosk', name: 'Install Kiosk (if applicable)', team: ['Operations', 'Onboarding'], priority: 'medium' },
      { id: 'complete_post_install_checklist', name: 'Complete Post-Install Checklist', team: ['Operations', 'Onboarding'], priority: 'high', customerVisible: true },
      { id: 'provide_training', name: 'Provide Training', team: ['Operations', 'Onboarding'], priority: 'high', customerVisible: true },
      { id: 'post_install_walkthrough', name: 'Do Post-Install Walkthrough w/ Owner', team: ['Operations', 'Onboarding'], priority: 'high', customerVisible: true },
    ]
  },
  {
    id: 'post_go_live',
    name: 'Post Go-Live',
    shortName: 'Go-Live',
    tasks: [
      { id: 'tlb_installation', name: 'TLB Installation', team: ['Onboarding'], priority: 'high', customerVisible: true },
      { id: 'cloudwork_pro', name: 'CloudworkPro', team: ['Onboarding'], priority: 'high' },
      { id: 'add_pin_maps', name: 'Add Pin in Conference Room Map & Google Maps', team: ['Onboarding'], priority: 'low' },
      { id: 'upload_matterport_google', name: 'Upload Matterport to Google Maps', team: ['Sales'], priority: 'high' },
      { id: 'two_three_week_checkin', name: '2-3 Week Check-In', team: ['Onboarding'], priority: 'high', customerVisible: true },
    ]
  },
]

// Get total task count
export const getTotalTaskCount = (): number => {
  return ONBOARDING_STAGES.reduce((sum, stage) => sum + stage.tasks.length, 0)
}

// Get customer-visible tasks only
export const getCustomerVisibleTasks = (): OnboardingTask[] => {
  return ONBOARDING_STAGES.flatMap(stage => 
    stage.tasks.filter(task => task.customerVisible)
  )
}

// Get stage by ID
export const getStageById = (stageId: string): OnboardingStage | undefined => {
  return ONBOARDING_STAGES.find(s => s.id === stageId)
}

// Get current stage index based on completed tasks
export const getCurrentStageIndex = (completedTaskIds: string[]): number => {
  for (let i = ONBOARDING_STAGES.length - 1; i >= 0; i--) {
    const stage = ONBOARDING_STAGES[i]
    const stageTasks = stage.tasks.map(t => t.id)
    const hasCompletedTasksInStage = stageTasks.some(taskId => completedTaskIds.includes(taskId))
    if (hasCompletedTasksInStage) {
      // Check if stage is fully complete
      const allComplete = stageTasks.every(taskId => completedTaskIds.includes(taskId))
      return allComplete ? Math.min(i + 1, ONBOARDING_STAGES.length - 1) : i
    }
  }
  return 0
}

// Calculate overall progress percentage
export const calculateProgress = (completedTaskIds: string[]): number => {
  const totalTasks = getTotalTaskCount()
  if (totalTasks === 0) return 0
  return Math.round((completedTaskIds.length / totalTasks) * 100)
}

// Calculate stage progress
export const calculateStageProgress = (stageId: string, completedTaskIds: string[]): number => {
  const stage = getStageById(stageId)
  if (!stage) return 0
  const stageTasks = stage.tasks.map(t => t.id)
  const completedInStage = stageTasks.filter(taskId => completedTaskIds.includes(taskId)).length
  return Math.round((completedInStage / stageTasks.length) * 100)
}

// Get default task statuses for a new customer
export const getDefaultTaskStatuses = (): Record<string, 'not_started' | 'in_progress' | 'complete'> => {
  const statuses: Record<string, 'not_started' | 'in_progress' | 'complete'> = {}
  ONBOARDING_STAGES.forEach(stage => {
    stage.tasks.forEach(task => {
      statuses[task.id] = 'not_started'
    })
  })
  return statuses
}
