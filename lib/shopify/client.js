import { getShopifyConfig, getShopifyMissingEnvVars, isShopifyConfigured } from './config';

export async function shopifyAdminGraphQLRequest(query, variables = {}) {
  if (!isShopifyConfigured()) {
    const missing = getShopifyMissingEnvVars();
    return {
      ok: false,
      data: null,
      errors: [`Shopify is not configured. Missing: ${missing.join(', ')}`]
    };
  }

  const config = getShopifyConfig();
  const endpoint = `https://${config.storeDomain}/admin/api/${config.apiVersion}/graphql.json`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': config.accessToken
      },
      cache: 'no-store',
      body: JSON.stringify({ query, variables })
    });

    const payload = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        data: payload,
        errors: [`Shopify request failed with HTTP ${response.status}.`]
      };
    }

    if (payload.errors?.length) {
      return {
        ok: false,
        data: payload,
        errors: payload.errors.map(error => error.message || 'Unknown Shopify error')
      };
    }

    return { ok: true, data: payload.data, errors: [] };
  } catch (error) {
    return {
      ok: false,
      data: null,
      errors: [error?.message || 'Unexpected Shopify connection error.']
    };
  }
}
