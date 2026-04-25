import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

export async function initDatabase() {
  const collections = [
    { name: "products", type: "base" },
    { name: "customers", type: "base" },
    { name: "orders", type: "base" },
    { name: "order_items", type: "base" },
    { name: "deals", type: "base" },
    { name: "shop_settings", type: "base" },
    { name: "khata_accounts", type: "base" },
    { name: "khata_transactions", type: "base" },
    { name: "expenses", type: "base" },
  ];

  for (const col of collections) {
    try {
      await pb.collections.create({ name: col.name, type: col.type });
    } catch (e) {}
  }

  await new Promise(r => setTimeout(r, 500));

  const schemas: Record<string, any[]> = {
    products: [
      { name: "name", type: "text", required: true },
      { name: "sku", type: "text" },
      { name: "price", type: "number" },
      { name: "stock", type: "number" },
      { name: "category", type: "text" },
      { name: "is_active", type: "bool" },
    ],
    customers: [
      { name: "name", type: "text", required: true },
      { name: "phone", type: "text" },
      { name: "address", type: "text" },
      { name: "is_active", type: "bool" },
    ],
    orders: [
      { name: "customer", type: "text" },
      { name: "total_amount", type: "number" },
      { name: "payment_method", type: "select", values: ["cash", "card", "khata"] },
      { name: "status", type: "select", values: ["pending", "paid", "refunded"] },
      { name: "is_active", type: "bool" },
    ],
    shop_settings: [
      { name: "shop_name", type: "text" },
      { name: "currency", type: "text" },
      { name: "is_active", type: "bool" },
    ],
  };

  for (const [name, schema] of Object.entries(schemas)) {
    try {
      await pb.collections.update(name, { schema });
    } catch (e) {}
  }

  return pb;
}

export default pb;