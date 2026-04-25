import type { Metadata } from "next";
import "./globals.css";
import Analyt from "@/components/Analytics";

export const metadata: Metadata = {
 title: "POS-SYSS",
 description: "POS-SYSS by Hamza I",
  icons: {
  icon: [
    { rel: "icon", type: "image/svg+xml", url: "/favicon.svg" },
    { rel: "icon", type: "image/x-icon", url: "/favicon.ico" },
  ],
 },
};

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
   <html lang="en" suppressHydrationWarning>
    <Analyt></Analyt>
    <body suppressHydrationWarning className="flex flex-col min-h-screen font-sans">
    <main className="flex-1">{children}</main>
    <footer className="text-center text-gray-500 text-xs py-4 border-t bg-background">
     &copy; 2026 <a 
      href="https://hamzaihsan.me" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-blue-500 hover:underline mx-1"
     >
      Hamza Ihsan
     </a>. All rights reserved.
    </footer>
   </body>
  </html>
 );
}
