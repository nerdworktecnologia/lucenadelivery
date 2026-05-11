-- Function to create demo data for a new user
CREATE OR REPLACE FUNCTION public.setup_new_user_demo_data()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID;
    burger_cat_id UUID;
    drink_cat_id UUID;
    side_cat_id UUID;
BEGIN
    new_user_id := NEW.id;

    -- 1. Assign Admin Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin');

    -- 2. Create Default Store Settings
    INSERT INTO public.store_settings (
        user_id, 
        store_name, 
        whatsapp_number, 
        whatsapp_msg, 
        primary_color, 
        open_time, 
        close_time, 
        delivery_fee, 
        min_order, 
        prep_time,
        auto_accept,
        auto_print_delivery,
        auto_print_kitchen
    ) VALUES (
        new_user_id,
        'Minha Loja Demo',
        '5511999999999',
        'Olá! Gostaria de fazer um pedido.',
        '#E11D48',
        '08:00',
        '23:00',
        5.00,
        20.00,
        30,
        true,
        false,
        false
    );

    -- 3. Create Categories
    INSERT INTO public.categories (user_id, name, icon, sort_order)
    VALUES (new_user_id, 'Hambúrgueres', 'Beef', 1)
    RETURNING id INTO burger_cat_id;

    INSERT INTO public.categories (user_id, name, icon, sort_order)
    VALUES (new_user_id, 'Bebidas', 'GlassWater', 2)
    RETURNING id INTO drink_cat_id;

    INSERT INTO public.categories (user_id, name, icon, sort_order)
    VALUES (new_user_id, 'Acompanhamentos', 'Potato', 3)
    RETURNING id INTO side_cat_id;

    -- 4. Create Products
    -- Burgers
    INSERT INTO public.products (user_id, category_id, name, description, price, image, featured, active, addons)
    VALUES 
    (new_user_id, burger_cat_id, 'Classic Burger', 'Pão brioche, carne 180g, queijo cheddar, alface e tomate.', 28.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', true, true, '[{"name": "Queijo Extra", "price": 4.00}, {"name": "Bacon", "price": 5.00}]'::jsonb),
    (new_user_id, burger_cat_id, 'Double Bacon', 'Dois blends 180g, muito bacon crocante e molho especial.', 42.00, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500', true, true, '[{"name": "Cheddar Extra", "price": 4.50}]'::jsonb);

    -- Drinks
    INSERT INTO public.products (user_id, category_id, name, description, price, image, featured, active)
    VALUES 
    (new_user_id, drink_cat_id, 'Coca-Cola 350ml', 'Lata gelada.', 6.50, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500', false, true),
    (new_user_id, drink_cat_id, 'Suco de Laranja', 'Natural 500ml.', 9.00, 'https://images.unsplash.com/photo-1613478223719-2ab302624894?w=500', false, true);

    -- Sides
    INSERT INTO public.products (user_id, category_id, name, description, price, image, featured, active)
    VALUES 
    (new_user_id, side_cat_id, 'Batata Frita G', 'Porção de 400g crocante.', 18.00, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500', false, true),
    (new_user_id, side_cat_id, 'Nuggets (10 unidades)', 'Acompanha molho barbecue.', 22.00, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500', false, true);

    -- 5. Create a Sample Customer for this user
    INSERT INTO public.customers (user_id, name, phone, address, order_count, total_spent)
    VALUES (new_user_id, 'João da Silva (Demo)', '5511888888888', 'Rua das Flores, 123 - Centro', 1, 42.00);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for public.profiles (since profiles are created on auth.users insert usually)
-- Assuming profiles table is already linked to auth.users via trigger or manual insert
-- We will attach this to the profiles table to ensure the user_id exists in our public schema
CREATE TRIGGER on_profile_created_setup_demo
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.setup_new_user_demo_data();
