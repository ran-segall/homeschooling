import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AgentationProvider } from "@/components/AgentationProvider";
import { Providers } from "@/components/Providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Curio",
  description: "Learning made for curious minds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="font-[family-name:var(--font-body)] antialiased">
        <Providers>
          {children}
        </Providers>
        <AgentationProvider />
      </body>
    </html>
  );
}
