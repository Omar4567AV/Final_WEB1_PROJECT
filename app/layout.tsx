import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduManage - Student Management System",
  description: "Next.js Full-Stack Architecture Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className={`${inter.className} h-full antialiased text-slate-950`}>
        <div className="min-h-screen flex">
          {/* Left Navigation Pillar */}
          <Sidebar />
          
          {/* Main Visual Display Stage */}
          <main className="flex-1 pl-64 bg-slate-50 min-h-screen">
            <div className="py-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
