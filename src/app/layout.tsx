import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Orbit · Course registration", template: "%s · Orbit" },
  description: "A calm, reliable course registration experience for students and university teams.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
