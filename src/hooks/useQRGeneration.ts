import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { generateSolanaPayUrl, formatWalletAddress, convertSvgToPngBlob } from "../utils/qr";

export function useQRGeneration(username: string | null, amount?: number) {
    const { publicKey, connected } = useWallet()
    const [copied, setCopied] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const address = publicKey?.toBase58() ?? ""
    const shortAddress = address ? formatWalletAddress(address) : ""

    const qrUrl = address ? generateSolanaPayUrl(username ?? address, amount) : ""

    const copyAddress = useCallback(async () => {
        if (!address) return
        await navigator.clipboard.writeText(address).catch(() => { })
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [address])

    const downloadQRImage = useCallback(async (qrRef: SVGSVGElement | null) => {
        if (!qrRef || !shortAddress) return
        setDownloading(true)
        try {
            const blob = await convertSvgToPngBlob(qrRef, 400)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `fastpay-${shortAddress.replace("...", "-")}.png`
            a.click()
            URL.revokeObjectURL(url)
        } finally {
            setDownloading(false)
        }
    }, [shortAddress])

    return { address, shortAddress, qrUrl, connected, copied, downloading, copyAddress, downloadQRImage }
}