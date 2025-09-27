import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BackgroundBeams } from "../components/ui/background-beams";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Burn It, Then Earn It",
  description: "Track your workout intensity and discover the perfect meal to match your burned calories",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overscroll-none bg-slate-950">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-x-hidden overscroll-none`}
      >
        {/* Background Effects - Behind everything */}
        <div className="fixed inset-0 z-0">
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,theme(colors.emerald.500/0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,theme(colors.emerald.400/0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[conic-gradient(from_45deg_at_50%_50%,transparent_0deg,theme(colors.emerald.500/0.05)_90deg,transparent_180deg)]" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
          
          {/* Background beams - ensure it's behind content */}
          <div className="absolute inset-0 -z-10">
            <BackgroundBeams />
          </div>
        </div>

        {/* Content - Above background */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
