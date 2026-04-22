"use client";

import Link from "next/link";
import { ShoppingCart, Users, BookOpen, FileText, Zap, Layers, TrendingUp, Clock, Lock } from "lucide-react";

export default function Home() {
 return (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
   {/* Navbar */}
   <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="flex justify-between items-center h-16">
      <div className="flex items-center gap-3">
       <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 ">
        <ShoppingCart className="w-6 h-6 text-white" />
       </div>
       <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">POS-SY</span>
      </div>
      <div className="flex gap-4">
       <Link
        href="/auth/login"
        className="px-4 py-2 text-gray-700 hover:text-gray-900 font-semibold transition-colors"
       >
        Login
       </Link>
       <Link
        href="/auth/login"
        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-200 font-semibold transition-all"
       >
        Get Started
       </Link>
      </div>
     </div>
    </div>
   </nav>

   {/* Hero Section */}
   <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
    <div className="text-center space-y-8">
     <div className="inline-block">
      <div className="px-4 py-1.5 bg-blue-100 text-blue-700 font-semibold text-sm">
       ✨ The Modern POS Platform Built for Pakistan
      </div>
     </div>
     
     <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
      Point of Sale System <br />
      <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">for Modern Retailers</span>
     </h1>
     
     <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
      Streamline your retail operations with intelligent product management, seamless order processing, and robust credit tracking—all designed for Pakistani businesses.
     </p>
     
     <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
      <Link
       href="/auth/login"
       className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-200 font-semibold text-lg transition-all transform hover:scale-105"
      >
       Get Started Now
      </Link>
      <Link
       href="#features"
       className="px-8 py-4 border-2 border-gray-300 text-gray-900 hover:border-blue-600 hover:bg-blue-50 font-semibold text-lg transition-all"
      >
       Learn More
      </Link>
     </div>
    </div>
   </section>

   {/* Features Section */}
   <section id="features" className="py-24 sm:py-32 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-50"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
     <div className="text-center mb-16">
      <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
       Everything You Need to Succeed
      </h2>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
       Comprehensive tools designed specifically for retail operations in Pakistan
      </p>
     </div>
     
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => {
       const Icon = feature.icon;
       return (
        <div 
         key={index} 
         className="group bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
        >
         <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 w-fit group-hover:scale-110 transition-transform">
          <Icon className="w-8 h-8 text-blue-600" />
         </div>
         <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">
          {feature.title}
         </h3>
         <p className="text-gray-600 leading-relaxed">{feature.description}</p>
        </div>
       );
      })}
     </div>
    </div>
   </section>

   {/* How It Works */}
   <section className="py-24 sm:py-32 bg-gradient-to-r from-gray-50 to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="text-center mb-16">
      <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
       Simple 3-Step Setup
      </h2>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
       Get up and running in minutes
      </p>
     </div>
     
     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
      {steps.map((step, index) => (
       <div key={index} className="relative">
        {/* Connector line */}
        {index < steps.length - 1 && (
         <div className="hidden md:block absolute top-12 left-[60%] w-[200%] h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
        )}
        
        <div className="relative z-10 text-center">
         <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white mx-auto mb-6 text-2xl font-bold shadow-lg">
          {index + 1}
         </div>
         <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {step.title}
         </h3>
         <p className="text-gray-600 leading-relaxed">{step.description}</p>
        </div>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* Benefits Section */}
   <section className="py-24 sm:py-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 ">
       <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
       <h3 className="text-2xl font-bold text-gray-900 mb-2">Increase Revenue</h3>
       <p className="text-gray-700">Track sales in real-time and identify your best-selling products to optimize inventory.</p>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 ">
       <Clock className="w-12 h-12 text-green-600 mb-4" />
       <h3 className="text-2xl font-bold text-gray-900 mb-2">Save Time</h3>
       <p className="text-gray-700">Automate order processing and customer credit management to focus on customer service.</p>
      </div>
      
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 ">
       <Lock className="w-12 h-12 text-purple-600 mb-4" />
       <h3 className="text-2xl font-bold text-gray-900 mb-2">Stay Secure</h3>
       <p className="text-gray-700">Enterprise-grade security with role-based access control and encrypted data storage.</p>
      </div>
     </div>
    </div>
   </section>

   {/* CTA Section */}
   <section className="py-24 sm:py-32 bg-gradient-to-r from-blue-600 to-blue-700">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
     <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
      Ready to Transform Your Store?
     </h2>
     <p className="text-xl text-blue-100 mb-8">
      Join hundreds of retailers already using POS-SY to streamline their operations
     </p>
     <Link
      href="/auth/login"
      className="inline-block px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
     >
      Get Started Today
     </Link>
    </div>
   </section>

   {/* Footer */}
   <footer className="bg-gray-900 text-white py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
      <div>
       <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 ">
         <ShoppingCart className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold">POS-SY</span>
       </div>
       <p className="text-gray-400">Modern POS system designed for Pakistani retail businesses</p>
      </div>
      
      <div>
       <h4 className="font-bold mb-4 text-white">Product</h4>
       <ul className="space-y-2 text-gray-400">
        <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
        <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
       </ul>
      </div>
      
      <div>
       <h4 className="font-bold mb-4 text-white">Company</h4>
       <ul className="space-y-2 text-gray-400">
        <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
        <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
       </ul>
      </div>
      
      <div>
       <h4 className="font-bold mb-4 text-white">Legal</h4>
       <ul className="space-y-2 text-gray-400">
        <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
        <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
       </ul>
      </div>
     </div>
     
     <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
      <p>&copy; 2026 <a href="https://hamzaihsan.me" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Hamza Ihsan</a>. All rights reserved.</p>
     </div>
    </div>
   </footer>
  </div>
 );
}

const features = [
 {
  icon: ShoppingCart,
  title: "Product Management",
  description:
   "Easily manage your products with variants, pricing, and inventory tracking.",
 },
 {
  icon: Users,
  title: "Customer Accounts",
  description:
   "Track customer credit (Khata) and manage account balances effortlessly.",
 },
 {
  icon: BookOpen,
  title: "Smart Orders",
  description:
   "Create and process orders with automatic balance calculations.",
 },
 {
  icon: FileText,
  title: "Invoicing",
  description:
   "Generate professional invoices with thermal print support.",
 },
 {
  icon: Zap,
  title: "Deals & Promotions",
  description:
   "Create product bundles and promotional deals for better sales.",
 },
 {
  icon: Layers,
  title: "Reports & Analytics",
  description:
   "Get insights into sales, profit, and customer trends.",
 },
];

const steps = [
 {
  title: "Set up your store",
  description: "Create your account and configure your store settings.",
 },
 {
  title: "Add products",
  description:
   "Import or manually add products with prices and variants.",
 },
 {
  title: "Start selling",
  description: "Begin accepting orders and managing customer accounts.",
 },
];
