import { NextResponse } from 'next/server';
import { fetchShopifyOrderById } from '../../../../../lib/shopify/orders';
import { normalizeShopifyOrder } from '../../../../../lib/shopify/normalize';
import { getShopifyMissingEnvVars, isShopifyConfigured } from '../../../../../lib/shopify/config';

export async function GET(_request, { params }) {
  if (!isShopifyConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        order: null,
        error: `Shopify env vars missing: ${getShopifyMissingEnvVars().join(', ')}`
      },
      { status: 400 }
    );
  }

  const rawId = params?.id;
  if (!rawId) {
    return NextResponse.json({ ok: false, order: null, error: 'Missing Shopify order ID.' }, { status: 400 });
  }

  const orderId = rawId.startsWith('gid://') ? rawId : `gid://shopify/Order/${rawId}`;
  const result = await fetchShopifyOrderById(orderId);

  if (!result.ok) {
    return NextResponse.json({ ok: false, order: null, error: result.errors.join(' ') }, { status: 502 });
  }

  if (!result.order) {
    return NextResponse.json({ ok: false, order: null, error: 'Order not found in Shopify.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order: normalizeShopifyOrder(result.order) });
}
