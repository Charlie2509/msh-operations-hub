const requiredEnvKeys = ['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ADMIN_ACCESS_TOKEN', 'SHOPIFY_API_VERSION'];

export function getShopifyConfig() {
  return {
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN || '',
    accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
    apiVersion: process.env.SHOPIFY_API_VERSION || '2025-10'
  };
}

export function getShopifyEnvStatus() {
  const config = getShopifyConfig();

  return {
    SHOPIFY_STORE_DOMAIN: Boolean(config.storeDomain),
    SHOPIFY_ADMIN_ACCESS_TOKEN: Boolean(config.accessToken),
    SHOPIFY_API_VERSION: Boolean(config.apiVersion)
  };
}

export function isShopifyConfigured() {
  const config = getShopifyConfig();
  return requiredEnvKeys.every(key => {
    if (key === 'SHOPIFY_STORE_DOMAIN') return Boolean(config.storeDomain);
    if (key === 'SHOPIFY_ADMIN_ACCESS_TOKEN') return Boolean(config.accessToken);
    if (key === 'SHOPIFY_API_VERSION') return Boolean(config.apiVersion);
    return false;
  });
}

export function getShopifyMissingEnvVars() {
  const status = getShopifyEnvStatus();
  return Object.entries(status)
    .filter(([, present]) => !present)
    .map(([key]) => key);
}
