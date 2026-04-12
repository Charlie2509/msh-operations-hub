import { NextResponse } from 'next/server';
import { getShopifyEnvStatus, getShopifyMissingEnvVars, isShopifyConfigured } from '../../../../lib/shopify/config';

export async function GET() {
  return NextResponse.json({
    ok: true,
    envStatus: getShopifyEnvStatus(),
    canConnect: isShopifyConfigured(),
    missing: getShopifyMissingEnvVars()
  });
}
