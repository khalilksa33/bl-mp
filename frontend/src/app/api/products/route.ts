import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { redis } from '@/lib/redis';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  try {
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `products:tenant:${tenantId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    const tenantProducts = await db.select().from(products).where(eq(products.tenantId, tenantId as string));
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(tenantProducts));

    return NextResponse.json(tenantProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProduct = await db.insert(products).values(body).returning();
    
    // Invalidate cache
    await redis.del(`products:tenant:${body.tenantId}`);

    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
