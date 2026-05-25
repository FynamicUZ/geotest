import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import NavUser from "@/components/NavUser";

export const metadata: Metadata = {
  title: "geotest — make & take MCQ tests",
  description: "Create, share, and take multiple-choice tests.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg text-white">
              geotest
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/tests">Browse tests</Link>
              <Link href="/tests/new">Create test</Link>
              <NavUser />
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="max-w-5xl mx-auto px-4 py-8 text-xs text-white/40">
          geotest · MCQ test platform
        </footer>
      </body>
    </html>
  );
}
