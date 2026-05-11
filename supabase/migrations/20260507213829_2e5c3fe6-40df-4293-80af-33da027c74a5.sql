-- Create drivers table
CREATE TABLE public.drivers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drivers policies
CREATE POLICY "Users can manage their own drivers"
ON public.drivers
FOR ALL
USING (auth.uid() = user_id);

-- Add columns to orders
ALTER TABLE public.orders 
ADD COLUMN driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
ADD COLUMN estimated_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN delivery_status TEXT DEFAULT 'pending';

-- Trigger for drivers updated_at
CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
