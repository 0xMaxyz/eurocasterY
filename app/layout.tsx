import type { Metadata } from "next";
import "./globals.css";
import CssBaseline from "@mui/material/CssBaseline";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import Script from "next/script";

export const metadata: Metadata = {
  title: "EUROCASTER",
  description: "Predict Euro2024 games and win tokens!",
};

const cssOverrides = `
    .dynamic-widget__container .button {
      background-color: black !important;
      color: white !important;
      height: 40px !important;
      border-radius: 20px !important; /* Assuming the button height is 40px */
    }
  `;

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
              cssOverrides: cssOverrides,
            }}
          >
            {children}
          </DynamicContextProvider>
        </div>
        <Script
          crossOrigin="anonymous"
          async
          integrity="sha384-LfouGM03m83ArVtne1JPk926e3SGD0Tz8XHtW2OKGsgeBU/UfR0Fa8eX+UlwSSAZ"
          src="https://cdn.jsdelivr.net/npm/jdenticon@3.3.0/dist/jdenticon.min.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
