export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "products";
    const format = url.searchParams.get("format") || "csv";

    let csv = "";
    let filename = "";

    switch (type) {
      case "products": {
        const products = db.prepare(`
          SELECT 
            p.id,
            p.name AS "Product Name",
            p.item_code AS "Item Code",
            p.sku AS "SKU",
            p.category AS "Category",
            p.description AS "Description",
            p.purchase_price AS "Purchase Price",
            p.sale_price AS "Sale Price",
            p.price AS "Current Price",
            p.stock AS "Stock",
            p.quantity AS "Quantity",
            p.min_stock AS "Min Stock",
            p.unit AS "Unit",
            p.min_discount AS "Min Discount (%)",
            p.max_discount AS "Max Discount (%)",
            p.is_active AS "Active",
            p.created_at AS "Created At"
          FROM products p
          WHERE p.is_active = 1
          ORDER BY p.name ASC
        `).all() as any[];

        filename = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
        
        if (products.length > 0) {
          const headers = Object.keys(products[0]);
          csv = headers.map(escapeCsv).join(",") + "\n";
          for (const row of products) {
            csv += headers.map(h => escapeCsv(row[h])).join(",") + "\n";
          }
        } else {
          csv = "id,Product Name,Item Code,SKU,Category,Description,Purchase Price,Sale Price,Current Price,Stock,Quantity,Min Stock,Unit,Min Discount (%),Max Discount (%),Active,Created At\n";
        }
        break;
      }

      case "customers": {
        const customers = db.prepare(`
          SELECT 
            c.id,
            c.name AS "Customer Name",
            c.phone AS "Phone",
            c.address AS "Address",
            c.type AS "Type",
            c.is_active AS "Active",
            c.created_at AS "Created At",
            COALESCE(k.current_balance, 0) AS "Khata Balance",
            COALESCE(k.opening_balance, 0) AS "Opening Balance",
            COALESCE((SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id AND o.is_active = 1), 0) AS "Total Orders",
            COALESCE((SELECT SUM(o.total_amount) FROM orders o WHERE o.customer_id = c.id AND o.is_active = 1), 0) AS "Total Spent"
          FROM customers c
          LEFT JOIN khata_accounts k ON k.customer_id = c.id
          WHERE c.is_active = 1 AND c.type != 'walkin'
          ORDER BY c.name ASC
        `).all() as any[];

        filename = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;

        if (customers.length > 0) {
          const headers = Object.keys(customers[0]);
          csv = headers.map(escapeCsv).join(",") + "\n";
          for (const row of customers) {
            csv += headers.map(h => escapeCsv(row[h])).join(",") + "\n";
          }
        } else {
          csv = "id,Customer Name,Phone,Address,Type,Active,Created At,Khata Balance,Opening Balance,Total Orders,Total Spent\n";
        }
        break;
      }

      case "orders": {
        const orders = db.prepare(`
          SELECT 
            o.id AS "Order ID",
            c.name AS "Customer",
            o.total_amount AS "Total Amount",
            o.amount_paid AS "Amount Paid",
            (o.total_amount - o.amount_paid) AS "Balance Due",
            o.status AS "Status",
            o.payment_method AS "Payment Method",
            o.discount_amount AS "Discount",
            o.subtotal AS "Subtotal",
            o.is_khata AS "On Khata",
            o.notes AS "Notes",
            o.created_at AS "Date"
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.is_active = 1
          ORDER BY o.created_at DESC
        `).all() as any[];

        filename = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;

        if (orders.length > 0) {
          const headers = Object.keys(orders[0]);
          csv = headers.map(escapeCsv).join(",") + "\n";
          for (const row of orders) {
            csv += headers.map(h => escapeCsv(row[h])).join(",") + "\n";
          }
        } else {
          csv = "Order ID,Customer,Total Amount,Amount Paid,Balance Due,Status,Payment Method,Discount,Subtotal,On Khata,Notes,Date\n";
        }
        break;
      }

      case "order_items": {
        const items = db.prepare(`
          SELECT 
            o.id AS "Order ID",
            c.name AS "Customer",
            oi.product_name AS "Product",
            oi.quantity AS "Qty",
            oi.unit_price AS "Unit Price",
            oi.purchase_price AS "Purchase Price",
            oi.discount_amount AS "Discount",
            oi.total_price AS "Line Total",
            (oi.total_price - (oi.purchase_price * oi.quantity)) AS "Profit",
            o.created_at AS "Date"
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.is_active = 1 AND o.status NOT IN ('cancelled', 'refunded')
          ORDER BY o.created_at DESC
        `).all() as any[];

        filename = `order_items_export_${new Date().toISOString().slice(0, 10)}.csv`;

        if (items.length > 0) {
          const headers = Object.keys(items[0]);
          csv = headers.map(escapeCsv).join(",") + "\n";
          for (const row of items) {
            csv += headers.map(h => escapeCsv(row[h])).join(",") + "\n";
          }
        } else {
          csv = "Order ID,Customer,Product,Qty,Unit Price,Purchase Price,Discount,Line Total,Profit,Date\n";
        }
        break;
      }

      case "deals": {
        const deals = db.prepare(`
          SELECT 
            d.id,
            d.name AS "Deal Name",
            d.description AS "Description",
            d.price AS "Price",
            d.is_active AS "Active",
            d.created_at AS "Created At",
            (SELECT COUNT(*) FROM deal_items di WHERE di.deal_id = d.id) AS "Items Count",
            (SELECT GROUP_CONCAT(p.name, ', ') FROM deal_items di JOIN products p ON di.product_id = p.id WHERE di.deal_id = d.id) AS "Products"
          FROM deals d
          WHERE d.is_active = 1
          ORDER BY d.created_at DESC
        `).all() as any[];

        filename = `deals_export_${new Date().toISOString().slice(0, 10)}.csv`;

        if (deals.length > 0) {
          const headers = Object.keys(deals[0]);
          csv = headers.map(escapeCsv).join(",") + "\n";
          for (const row of deals) {
            csv += headers.map(h => escapeCsv(row[h])).join(",") + "\n";
          }
        } else {
          csv = "id,Deal Name,Description,Price,Active,Created At,Items Count,Products\n";
        }
        break;
      }

      case "expenses": {
        const expenses = db.prepare(`
          SELECT 
            e.id,
            e.title AS "Title",
            e.category AS "Category",
            e.amount AS "Amount",
            e.notes AS "Notes",
            e.created_at AS "Date"
          FROM expenses e
          ORDER BY e.created_at DESC
        `).all() as any[];

        filename = `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`;

        if (expenses.length > 0) {
          const headers = Object.keys(expenses[0]);
          csv = headers.map(escapeCsv).join(",") + "\n";
          for (const row of expenses) {
            csv += headers.map(h => escapeCsv(row[h])).join(",") + "\n";
          }
        } else {
          csv = "id,Title,Category,Amount,Notes,Date\n";
        }
        break;
      }

      case "khata": {
        const khata = db.prepare(`
          SELECT 
            c.name AS "Customer",
            c.phone AS "Phone",
            c.address AS "Address",
            k.opening_balance AS "Opening Balance",
            k.current_balance AS "Current Balance",
            k.created_at AS "Account Created",
            k.updated_at AS "Last Updated",
            (SELECT COUNT(*) FROM khata_transactions kt WHERE kt.khata_account_id = k.id) AS "Transactions"
          FROM khata_accounts k
          JOIN customers c ON k.customer_id = c.id
          WHERE k.is_active = 1 AND k.current_balance > 0
          ORDER BY k.current_balance DESC
        `).all() as any[];

        filename = `khata_export_${new Date().toISOString().slice(0, 10)}.csv`;

        if (khata.length > 0) {
          const headers = Object.keys(khata[0]);
          csv = headers.map(escapeCsv).join(",") + "\n";
          for (const row of khata) {
            csv += headers.map(h => escapeCsv(row[h])).join(",") + "\n";
          }
        } else {
          csv = "Customer,Phone,Address,Opening Balance,Current Balance,Account Created,Last Updated,Transactions\n";
        }
        break;
      }

      default:
        return NextResponse.json({ success: false, error: "Invalid export type" }, { status: 400 });
    }

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ success: false, error: "Failed to export: " + error.message }, { status: 500 });
  }
}
