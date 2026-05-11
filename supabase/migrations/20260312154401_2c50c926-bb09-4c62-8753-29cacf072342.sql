
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_phone text NOT NULL DEFAULT '',
  to_phone text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  direction text NOT NULL DEFAULT 'inbound',
  wa_message_id text DEFAULT NULL,
  status text NOT NULL DEFAULT 'sent',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whatsapp messages"
ON public.whatsapp_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whatsapp messages"
ON public.whatsapp_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all messages"
ON public.whatsapp_messages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can insert inbound messages"
ON public.whatsapp_messages FOR INSERT
TO anon
WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
