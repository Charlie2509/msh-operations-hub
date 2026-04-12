import { shopifyAdminGraphQLRequest } from './client';
import { normalizeShopifyOrder } from './normalize';

const RECENT_ORDERS_QUERY = `#graphql
  query RecentOrders($first: Int!) {
    orders(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          email
          phone
          note
          createdAt
          updatedAt
          displayFulfillmentStatus
          displayFinancialStatus
          shippingLine {
            title
          }
          customer {
            firstName
            lastName
            email
            phone
          }
          shippingAddress {
            name
            phone
          }
          lineItems(first: 10) {
            edges {
              node {
                name
                quantity
                variantTitle
              }
            }
          }
        }
      }
    }
  }
`;

const ORDER_BY_ID_QUERY = `#graphql
  query OrderById($id: ID!) {
    order(id: $id) {
      id
      name
      email
      phone
      note
      createdAt
      updatedAt
      displayFulfillmentStatus
      displayFinancialStatus
      shippingLine {
        title
      }
      customer {
        firstName
        lastName
        email
        phone
      }
      shippingAddress {
        name
        phone
      }
      lineItems(first: 25) {
        edges {
          node {
            name
            quantity
            variantTitle
          }
        }
      }
    }
  }
`;

export async function fetchRecentShopifyOrders(limit = 20) {
  const result = await shopifyAdminGraphQLRequest(RECENT_ORDERS_QUERY, { first: limit });

  if (!result.ok) {
    return { ok: false, orders: [], errors: result.errors };
  }

  const edges = result?.data?.orders?.edges || [];
  const orders = edges.map(edge => edge?.node).filter(Boolean);
  return { ok: true, orders, errors: [] };
}

export async function fetchShopifyOrderById(id) {
  const result = await shopifyAdminGraphQLRequest(ORDER_BY_ID_QUERY, { id });

  if (!result.ok) {
    return { ok: false, order: null, errors: result.errors };
  }

  const order = result?.data?.order || null;
  return { ok: true, order, errors: [] };
}

export function normalizeShopifyOrdersForHub(orders) {
  return (orders || []).map(normalizeShopifyOrder);
}
