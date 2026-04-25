// @ts-nocheck
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
 ArrowLeft,
 Upload,
 AlertCircle,
 CheckCircle2,
 ChevronRight,
 ChevronLeft,
 Download,
} from "lucide-react";

interface CSVRow {
 [key: string]: string;
}

interface MappedColumn {
 csvColumn: string;
 mappedField: string | null;
}

interface ValidationError {
 row: number;
 error: string;
}

export default function ImportProductsPage() {
 const router = useRouter();
 const fileInputRef = useRef<HTMLInputElement>(null);

 // Wizard states
 const [step, setStep] = useState(1);
 const [file, setFile] = useState<File | null>(null);
 const [csvRows, setCSVRows] = useState<CSVRow[]>([]);
 const [csvColumns, setCSVColumns] = useState<string[]>([]);
 const [columnMapping, setColumnMapping] = useState<MappedColumn[]>([]);
 const [previewRows, setPreviewRows] = useState<CSVRow[]>([]);
 const [error, setError] = useState<string>("");
 const [importing, setImporting] = useState(false);
 const [importResult, setImportResult] = useState<any>(null);

 const requiredFields = ["name", "purchase_price", "sale_price", "quantity"];
 const optionalFields = [
  "description",
  "unit",
  "item_code",
  "min_discount",
  "max_discount",
  "variant_name",
 ];
 const allFields = [...requiredFields, ...optionalFields];

 // Step 1: File Upload
 const handleFileUpload = (uploadedFile: File) => {
  if (!uploadedFile.name.endsWith(".csv")) {
   setError("Please upload a CSV file");
   return;
  }

  setFile(uploadedFile);
  setError("");

  // Parse CSV
  const reader = new FileReader();
  reader.onload = (e) => {
   try {
    const content = e.target?.result as string;
    const lines = content.trim().split("\n");

    if (lines.length < 2) {
     setError("CSV must contain at least header and one data row");
     setFile(null);
     return;
    }

    // Parse headers
    const headers = lines[0].split(",").map((h) => h.trim());
    setCSVColumns(headers);

    // Parse data rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
     const cells = lines[i].split(",").map((c) => c.trim());
     const row: CSVRow = {};
     headers.forEach((header, idx) => {
      row[header] = cells[idx] || "";
     });
     rows.push(row);
    }

    setCSVRows(rows);

    // Initialize column mapping (auto-map if headers match field names)
    const mapping: MappedColumn[] = headers.map((col) => ({
     csvColumn: col,
     mappedField: allFields.includes(col.toLowerCase()) ? col.toLowerCase() : null,
    }));
    setColumnMapping(mapping);

    setPreviewRows(rows.slice(0, 5));
    setStep(2);
   } catch (err) {
    setError("Failed to parse CSV file");
    setFile(null);
   }
  };
  reader.readAsText(uploadedFile);
 };

 const handleDragDrop = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const droppedFile = e.dataTransfer.files?.[0];
  if (droppedFile) {
   handleFileUpload(droppedFile);
  }
 };

 // Step 2: Column Mapping
 const updateMapping = (csvColumn: string, field: string | null) => {
  setColumnMapping((prev) =>
   prev.map((m) =>
    m.csvColumn === csvColumn ? { ...m, mappedField: field } : m
   )
  );
 };

 const validateMapping = () => {
  const mapped = columnMapping.filter((m) => m.mappedField !== null);
  const mappedFields = mapped.map((m) => m.mappedField);

  const missingRequired = requiredFields.filter(
   (f) => !mappedFields.includes(f)
  );

  if (missingRequired.length > 0) {
   setError(
    `Missing required fields: ${missingRequired.join(", ")}`
   );
   return false;
  }

  setError("");
  setStep(3);
  return true;
 };

 // Step 3: Preview & Step 4: Import
 const handleImport = async () => {
  setImporting(true);
  setError("");

  try {
   // Create FormData with the original file
   const formData = new FormData();
   if (file) {
    formData.append("file", file);
   }

   const response = await fetch("/api/products/import", {
    method: "POST",
    headers: {
      "x-pb-email": localStorage.getItem("pb_admin_email") || "",
      "x-pb-password": localStorage.getItem("pb_admin_password") || "",
    },
    body: formData,
   });

   const data = await response.json();

   if (!response.ok) {
    setError(data.error || "Import failed");
    setImporting(false);
    return;
   }

   setImportResult(data.result);
   setStep(4);
  } catch (err) {
   setError(
    err instanceof Error ? err.message : "Failed to import products"
   );
  } finally {
   setImporting(false);
  }
 };

 const downloadTemplate = () => {
  const headers = [
   "name",
   "purchase_price",
   "sale_price",
   "quantity",
   "description",
   "unit",
   "item_code",
   "min_discount",
   "max_discount",
  ];

  const exampleData = [
   headers.join(","),
   'Widget A,500,750,100,"High quality widget",piece,WID-001,0,10',
   'Widget B,300,450,50,"Standard widget",piece,WID-002,0,5',
  ].join("\n");

  const blob = new Blob([exampleData], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "products-template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
 };

 return (
  <div className="p-6 space-y-6">
   {/* Header */}
   <div className="flex items-center gap-4">
    <Link
     href="/app/products"
     className="p-2 hover:bg-gray-100 transition-colors"
    >
     <ArrowLeft className="w-6 h-6 text-gray-600" />
    </Link>
    <div>
     <h1 className="text-3xl font-bold text-gray-900">Import Products</h1>
     <p className="text-gray-600">Upload and map products from CSV file</p>
    </div>
   </div>

   {/* Progress Steps */}
   <div className="flex items-center justify-center gap-2 mb-8">
    {[1, 2, 3, 4].map((s, idx) => (
     <div key={s} className="flex items-center">
      <div
       className={`w-8 h-8 flex items-center justify-center font-medium transition-colors ${
        s <= step
         ? "bg-blue-600 text-white"
         : "bg-gray-200 text-gray-600"
       }`}
      >
       {s}
      </div>
      {idx < 3 && (
       <div
        className={`w-12 h-1 mx-1 transition-colors ${
         s < step ? "bg-blue-600" : "bg-gray-200"
        }`}
       />
      )}
     </div>
    ))}
   </div>

   {/* Step Labels */}
   <div className="flex justify-center gap-12 text-center text-sm font-medium">
    <div>Upload</div>
    <div>Map Columns</div>
    <div>Preview</div>
    <div>Result</div>
   </div>

   {/* Error Display */}
   {error && (
    <div className="bg-red-50 border border-red-200 p-4 flex gap-3">
     <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
     <div>
      <h3 className="font-medium text-red-900">Error</h3>
      <p className="text-red-700 text-sm">{error}</p>
     </div>
    </div>
   )}

   {/* Step 1: Upload */}
   {step === 1 && (
    <div className="space-y-6">
     <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDragDrop}
      className="border-2 border-dashed border-gray-300 p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
     >
      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 className="font-medium text-gray-900 mb-2">
       Drag and drop your CSV file
      </h3>
      <p className="text-gray-600 text-sm mb-4">
       Or click to browse. File size limit: 10MB
      </p>
      <button
       type="button"
       className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium"
      >
       Select File
      </button>
      <input
       ref={fileInputRef}
       type="file"
       accept=".csv"
       onChange={(e) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) {
         handleFileUpload(uploadedFile);
        }
       }}
       className="hidden"
      />
     </div>

     <div className="bg-blue-50 border border-blue-200 p-4">
      <h4 className="font-medium text-blue-900 mb-2">CSV Format</h4>
      <p className="text-blue-700 text-sm mb-3">
       Your CSV file should include these columns:
      </p>
      <div className="space-y-1 text-sm text-blue-700">
       <p className="font-medium">Required:</p>
       <p className="ml-2">
        • name, purchase_price, sale_price, quantity
       </p>
       <p className="font-medium mt-2">Optional:</p>
       <p className="ml-2">
        • description, unit, item_code, min_discount, max_discount,
        variant_name
       </p>
      </div>
      <button
       onClick={downloadTemplate}
       className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm"
      >
       <Download className="w-4 h-4" />
       Download Template
      </button>
     </div>
    </div>
   )}

   {/* Step 2: Column Mapping */}
   {step === 2 && (
    <div className="space-y-6">
     <div className="bg-gray-50 p-6">
      <h3 className="font-medium text-gray-900 mb-4">Map CSV Columns</h3>
      <p className="text-gray-600 text-sm mb-6">
       Map your CSV columns to product fields. All required fields must
       be mapped.
      </p>

      <div className="space-y-4">
       {columnMapping.map((mapping) => (
        <div
         key={mapping.csvColumn}
         className="flex items-center gap-4 p-4 bg-white border border-gray-200"
        >
         <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
           CSV Column: <span className="font-mono text-blue-600">{mapping.csvColumn}</span>
          </label>
          <select
           value={mapping.mappedField || ""}
           onChange={(e) =>
            updateMapping(mapping.csvColumn, e.target.value || null)
           }
           className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
           <option value="">-- Skip this column --</option>
           {allFields.map((field) => (
            <option key={field} value={field}>
             {field}
             {requiredFields.includes(field) ? " (required)" : ""}
            </option>
           ))}
          </select>
         </div>
        </div>
       ))}
      </div>

      {/* Required fields checklist */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4">
       <h4 className="font-medium text-yellow-900 mb-2">
        Required Fields
       </h4>
       <div className="space-y-1">
        {requiredFields.map((field) => {
         const mapped = columnMapping.some(
          (m) => m.mappedField === field
         );
         return (
          <div
           key={field}
           className="flex items-center gap-2 text-sm text-yellow-700"
          >
           <div
            className={`w-4 h-4 flex items-center justify-center ${
             mapped
              ? "bg-green-500 text-white text-xs"
              : "bg-red-500 text-white text-xs"
            }`}
           >
            {mapped ? "✓" : "✕"}
           </div>
           <span>{field}</span>
          </div>
         );
        })}
       </div>
      </div>
     </div>

     {/* Navigation */}
     <div className="flex justify-between">
      <button
       onClick={() => setStep(1)}
       className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
      >
       <ChevronLeft className="w-4 h-4" />
       Back
      </button>
      <button
       onClick={validateMapping}
       className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium"
      >
       Next
       <ChevronRight className="w-4 h-4" />
      </button>
     </div>
    </div>
   )}

   {/* Step 3: Preview */}
   {step === 3 && (
    <div className="space-y-6">
     <div className="bg-gray-50 p-6 overflow-x-auto">
      <h3 className="font-medium text-gray-900 mb-4">
       Preview ({csvRows.length} rows)
      </h3>

      <table className="w-full border-collapse text-sm">
       <thead>
        <tr className="border-b border-gray-300 bg-gray-100">
         <th className="px-4 py-2 text-left text-gray-700 font-medium">
          #
         </th>
         {columnMapping
          .filter((m) => m.mappedField)
          .map((m) => (
           <th
            key={m.csvColumn}
            className="px-4 py-2 text-left text-gray-700 font-medium"
           >
            {m.mappedField}
           </th>
          ))}
        </tr>
       </thead>
       <tbody>
        {previewRows.map((row, rowIdx) => (
         <tr key={rowIdx} className="border-b border-gray-200">
          <td className="px-4 py-2 text-gray-600">{rowIdx + 1}</td>
          {columnMapping
           .filter((m) => m.mappedField)
           .map((m) => (
            <td
             key={m.csvColumn}
             className="px-4 py-2 text-gray-700"
            >
             {row[m.csvColumn] || "—"}
            </td>
           ))}
         </tr>
        ))}
       </tbody>
      </table>

      {csvRows.length > 5 && (
       <p className="mt-4 text-sm text-gray-600">
        ... and {csvRows.length - 5} more rows
       </p>
      )}
     </div>

     {/* Navigation */}
     <div className="flex justify-between">
      <button
       onClick={() => setStep(2)}
       className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
      >
       <ChevronLeft className="w-4 h-4" />
       Back
      </button>
      <button
       onClick={handleImport}
       disabled={importing}
       className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-medium disabled:bg-gray-400"
      >
       {importing ? "Importing..." : "Import Products"}
       <ChevronRight className="w-4 h-4" />
      </button>
     </div>
    </div>
   )}

   {/* Step 4: Results */}
   {step === 4 && importResult && (
    <div className="space-y-6">
     <div className="bg-green-50 border border-green-200 p-6">
      <div className="flex items-center gap-3 mb-4">
       <CheckCircle2 className="w-6 h-6 text-green-600" />
       <h3 className="text-lg font-medium text-green-900">
        Import Complete!
       </h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
       <div className="bg-white p-4 border border-green-200">
        <p className="text-sm text-gray-600 mb-1">Total Rows</p>
        <p className="text-2xl font-bold text-gray-900">
         {importResult.total}
        </p>
       </div>
       <div className="bg-white p-4 border border-green-200">
        <p className="text-sm text-gray-600 mb-1">Imported</p>
        <p className="text-2xl font-bold text-green-600">
         {importResult.imported}
        </p>
       </div>
       <div className="bg-white p-4 border border-green-200">
        <p className="text-sm text-gray-600 mb-1">Failed</p>
        <p className="text-2xl font-bold text-red-600">
         {importResult.failed}
        </p>
       </div>
      </div>

      {importResult.errors && importResult.errors.length > 0 && (
       <div className="bg-red-50 border border-red-200 p-4 max-h-64 overflow-y-auto">
        <h4 className="font-medium text-red-900 mb-3">
         Errors ({importResult.errors.length})
        </h4>
        <div className="space-y-2">
         {importResult.errors.map((err: any, idx: number) => (
          <div key={idx} className="text-sm text-red-700">
           <span className="font-medium">Row {err.row}:</span>{" "}
           {err.error}
          </div>
         ))}
        </div>
       </div>
      )}
     </div>

     {/* Navigation */}
     <div className="flex justify-between">
      <Link
       href="/app/products"
       className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
      >
       <ChevronLeft className="w-4 h-4" />
       View Products
      </Link>
      <button
       onClick={() => {
        setStep(1);
        setFile(null);
        setError("");
        setImportResult(null);
       }}
       className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium"
      >
       <Upload className="w-4 h-4" />
       Import More
      </button>
     </div>
    </div>
   )}
  </div>
 );
}
