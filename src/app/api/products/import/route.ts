import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb, transaction } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

// Proper CSV parser that handles quoted commas
function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        row.push(currentVal.trim());
        result.push(row);
        row = [];
        currentVal = '';
        if (char === '\r') i++; // skip \n
      } else {
        currentVal += char;
      }
    }
  }
  
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    result.push(row);
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length < 2) {
      return NextResponse.json({ success: false, error: "CSV must contain at least a header and one data row" }, { status: 400 });
    }

    const headers = rows[0].map(h => h.toLowerCase());
    const dataRows = rows.slice(1).filter(r => r.some(c => c.trim() !== ""));

    const db = getDb();
    let imported = 0;
    let failed = 0;
    const errors: any[] = [];

    const doImport = () => {
      for (let i = 0; i < dataRows.length; i++) {
        const cells = dataRows[i];
        const rowData: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowData[h] = cells[idx] || "";
        });

        const name = rowData["name"];
        const itemCode = rowData["item_code"] || "";
        if (!name) {
          failed++;
          errors.push({ row: i + 2, error: "Product name is missing" });
          continue;
        }

        try {
          const now = new Date().toISOString();
          const purchasePrice = Number(rowData["purchase_price"] || 0);
          const salePrice = Number(rowData["sale_price"] || 0);
          const quantity = Number(rowData["quantity"] || 0);
          const minDiscount = Number(rowData["min_discount"] || 0);
          const maxDiscount = Number(rowData["max_discount"] || 0);
          const minStock = Number(rowData["min_stock"] || 5);
          const description = rowData["description"] || "";
          const unit = rowData["unit"] || "piece";
          const category = rowData["category"] || "";
          const sku = rowData["sku"] || "";
          const variantName = rowData["variant_name"] || "";

          // Upsert logic: find existing product by name or item_code
          let existingProduct;
          if (itemCode) {
            existingProduct = db.prepare("SELECT * FROM products WHERE item_code = ? AND is_active = 1").get(itemCode) as any;
          }
          if (!existingProduct) {
            existingProduct = db.prepare("SELECT * FROM products WHERE name = ? AND is_active = 1").get(name) as any;
          }

          let productId;
          if (existingProduct) {
            productId = existingProduct.id;
            // Update parent product
            db.prepare(`
              UPDATE products SET 
                description = ?, sku = ?, purchase_price = ?, sale_price = ?, price = ?, stock = ?, quantity = ?, min_stock = ?, min_discount = ?, max_discount = ?, unit = ?, category = ?, updated_at = ?
              WHERE id = ?
            `).run(
              description || existingProduct.description, 
              sku || existingProduct.sku, 
              purchasePrice || existingProduct.purchase_price, 
              salePrice || existingProduct.sale_price, 
              salePrice || existingProduct.price,
              quantity || existingProduct.stock,
              quantity || existingProduct.quantity,
              minStock || existingProduct.min_stock,
              minDiscount || existingProduct.min_discount,
              maxDiscount || existingProduct.max_discount,
              unit || existingProduct.unit,
              category || existingProduct.category,
              now,
              productId
            );
          } else {
            productId = randomUUID();
            db.prepare(`
              INSERT INTO products (id, name, description, item_code, sku, purchase_price, sale_price, price, stock, quantity, min_stock, min_discount, max_discount, unit, category, is_active, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            `).run(
              productId, name, description, itemCode, sku, purchasePrice, salePrice, salePrice, quantity, quantity, minStock, minDiscount, maxDiscount, unit, category, now
            );
          }

          // Handle variant if present
          if (variantName) {
            const variantItemCode = rowData["variant_item_code"] || itemCode;
            let existingVariant;
            if (variantItemCode) {
              existingVariant = db.prepare("SELECT * FROM product_variants WHERE product_id = ? AND item_code = ? AND is_active = 1").get(productId, variantItemCode) as any;
            }
            if (!existingVariant) {
              existingVariant = db.prepare("SELECT * FROM product_variants WHERE product_id = ? AND name = ? AND is_active = 1").get(productId, variantName) as any;
            }

            if (existingVariant) {
              db.prepare(`
                UPDATE product_variants SET
                  purchase_price = ?, sale_price = ?, stock = ?, is_active = 1
                WHERE id = ?
              `).run(
                purchasePrice || existingVariant.purchase_price,
                salePrice || existingVariant.sale_price,
                quantity || existingVariant.stock,
                existingVariant.id
              );
            } else {
              const variantId = randomUUID();
              db.prepare(`
                INSERT INTO product_variants (id, product_id, name, item_code, purchase_price, sale_price, stock, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
              `).run(
                variantId, productId, variantName, variantItemCode, purchasePrice, salePrice, quantity, now
              );
            }
          }

          imported++;
        } catch (e: any) {
          failed++;
          errors.push({ row: i + 2, error: e.message });
        }
      }
    };

    transaction(doImport);

    return NextResponse.json({ 
      success: true, 
      result: { total: dataRows.length, imported, failed, errors } 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to process file" }, { status: 500 });
  }
}
