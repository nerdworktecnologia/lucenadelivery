-- Allow super_admins to view all customers
CREATE POLICY "Super admins can view all customers"
ON public.customers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admins to view all orders
CREATE POLICY "Super admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admins to view all order items
CREATE POLICY "Super admins can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));