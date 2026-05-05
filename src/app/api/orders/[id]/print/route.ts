import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const order = db.prepare(`
      SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id) as any;

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
    const shopSettings = db.prepare("SELECT * FROM shop_settings WHERE id = 'default'").get() as any;

    const shopName = shopSettings?.shop_name || "FinOpenPOS";
    const shopAddress = shopSettings?.shop_address || "";
    const shopPhone = shopSettings?.shop_phone || "";
    const currency = shopSettings?.currency || "PKR";
    const receiptHeader = shopSettings?.receipt_header || "Thank you for shopping!";
    const receiptFooter = shopSettings?.receipt_footer || "Please come again!";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt #${order.id.slice(0, 8)}</title>
  <style>
    body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 2mm; margin: 0; font-size: 12px; line-height: 1.2; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .divider { border-bottom: 1px dashed #000; margin: 2mm 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; border-bottom: 1px solid #000; padding: 1mm 0; }
    td { padding: 1mm 0; vertical-align: top; }
    .footer { margin-top: 4mm; font-size: 10px; }
    @media print { @page { margin: 0; } body { width: 80mm; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="bold" style="font-size: 16px;">${shopName}</div>
    ${shopAddress ? `<div>${shopAddress}</div>` : ""}
    ${shopPhone ? `<div>Tel: ${shopPhone}</div>` : ""}
  </div>
  
  <div class="divider"></div>
  
  <div>
    <div>Date: ${new Date(order.created_at).toLocaleString()}</div>
    <div>Order: #${order.id.slice(0, 8)}</div>
    <div>Customer: ${order.customer_name || "Walk-in"}</div>
  </div>
  
  <div class="divider"></div>
  
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Price</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any) => `
        <tr>
          <td>${item.product_name}</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-right">${(item.total_price).toLocaleString()}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  
  <div class="divider"></div>
  
  <div class="bold">
    <div style="display: flex; justify-content: space-between;">
      <span>Subtotal</span>
      <span>${currency} ${(order.subtotal || order.total_amount).toLocaleString()}</span>
    </div>
    ${order.discount_amount > 0 ? `
    <div style="display: flex; justify-content: space-between;">
      <span>Discount</span>
      <span>-${currency} ${order.discount_amount.toLocaleString()}</span>
    </div>
    ` : ""}
    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 1mm;">
      <span>TOTAL</span>
      <span>${currency} ${order.total_amount.toLocaleString()}</span>
    </div>
  </div>
  
  <div class="divider"></div>
  
  <div>
    <div style="display: flex; justify-content: space-between;">
      <span>Paid</span>
      <span>${currency} ${order.amount_paid.toLocaleString()}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>Balance</span>
      <span>${currency} ${(order.total_amount - order.amount_paid).toLocaleString()}</span>
    </div>
    <div>Method: ${order.payment_method.toUpperCase()}</div>
  </div>
  
  <div class="footer text-center">
    <div class="divider"></div>
    <p>${receiptHeader}</p>
    <p>${receiptFooter}</p>
    <p>Powered by FinOpenPOS</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
