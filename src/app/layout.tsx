import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Analyt from "@/components/Analytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Khata App",
  description: "Smart Khata App by Hamza I",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Analyt></Analyt>
      <body className={inter.className}>
        <main className="h-[95vh]">{children}</main>
        <footer className="text-center text-gray-500 text-xs h-[5vh]">
          &copy; {new Date().getFullYear()}<a 
            href="https://hamzaihsan.me" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:underline ml-2"
          >
            Hamza Ihsan
          </a>. All rights reserved. 
       
        </footer>
      </body>
    </html>
  );
}
