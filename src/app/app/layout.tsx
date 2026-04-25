import { AppSidebar } from "@/components/AppSidebar";

export const metadata = {
 title: "POS-SYS - Point of Sale System",
 icons: {
  icon: "/favicon.svg",
 },
};

export default function AppLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <AppSidebar>{children}</AppSidebar>;
}
