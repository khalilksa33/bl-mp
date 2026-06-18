-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create tenants metadata table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    business_type VARCHAR(100),
    owner_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist if the table was already created
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL,
    total_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id_created_at ON orders(tenant_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tenant_order_number ON orders(tenant_id, order_number);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE OR REPLACE FUNCTION get_current_tenant_id() 
RETURNS UUID AS $$
DECLARE
    tenant_val TEXT;
BEGIN
    tenant_val := current_setting('app.current_tenant_id', true);
    IF tenant_val IS NULL OR tenant_val = '' THEN
        RETURN NULL;
    END IF;
    RETURN tenant_val::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop policies if they exist to avoid errors on container restart
DROP POLICY IF EXISTS tenant_isolation_policy ON tenants;
DROP POLICY IF EXISTS tenant_write_policy ON tenants;
DROP POLICY IF EXISTS tenant_insert_policy ON tenants;
DROP POLICY IF EXISTS tenant_update_policy ON tenants;
DROP POLICY IF EXISTS tenant_delete_policy ON tenants;

CREATE POLICY tenant_read_policy ON tenants
    FOR SELECT
    USING (true);

CREATE POLICY tenant_insert_policy ON tenants
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY tenant_update_policy ON tenants
    FOR UPDATE
    USING (id = get_current_tenant_id())
    WITH CHECK (id = get_current_tenant_id());

CREATE POLICY tenant_delete_policy ON tenants
    FOR DELETE
    USING (id = get_current_tenant_id());


DROP POLICY IF EXISTS order_isolation_policy ON orders;
CREATE POLICY order_isolation_policy ON orders
    FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- 4. Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    category VARCHAR(100) NOT NULL,
    image VARCHAR(100),
    rating NUMERIC(3, 2) DEFAULT 0.00,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);

-- 5. Enable Row-Level Security (RLS) on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_read_policy ON products;
CREATE POLICY product_read_policy ON products
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS product_write_policy ON products;
DROP POLICY IF EXISTS product_insert_policy ON products;
DROP POLICY IF EXISTS product_update_policy ON products;
DROP POLICY IF EXISTS product_delete_policy ON products;

CREATE POLICY product_insert_policy ON products
    FOR INSERT
    WITH CHECK (get_current_tenant_id() IS NULL OR tenant_id = get_current_tenant_id());

CREATE POLICY product_update_policy ON products
    FOR UPDATE
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY product_delete_policy ON products
    FOR DELETE
    USING (tenant_id = get_current_tenant_id());


-- 6. Trigger for automated updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tenants_timestamp ON tenants;
CREATE TRIGGER trigger_update_tenants_timestamp
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trigger_update_orders_timestamp ON orders;
CREATE TRIGGER trigger_update_orders_timestamp
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trigger_update_products_timestamp ON products;
CREATE TRIGGER trigger_update_products_timestamp
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 7. Insert Seed Data
-- Insert tenants including the 6 new business types
INSERT INTO tenants (id, name, subdomain, status, business_type, owner_name, email, phone, settings) VALUES
('11111111-1111-1111-1111-111111111111', 'Apex Tech Labs', 'apex', 'active', 'electronics', 'John Doe', 'john@apex.com', '+1 555 123 4567', '{"logo": "⚡", "category": "Electronics", "bannerGradient": "from-blue-600 to-indigo-900", "rating": 4.9}'::jsonb),
('22222222-2222-2222-2222-222222222222', 'Luxe Attire', 'luxe', 'active', 'fashion', 'Jane Smith', 'jane@luxe.com', '+1 555 987 6543', '{"logo": "👔", "category": "Fashion", "bannerGradient": "from-purple-600 to-pink-900", "rating": 4.8}'::jsonb),
('33333333-3333-3333-3333-333333333333', 'Eco Living Co.', 'eco', 'active', 'lifestyle', 'Bob Green', 'bob@eco.com', '+1 555 333 4444', '{"logo": "🌱", "category": "Lifestyle", "bannerGradient": "from-emerald-600 to-teal-900", "rating": 4.7}'::jsonb),
('44444444-4444-4444-4444-444444444444', 'Horizon Foods', 'horizon', 'active', 'groceries', 'Alice Baker', 'alice@horizon.com', '+1 555 888 9999', '{"logo": "🍎", "category": "Groceries", "bannerGradient": "from-amber-500 to-orange-850", "rating": 4.9}'::jsonb),
('55555555-5555-5555-5555-555555555555', 'Riyadh Parts Hub', 'riyadh-parts', 'active', 'new_auto_spare_parts', 'Khalid Al-Ghamdi', 'khalid@riyadhparts.com', '+966 50 123 1111', '{"logo": "🔌", "category": "Parts", "bannerGradient": "from-blue-600 to-indigo-900", "rating": 4.8}'::jsonb),
('66666666-6666-6666-6666-666666666666', 'Al-Tashleeh Al-Malaki', 'tashleeh-malaki', 'active', 'used_auto_spare_parts', 'Fahad Al-Qahtani', 'info@tashleehmalaki.com', '+966 50 123 2222', '{"logo": "🚗", "category": "Used Parts", "bannerGradient": "from-rose-600 to-red-950", "rating": 4.9}'::jsonb),
('77777777-7777-7777-7777-777777777777', 'Sathat Al-Riyadh Express', 'sathat-express', 'active', 'tow_company', 'Mohammed Al-Otaibi', 'ops@sathatexpress.com', '+966 50 123 3333', '{"logo": "🛻", "category": "Towing", "bannerGradient": "from-amber-500 to-orange-850", "rating": 4.7}'::jsonb),
('88888888-8888-8888-8888-888888888888', 'Mobile Auto Doctor', 'auto-doctor', 'active', 'mobile_workshop', 'Yousef Al-Shammari', 'support@autodoctor.com', '+966 50 123 4444', '{"logo": "🔋", "category": "Mobile Service", "bannerGradient": "from-emerald-600 to-teal-900", "rating": 4.9}'::jsonb),
('99999999-9999-9999-9999-999999999999', 'Precision Alignment Center', 'precision-alignment', 'active', 'digital_alignment', 'Sami Al-Harbi', 'contact@precision.com', '+966 50 123 5555', '{"logo": "📐", "category": "Alignment", "bannerGradient": "from-purple-600 to-pink-900", "rating": 4.6}'::jsonb),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Grand Mechanical Workshop', 'grand-mechanic', 'active', 'mechanics_workshop', 'Ali Al-Mutairi', 'admin@grandmechanic.com', '+966 50 123 6666', '{"logo": "🔧", "category": "Mechanic", "bannerGradient": "from-indigo-650 to-indigo-900", "rating": 4.8}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    subdomain = EXCLUDED.subdomain,
    business_type = EXCLUDED.business_type,
    owner_name = EXCLUDED.owner_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    settings = EXCLUDED.settings;

-- Insert orders associated with tenants
INSERT INTO orders (id, tenant_id, order_number, customer_id, total_amount, currency, status) VALUES
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '11111111-1111-1111-1111-111111111111', 'ORD-APEX-001', '33333333-3333-3333-3333-333333333333', 299.00, 'USD', 'completed'),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', '11111111-1111-1111-1111-111111111111', 'ORD-APEX-002', '44444444-4444-4444-4444-444444444444', 199.00, 'USD', 'pending'),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '22222222-2222-2222-2222-222222222222', 'ORD-LUXE-001', '55555555-5555-5555-5555-555555555555', 180.00, 'USD', 'completed')
ON CONFLICT (id) DO NOTHING;

-- Insert products associated with tenants
INSERT INTO products (id, tenant_id, name, price, category, image, rating, featured) VALUES
('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', '11111111-1111-1111-1111-111111111111', 'Quantum Pro Headset', 299.00, 'Electronics', '🎧', 4.9, true),
('2a2a2a2a-2a2a-2a2a-2a2a-2a2a2a2a2a2a', '11111111-1111-1111-1111-111111111111', 'Nano X Smartwatch', 199.00, 'Electronics', '⌚', 4.7, true),
('3a3a3a3a-3a3a-3a3a-3a3a-3a3a3a3a3a3a', '11111111-1111-1111-1111-111111111111', 'HoloDisplay 4K Monitor', 699.00, 'Electronics', '🖥️', 4.8, false),
('4b4b4b4b-4b4b-4b4b-4b4b-4b4b4b4b4b4b', '22222222-2222-2222-2222-222222222222', 'Minimalist Leather Jacket', 180.00, 'Fashion', '🧥', 4.8, true),
('5b5b5b5b-5b5b-5b5b-5b5b-5b5b5b5b5b5b', '22222222-2222-2222-2222-222222222222', 'Urban Knit Sneakers', 120.00, 'Fashion', '👟', 4.6, false),
('6b6b6b6b-6b6b-6b6b-6b6b-6b6b6b6b6b6b', '22222222-2222-2222-2222-222222222222', 'Bespoke Tailored Blazer', 250.00, 'Fashion', '🧥', 4.9, true),
('7c7c7c7c-7c7c-7c7c-7c7c-7c7c7c7c7c7c', '33333333-3333-3333-3333-333333333333', 'Eco-Friendly Bamboo Flask', 35.00, 'Lifestyle', '🥤', 4.5, false),
('8c8c8c8c-8c8c-8c8c-8c8c-8c8c8c8c8c8c', '33333333-3333-3333-3333-333333333333', 'Handcrafted Ceramic Planter', 45.00, 'Lifestyle', '🏺', 4.8, true),
('9c9c9c9c-9c9c-9c9c-9c9c-9c9c9c9c9c9c', '33333333-3333-3333-3333-333333333333', 'Organic Matcha Starter Set', 65.00, 'Lifestyle', '🍵', 4.9, true),
('1d1d1d1d-1d1d-1d1d-1d1d-1d1d1d1d1d1d', '44444444-4444-4444-4444-444444444444', 'Premium Espresso Roast (1kg)', 28.00, 'Groceries', '☕', 4.9, true),
('2d2d2d2d-2d2d-2d2d-2d2d-2d2d2d2d2d2d', '44444444-4444-4444-4444-444444444444', 'Artisanal Sourdough Loaf', 8.00, 'Groceries', '🍞', 4.7, false),
('3d3d3d3d-3d3d-3d3d-3d3d-3d3d3d3d3d3d', '44444444-4444-4444-4444-444444444444', 'Organic Honeycomb (500g)', 18.00, 'Groceries', '🍯', 4.9, true)
ON CONFLICT (id) DO NOTHING;

-- Create dedicated non-superuser for backend database connection to enforce RLS
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE USER app_user WITH PASSWORD 'app_password';
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON TABLE tenants TO app_user;
GRANT ALL PRIVILEGES ON TABLE orders TO app_user;
GRANT ALL PRIVILEGES ON TABLE products TO app_user;

