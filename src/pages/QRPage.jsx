import { useRef, useState } from "react"
import { QRCode } from "react-qr-code"
import {
    IconDownload,
    IconCopy,
    IconCheck,
    IconWallet,
    IconRefresh,
} from "@tabler/icons-react"

import { useQRGeneration } from "../hooks/useQRGeneration"

export default function QRPage({ userProfile }) {
    const qrWrapperRef = useRef(null)
    const [amount, setAmount] = useState("")
    const [linkCopied, setLinkCopied] = useState(false)

    const {
        shortAddress,
        qrUrl,
        connected,
        downloading,
        downloadQRImage,
    } = useQRGeneration(
        userProfile?.username || null,
        parseFloat(amount) > 0 ? parseFloat(amount) : undefined
    )

    const handleCopyLink = async () => {
        if (!qrUrl) return
        try {
            await navigator.clipboard.writeText(qrUrl)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
        } catch (err) { }
    }

    const handleDownload = () => {
        const svg = qrWrapperRef.current?.querySelector("svg") ?? null
        downloadQRImage(svg)
    }

    return (
        <main>
            <header className="mb-5">
                <h1 className="font-head font-extrabold text-lg text-t1 mb-1">
                    QR Code
                </h1>
                <p className="font-mono text-xs text-t2">
                    Share your personal link to receive tips.
                    {userProfile?.username && ` Your handle is @${userProfile.username}`}
                </p>
            </header>

            <section aria-labelledby="payment-link-title" className="fp-card green-top p-5 flex gap-6 items-start mb-3">
                <div ref={qrWrapperRef} className="bg-white rounded-fp p-2.5 flex-shrink-0 flex items-center justify-center" style={{ width: 120, height: 120 }}>
                    {connected && qrUrl ? (
                        <div role="img" aria-label="QR code for receiving SOL payments">
                            <QRCode value={qrUrl} size={100} fgColor="#0c0f0e" bgColor="#ffffff" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-center">
                            <IconWallet size={28} style={{ color: "#b0b8b4" }} aria-hidden="true" />
                            <span className="font-mono text-t3" style={{ fontSize: 9 }}>Connect wallet</span>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <h2 id="payment-link-title" className="fp-slash mb-2">YOUR PAYMENT LINK</h2>
                    {connected && shortAddress ? (
                        <>
                            <div className="font-mono text-[10px] text-green bg-bg3 rounded-fp px-2.5 py-2 mb-2.5" style={{ border: "1px solid rgba(255,255,255,0.08)", wordBreak: "break-all" }}>
                                {qrUrl}
                            </div>
                            <p className="font-mono text-xs text-t2 mb-4 leading-relaxed">
                                Scanners will be redirected to your FastPay profile to tip you instantly.
                            </p>
                        </>
                    ) : (
                        <p className="font-mono text-xs text-t2 mb-4 leading-relaxed">
                            Connect your Phantom wallet to generate your personal QR code.
                        </p>
                    )}

                    <div className="flex gap-2">
                        <button type="button" className="fp-btn-green" onClick={handleDownload} disabled={!connected || downloading}>
                            {downloading ? <IconRefresh size={13} className="animate-spin" aria-hidden="true" /> : <IconDownload size={13} aria-hidden="true" />}
                            {downloading ? "Saving…" : "Download"}
                        </button>
                        <button type="button" className="fp-btn-ghost" onClick={handleCopyLink} disabled={!connected || !qrUrl}>
                            {linkCopied ? <IconCheck size={13} aria-hidden="true" /> : <IconCopy size={13} aria-hidden="true" />}
                            {linkCopied ? "Copied!" : "Copy Link"}
                        </button>
                    </div>
                </div>
            </section>

            <section aria-labelledby="invoice-title" className="fp-card p-4">
                <h2 id="invoice-title" className="fp-slash mb-2">DYNAMIC AMOUNT — INVOICE</h2>
                <div className="flex gap-2">
                    <input className="fp-input" placeholder="Amount in SOL" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <button type="button" className="fp-btn-green" disabled={!connected}>Update QR</button>
                </div>
            </section>
        </main>
    )
}