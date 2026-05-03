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
 Download,
 Loader2
} from "lucide-react";

export default function ImportProductsPage() {
 const router = useRouter();
 const fileInputRef = useRef<HTMLInputElement>(null);

 const [file, setFile] = useState<File | null>(null);
 const [error, setError] = useState<string>("");
 const [importing, setImporting] = useState(false);
 const [importResult, setImportResult] = useState<any>(null);

 const handleFileUpload = async (uploadedFile: File) => {
  if (!uploadedFile.name.endsWith(".csv")) {
   setError("Please upload a CSV file");
   return;
  }
  setFile(uploadedFile);
  setError("");
  setImportResult(null);

  setImporting(true);
  try {
    const formData = new FormData();
    formData.append("file", uploadedFile);

    const session = localStorage.getItem("pos_session");
    const response = await fetch("/api/products/import", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session}`
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to import products");
    }

    setImportResult(data.result);
  } catch (err: any) {
    setError(err.message || "Failed to import products");
  } finally {
    setImporting(false);
  }
 };

 const handleDragDrop = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const droppedFile = e.dataTransfer.files?.[0];
  if (droppedFile) {
   handleFileUpload(droppedFile);
  }
 };

 const downloadTemplate = () => {
  const headers = [
   "name",
   "item_code",
   "sku",
   "purchase_price",
   "sale_price",
   "quantity",
   "min_stock",
   "min_discount",
   "max_discount",
   "description",
   "unit",
   "category",
   "variant_name",
   "variant_item_code"
  ];

  const exampleData = [
   headers.join(","),
   '"Widget A",WID-001,SKU-A,500,750,100,5,0,10,"High quality widget",piece,Electronics,"",""',
   '"Widget B",WID-002,SKU-B,300,450,50,5,0,5,"Standard widget",piece,Electronics,"",""',
   '"Widget C (Red)",WID-003,SKU-C,100,150,20,5,0,0,"Variant product parent",piece,Clothing,"Red",WID-003-R',
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
  <div className="p-6 space-y-6 font-aeonik">
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

   {importing ? (
     <div className="bg-white border p-12 text-center shadow-sm">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Importing Products...</h3>
        <p className="text-gray-500 mt-2">Please wait while we process your CSV file.</p>
     </div>
   ) : !importResult ? (
    <div className="space-y-6">
     <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDragDrop}
      className="border-2 border-dashed border-gray-300 p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer bg-white"
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
       className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded"
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

     <div className="bg-blue-50 border border-blue-200 p-6 rounded">
      <h4 className="font-medium text-blue-900 mb-2">CSV Format Rules</h4>
      <p className="text-blue-700 text-sm mb-3">
       Your CSV file headers must match these EXACT column names (case-insensitive):
      </p>
      <div className="space-y-1 text-sm text-blue-700 bg-white p-4 border border-blue-100 rounded">
       <p className="font-medium text-gray-900">Required Columns:</p>
       <p className="ml-2 mb-3 text-gray-700">
        <code className="bg-gray-100 px-1 py-0.5 rounded">name</code>
       </p>
       
       <p className="font-medium text-gray-900">Optional Columns:</p>
       <div className="ml-2 grid grid-cols-2 gap-2 text-gray-700">
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">item_code</code> (Used for upserting)</p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">sku</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">purchase_price</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">sale_price</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">quantity</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">min_stock</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">min_discount</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">max_discount</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">description</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">unit</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">category</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">variant_name</code></p>
        <p><code className="bg-gray-100 px-1 py-0.5 rounded">variant_item_code</code></p>
       </div>
      </div>
      
      <div className="mt-4 text-sm text-blue-800">
        <strong>Upsert Logic:</strong> If a product with the same <code>item_code</code> or <code>name</code> exists, it will be updated.
      </div>

      <button
       onClick={downloadTemplate}
       className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 font-medium text-sm rounded shadow-sm"
      >
       <Download className="w-4 h-4" />
       Download Example Template
      </button>
     </div>
    </div>
   ) : (
    <div className="space-y-6">
     <div className="bg-green-50 border border-green-200 p-8 rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-6">
       <CheckCircle2 className="w-8 h-8 text-green-600" />
       <h3 className="text-2xl font-bold text-green-900">
        Import Complete!
       </h3>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
       <div className="bg-white p-6 border border-green-200 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Rows</p>
        <p className="text-4xl font-bold text-gray-900">
         {importResult.total}
        </p>
       </div>
       <div className="bg-white p-6 border border-green-200 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Imported</p>
        <p className="text-4xl font-bold text-green-600">
         {importResult.imported}
        </p>
       </div>
       <div className="bg-white p-6 border border-green-200 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Failed</p>
        <p className="text-4xl font-bold text-red-600">
         {importResult.failed}
        </p>
       </div>
      </div>

      {importResult.errors && importResult.errors.length > 0 && (
       <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-h-80 overflow-y-auto">
        <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2">
         <AlertCircle className="w-5 h-5" /> Errors ({importResult.errors.length})
        </h4>
        <div className="space-y-3">
         {importResult.errors.map((err: any, idx: number) => (
          <div key={idx} className="text-sm text-red-800 bg-white p-3 rounded border border-red-100">
           <span className="font-bold mr-2">Row {err.row}:</span>
           {err.error}
          </div>
         ))}
        </div>
       </div>
      )}
     </div>

     <div className="flex gap-4">
      <Link
       href="/app/products"
       className="flex-1 text-center items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded shadow-sm"
      >
       View Products
      </Link>
      <button
       onClick={() => {
        setFile(null);
        setError("");
        setImportResult(null);
       }}
       className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded shadow-sm"
      >
       <Upload className="w-4 h-4" />
       Import Another File
      </button>
     </div>
    </div>
   )}
  </div>
 );
}
