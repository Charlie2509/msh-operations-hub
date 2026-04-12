import { NextResponse } from 'next/server';
import { fetchRecentShopifyOrders, normalizeShopifyOrdersForHub } from '../../../../lib/shopify/orders';
import { getShopifyMissingEnvVars, isShopifyConfigured } from '../../../../lib/shopify/config';

export async function GET(request) {
  if (!isShopifyConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        orders: [],
        error: `Shopify env vars missing: ${getShopifyMissingEnvVars().join(', ')}`
      },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || 20);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20;

  const result = await fetchRecentShopifyOrders(safeLimit);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        orders: [],
        error: result.errors.join(' ')
      },
      { status: 502 }
    );
  }

  const normalizedOrders = normalizeShopifyOrdersForHub(result.orders);

  return NextResponse.json({ ok: true, orders: normalizedOrders });
}
