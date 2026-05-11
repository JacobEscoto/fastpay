import React, { useMemo } from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import { clusterApiUrl } from "@solana/web3.js"

function Root() {
    const endpoint = useMemo(() => clusterApiUrl("devnet"), [])

    const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <App />
            </WalletProvider>
        </ConnectionProvider>
    )
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>
)
