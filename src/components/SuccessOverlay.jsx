import {
    IconCheck,
    IconExternalLink,
    IconBrandX,
} from "@tabler/icons-react"

export default function SuccessOverlay({
    show,
    message,
    hash,
    onClose,
}) {
    if (!show) return null

    const handleShareTwitter = () => {
        const appUrl =
            "https://fastpay-sol.vercel.app/"

        const text = `Just sent a tip using FastPay!🔥 Fast and easy payments on Solana.

Check it out and send tips on Solana with just a link!`

        const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
            text
        )}&url=${encodeURIComponent(appUrl)}`

        window.open(
            xUrl,
            "_blank",
            "noopener,noreferrer"
        )
    }

    const cleanHash = hash
        ? hash.replace("tx:", "").trim()
        : ""

    const solscanUrl = `https://solscan.io/tx/${cleanHash}?cluster=devnet`

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3.5"
            style={{
                background: "rgba(12,15,14,0.93)",
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="success-overlay-title"
                aria-describedby="success-overlay-description"
                className="flex flex-col items-center gap-3.5"
            >
                <div
                    className="w-16 h-16 rounded-fp flex items-center justify-center"
                    style={{
                        background:
                            "rgba(0,255,135,0.08)",

                        border:
                            "1px solid rgba(0,255,135,0.27)",
                    }}
                >
                    <IconCheck
                        size={28}
                        className="text-green"
                        aria-hidden="true"
                    />
                </div>

                <h2
                    id="success-overlay-title"
                    className="font-head font-extrabold text-xl text-t1"
                >
                    Tip Sent
                </h2>

                <p
                    id="success-overlay-description"
                    className="font-mono text-xs text-t2 text-center max-w-xs leading-relaxed"
                >
                    {message}
                </p>

                {cleanHash && (
                    <a
                        href={solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-1.5 font-mono text-[10px] text-blue hover:text-blue/80 transition-colors"
                        aria-label="View transaction on Solscan"
                    >
                        {hash?.slice(0, 8)}...
                        {hash?.slice(-8)}

                        <IconExternalLink
                            size={12}
                            className="opacity-70 group-hover:opacity-100"
                            aria-hidden="true"
                        />

                        <span className="underline decoration-blue/30 underline-offset-2">
                            View on Solscan
                        </span>
                    </a>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    className="fp-btn-green mt-1"
                >
                    <IconCheck
                        size={13}
                        aria-hidden="true"
                    />

                    Done
                </button>

                <button
                    type="button"
                    onClick={handleShareTwitter}
                    className="w-fill max-w-[200px] flex items-center justify-center gap-2 py-3 px-4 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border border-[#1DA1F2]/20 transition-all text-sm"
                    aria-label="Share transaction on X"
                >
                    <IconBrandX
                        size={18}
                        aria-hidden="true"
                    />

                    Share on X
                </button>
            </div>
        </div>
    )
}