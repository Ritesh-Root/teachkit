import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "TeachKit — From textbook page to lesson pack",
  description:
    "Turn a textbook page into a printable, differentiated lesson pack with GPT-5.6.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
