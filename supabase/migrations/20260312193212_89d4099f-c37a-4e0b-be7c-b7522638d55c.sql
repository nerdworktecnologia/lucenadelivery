
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_name text NOT NULL DEFAULT 'Minha Loja',
  delivery_fee numeric NOT NULL DEFAULT 5.00,
  min_order numeric NOT NULL DEFAULT 15.00,
  prep_time integer NOT NULL DEFAULT 30,
  open_time text NOT NULL DEFAULT '11:00',
  close_time text NOT NULL DEFAULT '23:00',
  primary_color text NOT NULL DEFAULT '#16a34a',
  auto_accept boolean NOT NULL DEFAULT true,
  auto_print_kitchen boolean NOT NULL DEFAULT true,
  auto_print_delivery boolean NOT NULL DEFAULT true,
  whatsapp_msg text NOT NULL DEFAULT 'Olá! 😊 Seja bem-vindo ao {loja}!

🍔 Faça seu pedido pelo cardápio digital:
👉 {link}

Ou me diga o que deseja pedir!',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.store_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.store_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.store_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
