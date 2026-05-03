"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dataService } from "@/lib/data-service";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Download,
  Loader2
} from "lucide-react";
import { downloadFile } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Button } from "@/components/ui/button";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function getDateRange(timeRange: string) {
  const now = new Date();
  const to = now.toISOString();
  let from: string;
  switch (timeRange) {
    case "today":
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      from = today.toISOString();
      break;
    case "7days":
      from = new Date(now.getTime() - 6 * 86400000).toISOString();
      break;
    case "30days":
      from = new Date(now.getTime() - 29 * 86400000).toISOString();
      break;
    case "year":
      const yearStart = new Date(now.getFullYear(), 0, 1);
      from = yearStart.toISOString();
      break;
    default:
      from = new Date(now.getTime() - 6 * 86400000).toISOString();
  }
  return { from, to };
}

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [profitData, setProfitData] = useState<any>(null);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("7days");

  const loadData = async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange(timeRange);
      const [
        dashboardRes,
        profitRes,
        salesRes,
        expensesRes,
        khataRes
      ] = await Promise.all([
        fetch(`/api/reports/dashboard?from=${from}&to=${to}`),
        fetch(`/api/reports/profit?from=${from}&to=${to}`),
        fetch(`/api/reports/sales?from=${from}&to=${to}`),
        fetch(`/api/reports/expenses?from=${from}&to=${to}`),
        fetch(`/api/reports/khata`),
      ]);

      const dashboardJson = await dashboardRes.json();
      const profitJson = await profitRes.json();
      const salesJson = await salesRes.json();
      const expensesJson = await expensesRes.json();
      const khataJson = await khataRes.json();

      const dashboard = dashboardJson.success ? dashboardJson.data : {};
      const profit = profitJson.success ? profitJson.data : {};
      const sales = salesJson.success ? salesJson.data : {};
      const expenses = expensesJson.success ? expensesJson.data : {};
      const khata = khataJson.success ? khataJson.data : [];

      console.log("Dashboard:", dashboard);
      console.log("Profit:", profit);
      console.log("Sales:", sales);

      setStats(dashboard);
      setProfitData(profit);
      setSalesReport({ ...sales, expenses, khata });

      if (sales.topProducts && Array.isArray(sales.topProducts)) {
        setCategoriesData(
          sales.topProducts.slice(0, 5).map((p: any) => ({
            name: p.name.substring(0, 12),
            sales: p.qty_sold,
          }))
        );
      }
    } catch (e) {
      console.error("Failed to load reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleExportPDF = () => {
    const printData = {
      stats,
      profitData,
      salesReport,
      categoriesData,
      timeRange,
    };
    localStorage.setItem("reportPrintData", JSON.stringify(printData));
    router.push("/print-report");
  };

  const totalRevenue = (profitData?.revenue ?? stats?.totalRevenue) ?? 0;
  const totalOrders = stats?.ordersCount ?? 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const outstandingKhata = stats?.outstandingKhata ?? 0;
  const totalProfit = profitData?.profit ?? 0;
  const totalExpenses = profitData?.expenses ?? 0;
  const totalCogs = profitData?.cogs ?? 0;

  return (
    <div className="p-8 space-y-8 font-aeonik">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          nav, aside, header, button, select { display: none !important; }
          .p-8 { padding: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
          .border { border: 1px solid #e5e7eb !important; }
        }
      `}</style>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Detailed insights into your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => downloadFile("/api/export?type=khata&format=csv")}>
            <Download className="w-4 h-4 mr-2" /> Export Khata
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard 
          label="Total Revenue" 
          value={`PKR ${totalRevenue.toLocaleString()}`}
          trend={profitData?.profit != null ? `${totalProfit >= 0 ? "+" : ""}${((totalProfit / (totalRevenue || 1)) * 100).toFixed(1)}% margin` : "N/A"}
          isPositive={true}
          icon={DollarSign}
          color="blue"
        />
        <ReportCard 
          label="Total Orders" 
          value={totalOrders.toString()}
          trend={stats?.last7Days?.length ? `${totalOrders} in period` : "N/A"}
          isPositive={true}
          icon={ShoppingCart}
          color="green"
        />
        <ReportCard 
          label="Avg. Order Value" 
          value={`PKR ${avgOrderValue.toLocaleString()}`}
          trend={totalOrders > 0 ? `${Math.round(totalRevenue / totalOrders).toLocaleString()}` : "N/A"}
          isPositive={avgOrderValue > 0}
          icon={TrendingUp}
          color="purple"
        />
        <ReportCard 
          label="Outstanding Khata" 
          value={`PKR ${outstandingKhata.toLocaleString()}`}
          trend={`${stats?.customersWithKhata || 0} accounts`}
          isPositive={outstandingKhata === 0}
          icon={Calendar}
          color="red"
        />
      </div>

      {/* Profit & Loss Summary */}
      {totalRevenue > 0 || totalCogs > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-1">Gross Profit</p>
            <p className="text-2xl font-bold text-green-600">
              PKR {(totalRevenue - totalCogs).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Revenue - COGS</p>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              PKR {totalExpenses.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Operating costs</p>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-1">Net Profit</p>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              PKR {totalProfit.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">After all costs</p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
          <p className="text-gray-500">No profit/loss data available for this period. Ensure orders have been created with valid amounts.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> Revenue Trend
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.last7Days || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}}
                  activeDot={{r: 6, strokeWidth: 0}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" /> Top Selling Products
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoriesData.length > 0 ? categoriesData : [{name: 'No data', sales: 0}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                  {[0, 1, 2, 3, 4].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats?.lowStock && stats.lowStock.length > 0 && (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" /> Low Stock Alerts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.lowStock.map((product: any) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-red-600 font-bold">{product.stock ?? product.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{product.min_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Outstanding Khata */}
      {salesReport?.khata && salesReport.khata.length > 0 && (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" /> Outstanding Khata Balances
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {salesReport.khata
                  .filter((k: any) => (k.current_balance || k.balance || 0) > 0)
                  .sort((a: any, b: any) => (b.current_balance || b.balance || 0) - (a.current_balance || a.balance || 0))
                  .map((customer: any) => (
                    <tr key={customer.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{customer.customer_name || customer.name}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.customer_phone || customer.phone || "-"}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-bold">
                        PKR {(customer.current_balance || customer.balance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-4 py-3 font-bold text-gray-900">Total Outstanding</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    PKR {outstandingKhata.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCard({ label, value, trend, isPositive, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
