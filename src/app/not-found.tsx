"use client";

import Link from "next/link";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
   <div className="max-w-md w-full text-center">
    {/* Icon */}
    <div className="mb-6 flex justify-center">
     <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-xl opacity-50"></div>
      <div className="relative bg-slate-800 p-6">
       <AlertCircle className="w-16 h-16 text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text" />
      </div>
     </div>
    </div>

    {/* Heading */}
    <h1 className="text-6xl font-bold text-white mb-2">404</h1>
    <h2 className="text-2xl font-semibold text-gray-200 mb-4">Page Not Found</h2>

    {/* Description */}
    <p className="text-gray-400 mb-8">
     The page you're looking for doesn't exist or has been moved. Let's get you back on track.
    </p>

    {/* Navigation Links */}
    <div className="space-y-3">
     <Link
      href="/"
      className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-medium transition-all shadow-lg hover:shadow-purple-500/50"
     >
      <Home className="w-4 h-4" />
      Go Home
     </Link>

     <button
      onClick={() => window.history.back()}
      className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-slate-800 text-gray-200 hover:bg-slate-700 font-medium transition-colors"
     >
      <ArrowLeft className="w-4 h-4" />
      Go Back
     </button>
    </div>

    {/* Helpful Links */}
    <div className="mt-12 pt-8 border-t border-slate-700">
     <p className="text-gray-400 text-sm mb-4">Quick Links</p>
     <div className="flex justify-center gap-4 text-sm">
      <Link href="/app/dashboard" className="text-blue-400 hover:text-blue-300">
       Dashboard
      </Link>
      <span className="text-gray-600">•</span>
      <Link href="/app/products" className="text-blue-400 hover:text-blue-300">
       Products
      </Link>
      <span className="text-gray-600">•</span>
      <Link href="/app/orders" className="text-blue-400 hover:text-blue-300">
       Orders
      </Link>
     </div>
    </div>
   </div>

   {/* Background decoration */}
   <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 blur-3xl"></div>
   <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl"></div>
  </div>
 );
}
