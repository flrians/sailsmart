import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SailSmart - Bavaria C50 Assistant",
  description: "Chatbot assistant for the Bavaria C50 sailing yacht manual.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
