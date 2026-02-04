-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'not_started',
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 11,
  
  -- Onboarding
  onboarding_token TEXT UNIQUE,
  onboarding_started BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Location info (JSONB for flexibility)
  location_info JSONB,
  
  -- Shipping info
  shipping_info JSONB,
  
  -- PCI Compliance
  pci_compliance JSONB,
  
  -- Kiosk info
  kiosk_info JSONB,
  
  -- Merchant account
  merchant_account JSONB,
  
  -- Billing info
  billing_info JSONB,
  
  -- Store media (photos/videos)
  store_media JSONB DEFAULT '[]'::jsonb,
  
  -- Onboarding sections
  sections JSONB,
  
  -- Dashboard credentials
  dashboard_credentials JSONB,
  
  -- Saved onboarding data for resume
  saved_onboarding_data JSONB,
  
  -- Payment links
  payment_links JSONB DEFAULT '[]'::jsonb,
  
  -- Assigned admin user
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Notes stored separately but we keep a count
  notes_count INTEGER DEFAULT 0
);

-- Machines table
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  machine_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'washer' or 'dryer'
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  capacity TEXT,
  price DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  location_in_store TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  privilege_level TEXT DEFAULT 'standard',
  pin TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer notes table
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
-- Admins can see all customers
CREATE POLICY "admins_select_customers" ON public.customers 
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.admin_profiles));

CREATE POLICY "admins_insert_customers" ON public.customers 
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.admin_profiles));

CREATE POLICY "admins_update_customers" ON public.customers 
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.admin_profiles));

CREATE POLICY "admins_delete_customers" ON public.customers 
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.admin_profiles));

-- Allow public access via onboarding token (for customer onboarding)
CREATE POLICY "public_select_by_token" ON public.customers 
  FOR SELECT USING (onboarding_token IS NOT NULL);

CREATE POLICY "public_update_by_token" ON public.customers 
  FOR UPDATE USING (onboarding_token IS NOT NULL);

-- RLS Policies for machines
CREATE POLICY "admins_all_machines" ON public.machines 
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_profiles));

CREATE POLICY "public_machines_by_customer_token" ON public.machines 
  FOR ALL USING (
    customer_id IN (SELECT id FROM public.customers WHERE onboarding_token IS NOT NULL)
  );

-- RLS Policies for employees
CREATE POLICY "admins_all_employees" ON public.employees 
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_profiles));

CREATE POLICY "public_employees_by_customer_token" ON public.employees 
  FOR ALL USING (
    customer_id IN (SELECT id FROM public.customers WHERE onboarding_token IS NOT NULL)
  );

-- RLS Policies for customer_notes
CREATE POLICY "admins_all_notes" ON public.customer_notes 
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_profiles));

-- RLS Policies for admin_profiles
CREATE POLICY "admins_select_profiles" ON public.admin_profiles 
  FOR SELECT USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM public.admin_profiles));

CREATE POLICY "admins_update_own_profile" ON public.admin_profiles 
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for tasks
CREATE POLICY "admins_all_tasks" ON public.tasks 
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_profiles));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_onboarding_token ON public.customers(onboarding_token);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_machines_customer_id ON public.machines(customer_id);
CREATE INDEX IF NOT EXISTS idx_employees_customer_id ON public.employees(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON public.customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON public.tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON public.machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_notes_updated_at BEFORE UPDATE ON public.customer_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
