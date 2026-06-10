-- database/migrations/20260610000000_init_multi_tenant_schema.sql

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create tenants metadata table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for subdomain lookups in middleware
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);

-- 2. Create orders table featuring non-nullable tenant_id UUID column
CREATE TABLE orders (
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

-- Compound index to satisfy RLS filter and queries efficiently
CREATE INDEX idx_orders_tenant_id_created_at ON orders(tenant_id, created_at DESC);
CREATE UNIQUE INDEX idx_orders_tenant_order_number ON orders(tenant_id, order_number);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies using app.current_tenant_id session context
-- Helper function to safely extract current tenant ID from session context
CREATE OR REPLACE FUNCTION get_current_tenant_id() 
RETURNS UUID AS $$
DECLARE
    tenant_val TEXT;
BEGIN
    -- Retrieve session variable set by the backend database connection pool middleware
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

-- Policies for tenants table
CREATE POLICY tenant_isolation_policy ON tenants
    FOR ALL
    USING (id = get_current_tenant_id());

-- Policies for orders table
CREATE POLICY order_isolation_policy ON orders
    FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- 5. Trigger for automated updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenants_timestamp
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trigger_update_orders_timestamp
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();
