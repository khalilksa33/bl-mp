import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/schema';
import { redis } from '@/lib/redis';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get('subdomain');

  try {
    if (subdomain) {
      // Check cache first
      const cached = await redis.get(`tenant:${subdomain}`);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }

      // Query database
      const tenant = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
      
      if (tenant.length === 0) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }

      // Cache result for 1 hour
      await redis.setex(`tenant:${subdomain}`, 3600, JSON.stringify(tenant[0]));

      return NextResponse.json(tenant[0]);
    }

    // Return all tenants if no subdomain specified (admin only ideally)
    const allTenants = await db.select().from(tenants);
    return NextResponse.json(allTenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newTenant = await db.insert(tenants).values(body).returning();
    return NextResponse.json(newTenant[0], { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
