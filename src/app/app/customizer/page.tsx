"use client";

import { useState, useEffect } from "react";
import { Save, Printer, Settings, FileText } from "lucide-react";

export default function CustomizerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"thermal" | "standard">("thermal");
  const [settings, setSettings] = useState({
    shop_name: "My Shop",
    phone: "",
    address: "",
    return_policy: "No returns after 7 days.",
    logo_url: "",
    font_family: "monospace",
    thermal_header: "Thank you for shopping!",
    thermal_footer: "Visit us again!",
    standard_header: "Invoice / Receipt",
    standard_footer: "Thank you for your business."
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/shop");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Failed to save settings");
      } else {
        setSuccess("Settings saved successfully!");
        setSettings(json.data);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading customizer...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipt Customizer</h1>
          <p className="text-gray-600 mt-1">Personalize your thermal and standard print slips.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Shop Settings */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              General Shop Info
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={settings.shop_name}
                  onChange={(e) => handleChange("shop_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Address</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Policy</label>
                <textarea
                  value={settings.return_policy}
                  onChange={(e) => handleChange("return_policy", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={settings.logo_url}
                  onChange={(e) => handleChange("logo_url", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Layout Customizer Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("thermal")}
                className={`flex-1 py-3 px-4 font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "thermal" ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Printer className="w-4 h-4" /> Thermal Slip
              </button>
              <button
                onClick={() => setActiveTab("standard")}
                className={`flex-1 py-3 px-4 font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "standard" ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FileText className="w-4 h-4" /> Standard Print
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                <select
                  value={settings.font_family}
                  onChange={(e) => handleChange("font_family", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="monospace">Monospace (Courier New, Default Thermal)</option>
                  <option value="sans-serif">Sans-Serif (Arial, Helvetica)</option>
                  <option value="serif">Serif (Times New Roman)</option>
                </select>
              </div>

              {activeTab === "thermal" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thermal Header Writeup</label>
                    <textarea
                      value={settings.thermal_header}
                      onChange={(e) => handleChange("thermal_header", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="e.g. Welcome to our store!"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thermal Footer Writeup</label>
                    <textarea
                      value={settings.thermal_footer}
                      onChange={(e) => handleChange("thermal_footer", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="e.g. Thanks for shopping with us."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Standard Print Header</label>
                    <textarea
                      value={settings.standard_header}
                      onChange={(e) => handleChange("standard_header", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="e.g. TAX INVOICE"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Standard Print Footer</label>
                    <textarea
                      value={settings.standard_footer}
                      onChange={(e) => handleChange("standard_footer", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="e.g. For inquiries, contact support."
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Live Preview */}
        <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 h-fit sticky top-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">
            {activeTab === "thermal" ? "Thermal Preview" : "Standard Preview"}
          </h3>
          
          <div 
            className="bg-white shadow-sm border border-gray-200 mx-auto"
            style={{ 
              width: activeTab === "thermal" ? "280px" : "100%", 
              fontFamily: settings.font_family,
              padding: activeTab === "thermal" ? "16px" : "32px",
              minHeight: "400px"
            }}
          >
            {/* Header section */}
            <div className="text-center mb-4">
              {settings.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logo_url} alt="Logo" className="max-h-16 mx-auto mb-2" />
              )}
              <h2 className="font-bold" style={{ fontSize: activeTab === "thermal" ? "1.2rem" : "1.5rem" }}>
                {settings.shop_name || "Your Shop"}
              </h2>
              {settings.address && <p className="text-xs whitespace-pre-wrap">{settings.address}</p>}
              {settings.phone && <p className="text-xs mt-1">Tel: {settings.phone}</p>}
            </div>

            <div className="border-b border-dashed border-gray-400 my-3"></div>

            <div className="text-center text-xs mb-3 font-semibold">
              {activeTab === "thermal" ? settings.thermal_header : settings.standard_header}
            </div>

            <div className="border-b border-dashed border-gray-400 my-3"></div>

            {/* Mock Items */}
            <div className="text-xs space-y-1 my-4">
              <div className="flex justify-between font-bold border-b border-gray-200 pb-1">
                <span>Item</span><span>Total</span>
              </div>
              <div className="flex justify-between"><span>Product 1 x2</span><span>$20</span></div>
              <div className="flex justify-between"><span>Product 2 x1</span><span>$15</span></div>
            </div>

            <div className="border-b border-dashed border-gray-400 my-3"></div>

            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span><span>$35</span>
            </div>

            <div className="border-b border-dashed border-gray-400 my-3"></div>

            <div className="text-center text-xs mt-4">
              <p className="font-semibold">{activeTab === "thermal" ? settings.thermal_footer : settings.standard_footer}</p>
              {settings.return_policy && <p className="mt-2 text-gray-500 text-[10px] whitespace-pre-wrap">{settings.return_policy}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
