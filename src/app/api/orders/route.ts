import { NextResponse, NextRequest } from "next/server";
import PocketBase from "pocketbase";

async function getAdminClient(request: NextRequest) {
  const email = request.headers.get("x-pb-email") || "";
  const password = request.headers.get("x-pb-password") || "";
  const client = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090");
  await client.admins.authWithPassword(email, password);
  return client;
}

export async function GET(request: NextRequest) {
  try {
    const pb = await getAdminClient(request);
    const orders = await pb.collection("orders").getFullList({
      sort: "-created",
      expand: "customer",
    });
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getAdminClient(request);
    const body = await request.json();
    const { items, customer, is_khata, payment_method, total_amount } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Order items required" }, { status: 400 });
    }

    const orderItems = [];
    for (const item of items) {
      const product = await pb.collection("products").getOne(item.product);

      if (product.stock < item.quantity) {
        return NextResponse.json({
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        }, { status: 400 });
      }

      await pb.collection("products").update(item.product, {
        stock: product.stock - item.quantity,
      });

      orderItems.push({
        order: "",
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      });
    }

    const order = await pb.collection("orders").create({
      customer: customer || null,
      total_amount: total_amount || 0,
      payment_method: payment_method || "cash",
      status: "paid",
      is_khata: is_khata || false,
      is_active: true,
    });

    for (const item of orderItems) {
      item.order = order.id;
      await pb.collection("order_items").create(item);
    }

    if (is_khata && customer) {
      try {
        let accounts = await pb.collection("khata_accounts").getFullList({
          filter: `customer = "${customer}"`,
        });

        if (!accounts[0]) {
          const newAccount = await pb.collection("khata_accounts").create({
            customer: customer,
            balance: total_amount || 0,
          });
          accounts = [newAccount];
        } else {
          await pb.collection("khata_accounts").update(accounts[0].id, {
            balance: (accounts[0].balance || 0) + (total_amount || 0),
          });
        }

        await pb.collection("khata_transactions").create({
          account: accounts[0].id,
          amount: total_amount || 0,
          type: "debit",
          note: `Order #${order.id}`,
        });
      } catch (e) {
        console.error("Khata update failed:", e);
      }
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create order" }, { status: 500 });
  }
}