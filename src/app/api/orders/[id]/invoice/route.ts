import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const order = db.prepare(`
      SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, c.address AS customer_address
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
    const taxNumber = shopSettings?.tax_number || "";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${order.id.slice(0, 8)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #111827; background: #fff; font-size: 12px; line-height: 1.5; margin: 0; padding: 20px; }
    .container { max-width: 210mm; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .shop-info h1 { font-size: 24px; color: #1e40af; margin: 0 0 5px 0; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 20px; color: #6b7280; margin: 0 0 10px 0; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
    .details h3 { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .table th { background: #f9fafb; padding: 12px 15px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; }
    .table td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; }
    .table .text-right { text-align: right; }
    .summary { display: flex; justify-content: flex-end; }
    .summary-table { width: 250px; }
    .summary-table tr td { padding: 8px 0; }
    .summary-table .total { font-size: 18px; font-weight: 700; color: #1e40af; border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 10px; }
    .footer { margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 10px; }
    @media print { @page { size: A4; margin: 15mm; } body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="shop-info">
        <h1>${shopName}</h1>
        ${shopAddress ? `<div>${shopAddress}</div>` : ""}
        ${shopPhone ? `<div>Phone: ${shopPhone}</div>` : ""}
        ${taxNumber ? `<div>Tax ID: ${taxNumber}</div>` : ""}
      </div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <div>Invoice #: <strong>${order.id.slice(0, 8).toUpperCase()}</strong></div>
        <div>Date: <strong>${new Date(order.created_at).toLocaleDateString()}</strong></div>
        <div>Status: <strong>${order.status.toUpperCase()}</strong></div>
      </div>
    </div>

    <div class="details">
      <div>
        <h3>Bill To:</h3>
        <div style="font-size: 14px; font-weight: 700;">${order.customer_name || "Walk-in Customer"}</div>
        ${order.customer_phone ? `<div>${order.customer_phone}</div>` : ""}
        ${order.customer_address ? `<div>${order.customer_address}</div>` : ""}
      </div>
      <div>
        <h3>Payment Details:</h3>
        <div>Method: ${order.payment_method.toUpperCase()}</div>
        <div>Khata Payment: ${order.is_khata ? "Yes" : "No"}</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th class="text-right">Price</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any) => `
          <tr>
            <td>
              <div style="font-weight: 600;">${item.product_name}</div>
              <div style="font-size: 10px; color: #6b7280;">${item.product_id}</div>
            </td>
            <td class="text-right">${currency} ${(item.unit_price).toLocaleString()}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${currency} ${(item.total_price).toLocaleString()}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="summary">
      <table class="summary-table">
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">${currency} ${(order.subtotal || order.total_amount).toLocaleString()}</td>
        </tr>
        ${order.discount_amount > 0 ? `
        <tr>
          <td>Discount:</td>
          <td class="text-right">-${currency} ${order.discount_amount.toLocaleString()}</td>
        </tr>
        ` : ""}
        <tr class="total">
          <td>Total:</td>
          <td class="text-right">${currency} ${order.total_amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding-top: 15px;">Amount Paid:</td>
          <td class="text-right" style="padding-top: 15px; color: #059669;">${currency} ${order.amount_paid.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Balance Due:</td>
          <td class="text-right" style="font-weight: 600; color: #dc2626;">${currency} ${(order.total_amount - order.amount_paid).toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>This is a computer generated invoice and does not require a physical signature.</p>
      <p>&copy; ${new Date().getFullYear()} ${shopName} | FinOpenPOS</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
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
