/**
 * Products Import API - CSV import with validation
 * POST /api/products/import
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProductCSVRow, BulkImportResult } from '@/types/database.types';

/**
 * Parse CSV content into rows
 */
function parseCSV(content: string): string[][] {
  const lines = content.trim().split('\n');
  return lines.map((line) => line.split(',').map((cell) => cell.trim()));
}

/**
 * Validate and transform CSV row into product data
 */
function validateProductRow(
  row: string[],
  headers: string[],
  rowIndex: number
): { valid: boolean; data?: Partial<ProductCSVRow>; error?: string } {
  try {
    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowData[header.toLowerCase()] = row[index] || '';
    });

    // Required fields
    const name = rowData['name']?.trim();
    if (!name) {
      return { valid: false, error: `Row ${rowIndex}: Missing product name` };
    }

    const purchasePriceStr = rowData['purchase_price']?.trim();
    if (!purchasePriceStr) {
      return { valid: false, error: `Row ${rowIndex}: Missing purchase price` };
    }
    const purchasePrice = parseFloat(purchasePriceStr);
    if (isNaN(purchasePrice) || purchasePrice < 0) {
      return { valid: false, error: `Row ${rowIndex}: Invalid purchase price` };
    }

    const salePriceStr = rowData['sale_price']?.trim();
    if (!salePriceStr) {
      return { valid: false, error: `Row ${rowIndex}: Missing sale price` };
    }
    const salePrice = parseFloat(salePriceStr);
    if (isNaN(salePrice) || salePrice < 0) {
      return { valid: false, error: `Row ${rowIndex}: Invalid sale price` };
    }

    const quantityStr = rowData['quantity']?.trim();
    if (!quantityStr) {
      return { valid: false, error: `Row ${rowIndex}: Missing quantity` };
    }
    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity < 0) {
      return { valid: false, error: `Row ${rowIndex}: Invalid quantity` };
    }

    // Optional fields
    const unit = rowData['unit']?.trim() || 'piece';
    const validUnits = ['piece', 'dozen', 'kg', 'packet', 'litre', 'meter'];
    if (!validUnits.includes(unit)) {
      return {
        valid: false,
        error: `Row ${rowIndex}: Invalid unit. Must be one of: ${validUnits.join(', ')}`,
      };
    }

    const minDiscountStr = rowData['min_discount']?.trim() || '0';
    const minDiscount = parseFloat(minDiscountStr);
    if (isNaN(minDiscount) || minDiscount < 0 || minDiscount > 100) {
      return { valid: false, error: `Row ${rowIndex}: Invalid min_discount` };
    }

    const maxDiscountStr = rowData['max_discount']?.trim() || '0';
    const maxDiscount = parseFloat(maxDiscountStr);
    if (isNaN(maxDiscount) || maxDiscount < 0 || maxDiscount > 100) {
      return { valid: false, error: `Row ${rowIndex}: Invalid max_discount` };
    }

    if (minDiscount > maxDiscount) {
      return {
        valid: false,
        error: `Row ${rowIndex}: min_discount cannot be greater than max_discount`,
      };
    }

    return {
      valid: true,
      data: {
        name,
        description: rowData['description']?.trim() || undefined,
        purchase_price: purchasePrice,
        sale_price: salePrice,
        quantity,
        unit: unit as any,
        item_code: rowData['item_code']?.trim() || undefined,
        min_discount: minDiscount,
        max_discount: maxDiscount,
        variant_name: rowData['variant_name']?.trim() || undefined,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Row ${rowIndex}: ${error instanceof Error ? error.message : 'Invalid row format'}`,
    };
  }
}

/**
 * POST - Import products from CSV
 * Body: FormData with 'file' field containing CSV
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV file' },
        { status: 400 }
      );
    }

    const content = await file.text();
    const rows = parseCSV(content);

    if (rows.length < 2) {
      return NextResponse.json(
        { error: 'CSV must contain at least one header row and one data row' },
        { status: 400 }
      );
    }

    const headers = rows[0];
    const requiredHeaders = ['name', 'purchase_price', 'sale_price', 'quantity'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required CSV headers: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    const result: BulkImportResult = {
      total: rows.length - 1,
      imported: 0,
      failed: 0,
      errors: [],
    };

    const productsToInsert: any[] = [];

    // Validate all rows first
    for (let i = 1; i < rows.length; i++) {
      const validation = validateProductRow(rows[i], headers, i + 1);
      if (!validation.valid) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          error: validation.error || 'Validation failed',
        });
      } else if (validation.data) {
        productsToInsert.push({
          name: validation.data.name,
          description: validation.data.description || null,
          purchase_price: validation.data.purchase_price,
          sale_price: validation.data.sale_price,
          quantity: validation.data.quantity,
          unit: validation.data.unit || 'piece',
          item_code: validation.data.item_code || null,
          min_discount: validation.data.min_discount || 0,
          max_discount: validation.data.max_discount || 0,
          is_active: true,
        });
      }
    }

    // Insert all valid products
    if (productsToInsert.length > 0) {
      const productsWithUserId = productsToInsert.map(p => ({
        ...p,
        user_id: user.id
      }));
      
      const { data, error } = await supabase
        .from('products')
        .insert(productsWithUserId)
        .select();

      if (error) {
        console.error('Batch insert error:', error);
        return NextResponse.json(
          { error: `Batch insert failed: ${error.message}` },
          { status: 500 }
        );
      }

      result.imported = data?.length || 0;
    }

    return NextResponse.json(
      {
        success: true,
        message: `Import completed: ${result.imported} products imported, ${result.failed} failed`,
        result,
      },
      { status: result.failed > 0 ? 207 : 201 }
    );
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to import products',
      },
      { status: 500 }
    );
  }
}
