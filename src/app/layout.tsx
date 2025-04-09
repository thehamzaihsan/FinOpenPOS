import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Analyt from "@/components/Analytics";

const inter = Inter({ subsets: ["latin"] });
//Import Mixpanel SDK

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
        <main>{children}</main>
      </body>
    </html>
  );
}
