-- ==============================================================================
-- THE 1ST STEP METHOD - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Table: reservations
-- Stores student cohort reservations, personal details (first name, last name, age, 
-- cellphone / WhatsApp number), and seat booking metadata.
-- ==============================================================================

-- 1. Enable UUID Extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Reservations Table
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Student Personal Details
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
    cellphone_number TEXT NOT NULL, -- WhatsApp / Mobile Number (Required)
    email TEXT,
    
    -- Seat & Cohort Details
    cohort TEXT NOT NULL DEFAULT 'Cohort 01',
    row TEXT NOT NULL,               -- e.g. 'A', 'B', 'C', 'D', 'E', 'F'
    seat INTEGER NOT NULL,            -- e.g. 1 through 18
    seat_label TEXT GENERATED ALWAYS AS (row || seat::TEXT) STORED,
    
    -- Financial & Reservation Status
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'free_claim', 'cancelled', 'refunded')),
    payment_reference TEXT UNIQUE,    -- Paystack reference or unique claim hash
    
    -- Additional Metadata (Discord tag, university, device, etc.)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),

    -- Prevent duplicate seat reservations per cohort when confirmed or pending
    CONSTRAINT unique_seat_per_cohort UNIQUE (cohort, row, seat)
);

-- 3. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::TEXT, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reservations_updated_at ON public.reservations;
CREATE TRIGGER trigger_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_cellphone ON public.reservations (cellphone_number);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON public.reservations (email);
CREATE INDEX IF NOT EXISTS idx_reservations_cohort_seat ON public.reservations (cohort, row, seat);
CREATE INDEX IF NOT EXISTS idx_reservations_payment_ref ON public.reservations (payment_reference);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations (created_at DESC);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Allow public read of reserved seat positions (without exposing private contact details to unauthenticated users)
DROP POLICY IF EXISTS "Public can view booked seats" ON public.reservations;
CREATE POLICY "Public can view booked seats" 
    ON public.reservations 
    FOR SELECT 
    USING (payment_status IN ('confirmed', 'free_claim'));

-- Allow inserting reservations (via client form or Paystack hook)
DROP POLICY IF EXISTS "Allow reservation insert" ON public.reservations;
CREATE POLICY "Allow reservation insert" 
    ON public.reservations 
    FOR INSERT 
    WITH CHECK (true);

-- Allow full management by service role (backend Node.js server)
DROP POLICY IF EXISTS "Service role full access" ON public.reservations;
CREATE POLICY "Service role full access" 
    ON public.reservations 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- 6. Helper View: Public Occupied Seat Grid (Hides PII like phone & age)
CREATE OR REPLACE VIEW public.vw_occupied_seats AS
SELECT 
    cohort,
    row,
    seat,
    seat_label,
    payment_status,
    created_at
FROM public.reservations
WHERE payment_status IN ('confirmed', 'free_claim');
