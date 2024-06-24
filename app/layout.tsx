import type { Metadata } from "next";
import "./globals.css";
import CssBaseline from "@mui/material/CssBaseline";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

export const metadata: Metadata = {
  title: "EUROCASTER",
  description: "Predict Euro2024 games and win tokens!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="wrapper">
          <CssBaseline />
          <DynamicContextProvider
            settings={{
              environmentId: process.env.DYNAMICS_ENV_ID!,
              walletConnectors: [EthereumWalletConnectors],
            }}
          >
            {children}
          </DynamicContextProvider>
        </div>
      </body>
    </html>
  );
}
