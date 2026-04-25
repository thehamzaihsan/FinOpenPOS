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
    const products = await pb.collection("products").getFullList({
      filter: "is_active = true",
      sort: "-created",
    });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error("Products GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getAdminClient(request);

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    }

    const product = await pb.collection("products").create({
      name: body.name,
      sku: body.sku || "",
      price: body.price || 0,
      stock: body.stock || 0,
      category: body.category || "",
      is_active: true,
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Products POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}