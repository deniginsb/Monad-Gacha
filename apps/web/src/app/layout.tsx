import "./globals.css";
import { ReactNode } from "react";

export const metadata = { title: "Monad Testnet Slots", description: "Testnet-only 3-reel slot on Monad" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="w-full border-b border-red-500/40 bg-red-900/20 text-red-200 text-center py-2 text-sm">
          TESTNET ONLY – No Real Value. Entry fee 0.1 MON (testnet).
        </div>
        {children}
      </body>
    </html>
  );
}

