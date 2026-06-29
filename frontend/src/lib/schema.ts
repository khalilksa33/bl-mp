import { pgTable, uuid, varchar, numeric, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  subdomain: varchar('subdomain', { length: 100 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  businessType: varchar('business_type', { length: 100 }),
  ownerName: varchar('owner_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  orderNumber: varchar('order_number', { length: 100 }).notNull(),
  customerId: uuid('customer_id').notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 4 }).notNull().default('0.0000'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  price: numeric('price', { precision: 15, scale: 4 }).notNull().default('0.0000'),
  category: varchar('category', { length: 100 }).notNull(),
  image: varchar('image', { length: 100 }),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00'),
  featured: boolean('featured').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
