"use client";

import { useEffect, useState } from "react";

interface PrintData {
  stats: any;
  profitData: any;
  salesReport: any;
  categoriesData: any[];
  timeRange: string;
}

function formatTimeRange(range: string): string {
  switch (range) {
    case "today":
      return "Today";
    case "7days":
      return "Last 7 Days";
    case "30days":
      return "Last 30 Days";
    case "year":
      return "This Year";
    default:
      return "Last 7 Days";
  }
}

function getDateRangeLabel(timeRange: string): string {
  const now = new Date();
  const to = now.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  let from: string;
  switch (timeRange) {
    case "today":
      from = to;
      break;
    case "7days":
      from = new Date(now.getTime() - 6 * 86400000).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
      break;
    case "30days":
      from = new Date(now.getTime() - 29 * 86400000).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
      break;
    case "year":
      from = `Jan 01, ${now.getFullYear()}`;
      break;
    default:
      from = new Date(now.getTime() - 6 * 86400000).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  }
  return `${from} - ${to}`;
}

export default function PrintReportPage() {
  const [data, setData] = useState<PrintData | null>(null);
  const [shopSettings, setShopSettings] = useState<any>(null);

  useEffect(() => {
    let reportTimeRange = "7days";
    const stored = localStorage.getItem("reportPrintData");
    if (stored) {
      try {
        const parsedData = JSON.parse(stored) as PrintData;
        setData(parsedData);
        reportTimeRange = parsedData.timeRange || "7days";
      } catch (e) {
        console.error("Failed to parse report data:", e);
      }
      localStorage.removeItem("reportPrintData");
    }

    fetch("/api/settings/shop")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setShopSettings(json.data);
        }
      })
      .catch(() => {});

    setTimeout(() => {
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      document.title = `${timestamp}_${formatTimeRange(reportTimeRange)}_report`;
      window.print();
    }, 800);
  }, []);

  const handleBack = () => {
    if (window.opener) {
      window.close();
    } else {
      window.history.back();
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading report data...
      </div>
    );
  }

  const { stats, profitData, salesReport, categoriesData, timeRange } = data;

  const totalRevenue = profitData?.revenue ?? stats?.totalRevenue ?? 0;
  const totalOrders = stats?.ordersCount ?? 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const outstandingKhata = stats?.outstandingKhata ?? 0;
  const totalProfit = profitData?.profit ?? 0;
  const totalExpenses = profitData?.expenses ?? 0;
  const totalCogs = profitData?.cogs ?? 0;
  const grossProfit = totalRevenue - totalCogs;

  const expensesList = salesReport?.expenses?.expenses || [];
  const khataList = salesReport?.khata || [];
  const topProducts = salesReport?.topProducts || [];

  const shopName = shopSettings?.shop_name || shopSettings?.shopName || shopSettings?.name || "My Shop";
  const shopAddress = shopSettings?.shop_address || shopSettings?.address || "";
  const shopPhone = shopSettings?.shop_phone || shopSettings?.phone || "";

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 15mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111827; background: #fff; font-size: 11px; line-height: 1.5; }
        .print-container { max-width: 210mm; margin: 0 auto; padding: 20px; }
        .company-header { text-align: center; padding-bottom: 16px; border-bottom: 2px solid #1e40af; margin-bottom: 24px; }
        .company-header h1 { font-size: 22px; font-weight: 700; color: #1e40af; margin-bottom: 4px; }
        .company-header p { font-size: 11px; color: #6b7280; }
        .report-title { text-align: center; margin-bottom: 24px; }
        .report-title h2 { font-size: 18px; font-weight: 600; color: #111827; }
        .report-title p { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
        .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; text-align: center; }
        .summary-card .label { font-size: 9px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 4px; }
        .summary-card .value { font-size: 16px; font-weight: 700; color: #111827; }
        .summary-card .value.green { color: #059669; }
        .summary-card .value.red { color: #dc2626; }
        .summary-card .value.blue { color: #2563eb; }
        .section { margin-bottom: 24px; page-break-inside: avoid; }
        .section-title { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 6px; }
        .section-title .dot { width: 8px; height: 8px; border-radius: 50%; }
        .table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .table thead { background: #f3f4f6; }
        .table th { padding: 8px 10px; text-align: left; font-weight: 600; color: #374151; text-transform: uppercase; font-size: 9px; letter-spacing: 0.3px; border-bottom: 1px solid #d1d5db; }
        .table td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; color: #374151; }
        .table tbody tr:last-child td { border-bottom: none; }
        .table .right { text-align: right; }
        .table .bold { font-weight: 600; color: #111827; }
        .table .green { color: #059669; font-weight: 600; }
        .table .red { color: #dc2626; font-weight: 600; }
        .table tfoot td { padding: 8px 10px; font-weight: 700; background: #f9fafb; border-top: 2px solid #d1d5db; }
        .profit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .profit-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; text-align: center; }
        .profit-card .label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
        .profit-card .value { font-size: 15px; font-weight: 700; }
        .footer { text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb; margin-top: 32px; font-size: 9px; color: #9ca3af; }
        .back-btn { position: fixed; top: 16px; right: 16px; z-index: 50; background: #1e40af; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; }
        .back-btn:hover { background: #1e3a8a; }
      `}</style>

      <button className="back-btn no-print" onClick={handleBack}>
        Close
      </button>

      <div className="print-container">
        <div className="company-header">
          <h1>{shopName}</h1>
          {shopAddress && <p>{shopAddress}</p>}
          {shopPhone && <p>Phone: {shopPhone}</p>}
        </div>

        <div className="report-title">
          <h2>Analytics & Reports</h2>
          <p>{formatTimeRange(timeRange)} | {getDateRangeLabel(timeRange)}</p>
          <p className="text-xs text-gray-400 mt-1">Generated on {new Date().toLocaleString("en-PK")}</p>
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="label">Revenue</div>
            <div className="value blue">PKR {totalRevenue.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="label">Orders</div>
            <div className="value">{totalOrders.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="label">Avg Order</div>
            <div className="value">PKR {avgOrderValue.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="label">Khata</div>
            <div className="value red">PKR {outstandingKhata.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="label">Net Profit</div>
            <div className={`value ${totalProfit >= 0 ? "green" : "red"}`}>
              PKR {totalProfit.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Profit & Loss Summary */}
        {(totalRevenue > 0 || totalCogs > 0 || totalExpenses > 0) && (
          <div className="profit-grid">
            <div className="profit-card">
              <div className="label">Gross Profit (Revenue - COGS)</div>
              <div className="value" style={{ color: "#059669" }}>
                PKR {grossProfit.toLocaleString()}
              </div>
            </div>
            <div className="profit-card">
              <div className="label">Total Expenses</div>
              <div className="value" style={{ color: "#dc2626" }}>
                PKR {totalExpenses.toLocaleString()}
              </div>
            </div>
            <div className="profit-card">
              <div className="label">Net Profit</div>
              <div className="value" style={{ color: totalProfit >= 0 ? "#059669" : "#dc2626" }}>
                PKR {totalProfit.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Revenue Trend Table */}
        {stats?.last7Days && stats.last7Days.length > 0 && (
          <div className="section">
            <div className="section-title">
              <span className="dot" style={{ background: "#3b82f6" }}></span>
              Revenue Trend
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="right">Sales (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {stats.last7Days.map((day: any, i: number) => (
                  <tr key={i}>
                    <td className="bold">{day.date}</td>
                    <td className="right">PKR {(day.sales || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="bold">Total</td>
                  <td className="right bold">
                    PKR {stats.last7Days.reduce((sum: number, d: any) => sum + (d.sales || 0), 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Top Selling Products */}
        {topProducts.length > 0 && (
          <div className="section">
            <div className="section-title">
              <span className="dot" style={{ background: "#10b981" }}></span>
              Top Selling Products
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th className="right">Qty Sold</th>
                  <th className="right">Revenue (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.slice(0, 10).map((product: any, i: number) => (
                  <tr key={product.id || i}>
                    <td className="bold">{i + 1}</td>
                    <td className="bold">{product.name}</td>
                    <td className="right">{product.qty_sold?.toLocaleString() || 0}</td>
                    <td className="right">PKR {(product.revenue || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Low Stock Alerts */}
        {stats?.lowStock && stats.lowStock.length > 0 && (
          <div className="section">
            <div className="section-title">
              <span className="dot" style={{ background: "#ef4444" }}></span>
              Low Stock Alerts
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="right">Current Stock</th>
                  <th className="right">Min Stock</th>
                  <th className="right">Shortage</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStock.map((product: any) => {
                  const current = product.stock ?? product.quantity ?? 0;
                  const min = product.min_stock ?? 0;
                  const shortage = min - current;
                  return (
                    <tr key={product.id}>
                      <td className="bold">{product.name}</td>
                      <td className="right red">{current}</td>
                      <td className="right">{min}</td>
                      <td className="right red">{shortage > 0 ? shortage : 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Expenses Summary */}
        {expensesList.length > 0 && (
          <div className="section">
            <div className="section-title">
              <span className="dot" style={{ background: "#f59e0b" }}></span>
              Expenses Summary
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="right">Amount (PKR)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {expensesList.map((exp: any, i: number) => (
                  <tr key={exp.id || i}>
                    <td className="bold">{exp.category || "General"}</td>
                    <td>{exp.description || "-"}</td>
                    <td className="right red">PKR {(exp.amount || 0).toLocaleString()}</td>
                    <td>{exp.date ? new Date(exp.date).toLocaleDateString("en-PK") : "-"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="bold">Total Expenses</td>
                  <td className="right bold red">PKR {totalExpenses.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Khata Summary */}
        {khataList.length > 0 && (
          <div className="section">
            <div className="section-title">
              <span className="dot" style={{ background: "#8b5cf6" }}></span>
              Outstanding Khata (Credit Accounts)
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th className="right">Outstanding (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {khataList.slice(0, 15).map((customer: any, i: number) => (
                  <tr key={customer.id || i}>
                    <td className="bold">{customer.customer_name || customer.name}</td>
                    <td>{customer.customer_phone || customer.phone || "-"}</td>
                    <td className="right red">PKR {(customer.current_balance || customer.balance || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="bold">Total Outstanding</td>
                  <td className="right bold red">PKR {outstandingKhata.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="footer">
          <p>{shopName} | Report generated automatically | {new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </>
  );
}
