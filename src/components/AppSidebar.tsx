"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import {
 LayoutDashboard,
 ShoppingCart,
 Package,
 Users,
 Zap,
 BarChart3,
 LogOut,
 Menu,
 X,
} from "lucide-react";

const navItems = [
 { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
 { label: "POS", href: "/app/pos", icon: ShoppingCart },
 { label: "Orders", href: "/app/orders", icon: Package },
 { label: "Products", href: "/app/products", icon: Package },
 { label: "Deals", href: "/app/deals", icon: Zap },
 { label: "Customers", href: "/app/customers", icon: Users },
 { label: "Reports", href: "/app/reports", icon: BarChart3 },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
 const router = useRouter();
 const pathname = usePathname();
 const [userName, setUserName] = useState<string | null>(null);
 const [mobileOpen, setMobileOpen] = useState(false);
 const [loading, setLoading] = useState(true);

 const supabase = getSupabaseClient();

 useEffect(() => {
  const checkAuth = async () => {
   const {
    data: { session },
   } = await supabase.auth.getSession();

   if (!session) {
    router.push("/auth/login");
    return;
   }

   setUserName(session.user?.email?.split("@")[0] || "User");
   setLoading(false);
  };

  checkAuth();
 }, [router, supabase]);

 const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push("/auth/login");
 };

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-gray-600">Loading...</div>
   </div>
  );
 }

 return (
  <div className="flex h-screen bg-gray-100">
   {/* Sidebar */}
   <div
    className={`${
     mobileOpen ? "translate-x-0" : "-translate-x-full"
    } lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-40`}
   >
    <div className="flex flex-col h-full">
     {/* Logo */}
     <div className="p-6 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
       <ShoppingCart className="w-6 h-6 text-blue-600" />
       <span className="text-lg font-bold text-gray-900">POS-SY</span>
      </div>
      <button
       onClick={() => setMobileOpen(false)}
       className="lg:hidden text-gray-600"
      >
       <X className="w-5 h-5" />
      </button>
     </div>

     {/* Navigation */}
     <nav className="flex-1 p-4 overflow-y-auto">
      <ul className="space-y-1">
       {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
         <li key={item.href}>
          <Link
           href={item.href}
           onClick={() => setMobileOpen(false)}
           className={`flex items-center gap-3 px-4 py-2 transition-colors ${
            isActive
             ? "bg-blue-50 text-blue-600 font-medium"
             : "text-gray-700 hover:bg-gray-50"
           }`}
          >
           <Icon className="w-5 h-5" />
           <span>{item.label}</span>
          </Link>
         </li>
        );
       })}
      </ul>
     </nav>

     {/* User Section */}
     <div className="border-t border-gray-200 p-4">
      <div className="text-sm text-gray-600 mb-3">
       Signed in as{" "}
       <span className="font-medium text-gray-900">{userName}</span>
      </div>
      <button
       onClick={handleLogout}
       className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
      >
       <LogOut className="w-5 h-5" />
       <span>Logout</span>
      </button>
     </div>
    </div>
   </div>

   {/* Mobile Overlay */}
   {mobileOpen && (
    <div
     onClick={() => setMobileOpen(false)}
     className="fixed inset-0 bg-black/50 lg:hidden z-30"
    />
   )}

   {/* Main Content */}
   <div className="flex-1 flex flex-col overflow-hidden">
    {/* Top Bar */}
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between lg:hidden">
     <h1 className="text-lg font-semibold text-gray-900">POS-SY</h1>
     <button
      onClick={() => setMobileOpen(true)}
      className="text-gray-600"
     >
      <Menu className="w-6 h-6" />
     </button>
    </div>

    {/* Page Content */}
    <div className="flex-1 overflow-auto">
     <div className="bg-gray-100 min-h-full">{children}</div>
    </div>
   </div>
  </div>
 );
}
