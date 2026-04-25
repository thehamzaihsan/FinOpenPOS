import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@possys.com';
const ADMIN_PASSWORD = 'PosSys@123456';

let adminInitialized = false;

async function getAdminPb(): Promise<{ client: PocketBase; authenticated: boolean }> {
  const pbAdmin = new PocketBase(PB_URL);
  let authenticated = false;
  
  try {
    try {
        await pbAdmin.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        authenticated = true;
        console.log("Admin authenticated via SDK");
    } catch (sdkErr: any) {
        if (sdkErr.status === 404 || sdkErr.status === 0) {
            console.log("SDK admin auth failed, trying manual legacy path...");
            const res = await pbAdmin.send("/api/admins/auth-with-password", {
                method: "POST",
                body: { identity: ADMIN_EMAIL, password: ADMIN_PASSWORD },
            });
            pbAdmin.authStore.save(res.token, res.admin);
            authenticated = true;
            console.log("Admin authenticated via legacy path");
        } else {
            throw sdkErr;
        }
    }
  } catch (e) {
    console.log("Auth failed, attempting to create admin...");
    try {
      await pbAdmin.send("/api/admins", {
        method: "POST",
        body: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          passwordConfirm: ADMIN_PASSWORD,
        },
      });
      console.log("Admin created via manual path");
    } catch (createErr: any) {
      if (createErr.status === 400) {
        console.log("Admin already exists or other validation error");
      }
    }
    
    try {
      const res = await pbAdmin.send("/api/admins/auth-with-password", {
          method: "POST",
          body: { identity: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      pbAdmin.authStore.save(res.token, res.admin);
      authenticated = true;
      console.log("Admin authenticated after creation");
    } catch (authErr: any) {
      console.log("Could not authenticate as admin:", authErr.message);
    }
  }
  
  return { client: pbAdmin, authenticated };
}

export async function ensureCollections() {
  const pbHealth = new PocketBase(PB_URL);
  
  console.log("Checking PocketBase health at", PB_URL, "...");
  
  try {
    await pbHealth.health.check();
  } catch (e) {
    console.log("PocketBase not ready, waiting...");
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await pbHealth.health.check();
    } catch {
      console.log("PocketBase still not ready at", PB_URL);
      throw new Error(`PocketBase not reachable at ${PB_URL}. Please make sure it is running.`);
    }
  }

  // Try to get admin client only after we know PB is up
  const { client: clientToUse, authenticated: isAuth } = await getAdminPb();
  adminInitialized = isAuth;

  if (!isAuth) {
    console.warn("Using unauthenticated client, collection operations might fail!");
    return false;
  }

  console.log("PocketBase is ready, ensuring collections...");

  const schemas: Record<string, any[]> = {
    products: [
      { name: "name", type: "text", required: true },
      { name: "sku", type: "text" },
      { name: "price", type: "number" },
      { name: "stock", type: "number" },
      { name: "category", type: "text" },
      { name: "is_active", type: "bool" },
      { name: "cost_price", type: "number" },
      { name: "min_stock", type: "number" },
    ],
    customers: [
      { name: "name", type: "text", required: true },
      { name: "phone", type: "text" },
      { name: "address", type: "text" },
      { name: "is_active", type: "bool" },
    ],
    orders: [
      { name: "items", type: "json", options: { maxSize: 2000000 } },
      { name: "customer", type: "text" },
      { name: "customer_id", type: "text" },
      { name: "subtotal", type: "number" },
      { name: "discount", type: "number" },
      { name: "tax", type: "number" },
      { name: "total", type: "number" },
      { name: "payment_method", type: "select", values: ["cash", "card", "khata"], maxSelect: 1 },
      { name: "status", type: "select", values: ["pending", "paid", "refunded"], maxSelect: 1 },
      { name: "is_active", type: "bool" },
    ],
    order_items: [
      { name: "order_id", type: "text", required: true },
      { name: "product_id", type: "text", required: true },
      { name: "product_name", type: "text" },
      { name: "quantity", type: "number" },
      { name: "unit_price", type: "number" },
      { name: "total", type: "number" },
    ],
    deals: [
      { name: "name", type: "text", required: true },
      { name: "type", type: "select", values: ["flat", "percentage"], maxSelect: 1 },
      { name: "value", type: "number" },
      { name: "products", type: "json", options: { maxSize: 2000000 } },
      { name: "is_active", type: "bool" },
    ],
    shop_settings: [
      { name: "shop_name", type: "text" },
      { name: "phone", type: "text" },
      { name: "address", type: "text" },
      { name: "currency", type: "text" },
      { name: "tax_number", type: "text" },
      { name: "receipt_header", type: "text" },
      { name: "receipt_footer", type: "text" },
      { name: "printer_type", type: "select", values: ["thermal", "a4"], maxSelect: 1 },
      { name: "is_active", type: "bool" },
    ],
    khata_accounts: [
      { name: "name", type: "text", required: true },
      { name: "phone", type: "text" },
      { name: "balance", type: "number" },
      { name: "is_active", type: "bool" },
    ],
    khata_transactions: [
      { name: "account_id", type: "text", required: true },
      { name: "order_id", type: "text" },
      { name: "type", type: "select", values: ["credit", "debit"], maxSelect: 1 },
      { name: "amount", type: "number" },
      { name: "note", type: "text" },
    ],
    expenses: [
      { name: "description", type: "text", required: true },
      { name: "amount", type: "number" },
      { name: "category", type: "text" },
      { name: "date", type: "date" },
    ],
  };
  
  // Cache for collection name -> id
  const collectionIds: Record<string, string> = {};

  // Get all existing collections
  try {
    const existingCols = await clientToUse.collections.getFullList();
    for (const c of existingCols) {
        collectionIds[c.name] = c.id;
    }
  } catch (e: any) {
    console.log("Error listing collections via SDK, trying manual path...");
    try {
        const res = await clientToUse.send("/api/collections", { method: "GET" });
        if (res && res.items) {
            for (const c of res.items) {
                collectionIds[c.name] = c.id;
            }
        }
    } catch (manualErr: any) {
        console.log("Manual collection list failed:", manualErr.message);
    }
  }
  
  for (const name of Object.keys(schemas)) {
    const colData = {
        name,
        type: "base",
        schema: schemas[name],
    };

    if (!collectionIds[name]) {
        try {
            const created = await clientToUse.collections.create(colData);
            collectionIds[name] = created.id;
            console.log(`Created collection: ${name}`);
        } catch (e: any) {
            try {
                // Try manual create if SDK fails
                const createdManual = await clientToUse.send("/api/collections", {
                    method: "POST",
                    body: colData,
                });
                collectionIds[name] = createdManual.id;
                console.log(`Created collection (manual): ${name}`);
            } catch (manualErr: any) {
                console.log(`Error creating ${name}:`, manualErr.message);
                console.log("Error details:", JSON.stringify(manualErr.data || manualErr.response || {}));
            }
        }
    } else {
        // Update existing
        const id = collectionIds[name];
        try {
            await clientToUse.collections.update(id, { schema: schemas[name] });
            console.log(`Updated schema for: ${name}`);
        } catch (e: any) {
            try {
                // Manual update path
                await clientToUse.send(`/api/collections/${id}`, {
                    method: "PATCH",
                    body: { schema: schemas[name] },
                });
                console.log(`Updated schema (manual) for: ${name}`);
            } catch (manualErr: any) {
                console.log(`Error updating schema for ${name}:`, manualErr.message);
            }
        }
    }
  }

  console.log("Collections ensured");
  return true;
}
