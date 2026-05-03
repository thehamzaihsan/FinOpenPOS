"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Printer, Settings as SettingsIcon, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataService } from "@/lib/data-service";

export default function CustomizerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"thermal" | "standard">("thermal");
  const [settings, setSettings] = useState({
    shop_name: "",
    shop_phone: "",
    shop_address: "",
    currency: "PKR",
    receipt_header: "Thank you for shopping!",
    receipt_footer: "Please come again!",
    thermal_printer: "",
    tax_number: "",
  });
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await dataService.getShopSettings();
        if (data) {
          setSettings({
            shop_name: data.shop_name || "",
            shop_phone: data.shop_phone || "",
            shop_address: data.shop_address || "",
            currency: data.currency || "PKR",
            receipt_header: data.receipt_header || "Thank you for shopping!",
            receipt_footer: data.receipt_footer || "Please come again!",
            thermal_printer: data.thermal_printer || "",
            tax_number: data.tax_number || "",
          });
        }
      } catch (e) {
          console.error("Failed to load customizer settings:", e);
      } finally {
          setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess("");
    try {
      const existing = await dataService.getShopSettings();
      await dataService.updateShopSettings(existing?.id || null, {
          ...settings,
          is_active: true
      });
      setSuccess("Customization saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    const content = printRef.current;
    if (!content) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${settings.shop_name}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .border-dashed { border-bottom: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 4px 0; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );
  }

  return (
    <div className="p-8 font-aeonik">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipt Customizer</h1>
          <p className="text-gray-600">Customize your receipts and printing</p>
        </div>
        <div className="flex gap-3">
          {success && <span className="text-green-600 self-center font-medium">{success}</span>}
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" /> Test Print
          </Button>
          <Button onClick={handleSave} className="bg-blue-600" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Customization
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("thermal")}
              className={`px-6 py-3 font-medium transition-colors ${activeTab === "thermal" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              <Printer className="w-4 h-4 inline mr-2" /> Thermal Receipt
            </button>
            <button
              onClick={() => setActiveTab("standard")}
              className={`px-6 py-3 font-medium transition-colors ${activeTab === "standard" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              <FileText className="w-4 h-4 inline mr-2" /> A4 Invoice
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-5">
            <div className="space-y-2">
              <Label>Shop Name on Receipt</Label>
              <Input 
                value={settings.shop_name}
                onChange={(e) => setSettings({...settings, shop_name: e.target.value})}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={settings.shop_phone}
                  onChange={(e) => setSettings({...settings, shop_phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax Number (NTN/GST)</Label>
                <Input 
                  value={settings.tax_number}
                  onChange={(e) => setSettings({...settings, tax_number: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Business Address</Label>
              <Input 
                value={settings.shop_address}
                onChange={(e) => setSettings({...settings, shop_address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Thermal Printer Name</Label>
              <Input 
                value={settings.thermal_printer}
                onChange={(e) => setSettings({...settings, thermal_printer: e.target.value})}
                placeholder="e.g. Epson TM-T88VI"
              />
            </div>
            <div className="border-t pt-5">
              <h3 className="font-semibold mb-4 text-gray-900">Custom Messages</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Receipt Header Message</Label>
                  <Input 
                    value={settings.receipt_header}
                    onChange={(e) => setSettings({...settings, receipt_header: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Receipt Footer Message</Label>
                  <Input 
                    value={settings.receipt_footer}
                    onChange={(e) => setSettings({...settings, receipt_footer: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-gray-600 text-sm uppercase tracking-wider">Live Preview</h3>
          <div 
            ref={printRef}
            className="bg-white shadow-xl p-6 mx-auto border"
            style={{ 
              width: activeTab === "thermal" ? "280px" : "100%",
              minHeight: "400px",
              fontFamily: "monospace",
              fontSize: activeTab === "thermal" ? "12px" : "14px"
            }}
          >
            <div className="text-center mb-3">
              <div className="bold text-lg">{settings.shop_name || "Business Name"}</div>
              {settings.shop_phone && <div>{settings.shop_phone}</div>}
              {settings.shop_address && <div>{settings.shop_address}</div>}
              {settings.tax_number && <div>Tax ID: {settings.tax_number}</div>}
            </div>
            
            <div className="border-dashed"></div>
            
            <div className="text-center mb-3 text-gray-700 italic">{settings.receipt_header}</div>
            
            <div className="border-dashed"></div>
            
            <table className="mb-3">
              <tbody>
                <tr><td className="py-1">Sample Product x 2</td><td className="text-right py-1">{settings.currency} 1,200</td></tr>
                <tr><td className="py-1">Another Item x 1</td><td className="text-right py-1">{settings.currency} 450</td></tr>
              </tbody>
            </table>
            
            <div className="border-dashed"></div>
            
            <div className="flex justify-between bold text-lg py-2">
              <span>TOTAL</span>
              <span>{settings.currency} 1,650</span>
            </div>
            
            <div className="border-dashed"></div>
            
            <div className="text-center mt-4 pb-2 border-t pt-2 border-gray-100">{settings.receipt_footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
