import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { redis } from '@/lib/redis';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  const customerId = searchParams.get('customerId');

  try {
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (customerId) {
      const customerOrders = await db.select().from(orders).where(
        and(eq(orders.tenantId, tenantId as string), eq(orders.customerId, customerId as string))
      );
      return NextResponse.json(customerOrders);
    }

    const tenantOrders = await db.select().from(orders).where(eq(orders.tenantId, tenantId as string));
    return NextResponse.json(tenantOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newOrder = await db.insert(orders).values(body).returning();
    return NextResponse.json(newOrder[0], { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
