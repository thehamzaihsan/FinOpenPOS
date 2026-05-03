import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;

    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as any;
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const shopSettings = db.prepare("SELECT * FROM shop_settings WHERE id = 'default'").get() as any;

    const orders = db.prepare(`
      SELECT o.*, 
        (o.total_amount - o.amount_paid) AS balance_due
      FROM orders o 
      WHERE o.customer_id = ? AND o.is_active = 1 
      ORDER BY o.created_at DESC
    `).all(id) as any[];

    const khata = db.prepare("SELECT * FROM khata_accounts WHERE customer_id = ?").get(id) as any;

    const khataTransactions = khata
      ? db.prepare(`
          SELECT kt.*, o.id AS order_id, o.status AS order_status
          FROM khata_transactions kt
          LEFT JOIN orders o ON kt.order_id = o.id
          WHERE kt.khata_account_id = ?
          ORDER BY kt.created_at DESC
        `).all(khata.id) as any[]
      : [];

    const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalPaid = orders.reduce((sum, o) => sum + (o.amount_paid || 0), 0);
    const totalBalance = orders.reduce((sum, o) => sum + ((o.total_amount || 0) - (o.amount_paid || 0)), 0);

    const shopName = shopSettings?.shop_name || "FinOpenPOS";
    const shopAddress = shopSettings?.shop_address || "";
    const shopPhone = shopSettings?.shop_phone || "";
    const currency = shopSettings?.currency || "PKR";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Customer Report - ${customer.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #111827; background: #fff; font-size: 11px; line-height: 1.5; }
    @page { size: A4; margin: 15mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    .container { max-width: 210mm; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding-bottom: 16px; border-bottom: 2px solid #1e40af; margin-bottom: 24px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #1e40af; margin-bottom: 4px; }
    .header p { font-size: 11px; color: #6b7280; }
    .report-title { text-align: center; margin-bottom: 24px; }
    .report-title h2 { font-size: 18px; font-weight: 600; color: #111827; }
    .report-title p { font-size: 11px; color: #6b7280; }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; text-align: center; }
    .info-card .label { font-size: 9px; font-weight: 600; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
    .info-card .value { font-size: 16px; font-weight: 700; color: #111827; }
    .info-card .value.red { color: #dc2626; }
    .info-card .value.green { color: #059669; }
    .info-card .value.blue { color: #2563eb; }
    .customer-details { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 6px; }
    .customer-details dt { font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
    .customer-details dd { font-size: 12px; color: #111827; margin-top: 2px; }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .section-title { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
    .table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .table thead { background: #f3f4f6; }
    .table th { padding: 8px 10px; text-align: left; font-weight: 600; color: #374151; text-transform: uppercase; font-size: 9px; border-bottom: 1px solid #d1d5db; }
    .table td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; color: #374151; }
    .table tbody tr:last-child td { border-bottom: none; }
    .table .right { text-align: right; }
    .table .bold { font-weight: 600; }
    .table .green { color: #059669; }
    .table .red { color: #dc2626; }
    .table tfoot td { padding: 8px 10px; font-weight: 700; background: #f9fafb; border-top: 2px solid #d1d5db; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 600; }
    .badge.paid { background: #d1fae5; color: #065f46; }
    .badge.partial { background: #fef3c7; color: #92400e; }
    .badge.pending { background: #e5e7eb; color: #374151; }
    .badge.refunded { background: #fee2e2; color: #991b1b; }
    .debit { color: #dc2626; }
    .credit { color: #059669; }
    .footer { text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb; margin-top: 32px; font-size: 9px; color: #9ca3af; }
    .back-btn { position: fixed; top: 16px; right: 16px; z-index: 50; background: #1e40af; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer; }
  </style>
</head>
<body>
  <button class="back-btn no-print" onclick="window.history.back()">Close</button>
  <div class="container">
    <div class="header">
      <h1>${shopName}</h1>
      ${shopAddress ? `<p>${shopAddress}</p>` : ""}
      ${shopPhone ? `<p>Phone: ${shopPhone}</p>` : ""}
    </div>

    <div class="report-title">
      <h2>Customer Record</h2>
      <p>${customer.name} | Generated: ${new Date().toLocaleString()}</p>
    </div>

    <dl class="customer-details">
      <div>
        <dt>Customer ID</dt>
        <dd>${customer.id.slice(0, 8).toUpperCase()}</dd>
      </div>
      <div>
        <dt>Type</dt>
        <dd>${customer.type}</dd>
      </div>
      <div>
        <dt>Phone</dt>
        <dd>${customer.phone || "-"}</dd>
      </div>
      <div>
        <dt>Address</dt>
        <dd>${customer.address || "-"}</dd>
      </div>
      <div>
        <dt>Registered</dt>
        <dd>${new Date(customer.created_at).toLocaleDateString()}</dd>
      </div>
      <div>
        <dt>Khata Account</dt>
        <dd>${khata ? "Yes" : "No"}</dd>
      </div>
    </dl>

    <div class="info-grid">
      <div class="info-card">
        <div class="label">Total Orders</div>
        <div class="value blue">${orders.length}</div>
      </div>
      <div class="info-card">
        <div class="label">Total Spent</div>
        <div class="value">${currency} ${totalSpent.toLocaleString()}</div>
      </div>
      <div class="info-card">
        <div class="label">Total Paid</div>
        <div class="value green">${currency} ${totalPaid.toLocaleString()}</div>
      </div>
      <div class="info-card">
        <div class="label">Outstanding</div>
        <div class="value ${totalBalance > 0 ? "red" : "green"}">${currency} ${totalBalance.toLocaleString()}</div>
      </div>
    </div>

    ${khata ? `
    <div class="info-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="info-card">
        <div class="label">Opening Balance</div>
        <div class="value">${currency} ${(khata.opening_balance || 0).toLocaleString()}</div>
      </div>
      <div class="info-card">
        <div class="label">Current Khata Balance</div>
        <div class="value red">${currency} ${(khata.current_balance || 0).toLocaleString()}</div>
      </div>
      <div class="info-card">
        <div class="label">Khata Transactions</div>
        <div class="value">${khataTransactions.length}</div>
      </div>
    </div>
    ` : ""}

    <div class="section">
      <div class="section-title">Order History (${orders.length} orders)</div>
      ${orders.length > 0 ? `
      <table class="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th class="right">Total</th>
            <th class="right">Paid</th>
            <th class="right">Balance</th>
            <th>Status</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
          <tr>
            <td class="bold">${o.id.slice(0, 8).toUpperCase()}</td>
            <td>${new Date(o.created_at).toLocaleDateString()}</td>
            <td class="right">${currency} ${(o.total_amount || 0).toLocaleString()}</td>
            <td class="right green">${currency} ${(o.amount_paid || 0).toLocaleString()}</td>
            <td class="right ${o.balance_due > 0 ? "red" : "green"}">${currency} ${(o.balance_due || 0).toLocaleString()}</td>
            <td><span class="badge ${o.status}">${o.status}</span></td>
            <td>${o.payment_method}</td>
          </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="bold">Totals</td>
            <td class="right bold">${currency} ${totalSpent.toLocaleString()}</td>
            <td class="right bold green">${currency} ${totalPaid.toLocaleString()}</td>
            <td class="right bold ${totalBalance > 0 ? "red" : "green"}">${currency} ${totalBalance.toLocaleString()}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
      ` : "<p class='text-gray-500'>No orders found.</p>"}
    </div>

    ${khataTransactions.length > 0 ? `
    <div class="section">
      <div class="section-title">Khata Transactions (${khataTransactions.length})</div>
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th class="right">Amount</th>
            <th>Order</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${khataTransactions.map(kt => `
          <tr>
            <td>${new Date(kt.created_at).toLocaleDateString()}</td>
            <td class="${kt.type === 'debit' ? 'debit' : 'credit'} font-bold">${kt.type === 'debit' ? "Debit (Owed)" : "Credit (Paid)"}</td>
            <td class="right ${kt.type === 'debit' ? 'debit' : 'credit'} font-bold">${currency} ${(kt.amount || 0).toLocaleString()}</td>
            <td>${kt.order_id ? kt.order_id.slice(0, 8).toUpperCase() : "-"}</td>
            <td>${kt.notes || "-"}</td>
          </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ` : ""}

    <div class="footer">
      <p>${shopName} | Customer Record | ${new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" })}</p>
    </div>
  </div>
  <script>
    setTimeout(() => {
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      document.title = "customer_${customer.name.replace(/\\s+/g, "_")}_${timestamp}";
      window.print();
    }, 800);
  </script>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("Customer export error:", error);
    return NextResponse.json({ success: false, error: "Failed to export: " + error.message }, { status: 500 });
  }
}
