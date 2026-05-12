import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { IconX, IconCheck } from "@tabler/icons-react"
import { PhantomLogo } from "./PhantomLogo"
import ErrorToast from "./ErrorToast"

export default function PhantomModal({ open, onDone, onCancel }) {
    const { select, connect, connected, connecting } = useWallet()

    const [progress, setProgress] = useState(0)
    const [errorMsg, setErrorMsg] = useState(null)

    useEffect(() => {
        if (open && !connected && !connecting) {
            select("Phantom")

            connect().catch((err) => {
                const msg =
                    err?.message ??
                    "Failed to connect to Phantom wallet."

                setErrorMsg(msg)
            })
        }
    }, [open, connected, connecting, select, connect])

    useEffect(() => {
        if (!open) {
            setProgress(0)
            return
        }

        if (connecting) setProgress(65)

        if (connected) {
            setProgress(100)

            const t = setTimeout(onDone, 600)

            return () => clearTimeout(t)
        }
    }, [open, connecting, connected, onDone])

    if (!open) return null

    const steps = [
        {
            label: "Detecting Phantom",
            done: progress >= 30,
        },

        {
            label: "Requesting approval",
            done: progress >= 65,
        },

        {
            label: "Loading devnet balance",
            done: progress >= 100,
        },
    ]

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                    background: "rgba(12,15,14,0.90)",
                }}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="phantom-modal-title"
                    aria-describedby="phantom-modal-description"
                    className="bg-bg1 rounded-fp p-7 w-72 text-center"
                    style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderTop:
                            "1px solid rgba(0,255,135,0.30)",
                    }}
                >
                    <div className="flex justify-center mb-5">
                        <PhantomLogo
                            size={42}
                            aria-hidden="true"
                        />
                    </div>

                    <h2
                        id="phantom-modal-title"
                        className="font-head font-extrabold text-base text-t1 mb-1.5"
                    >
                        Connecting Phantom
                    </h2>

                    <p
                        id="phantom-modal-description"
                        className="font-mono text-xs text-t2 mb-4 leading-relaxed"
                    >
                        Approve the connection in your wallet
                        to continue.
                    </p>

                    <div
                        className="w-full h-0.5 bg-bg3 rounded-full overflow-hidden mb-4"
                        aria-hidden="true"
                    >
                        <div
                            className="h-full bg-green rounded-full transition-all duration-500"
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>

                    <ul className="text-left flex flex-col gap-2 mb-5">
                        {steps.map(({ label, done }, i) => (
                            <li
                                key={i}
                                className={`flex items-center gap-2.5 text-xs ${done
                                    ? "text-t1"
                                    : "text-t2"
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs flex-shrink-0 ${done
                                        ? "text-green"
                                        : "text-t3"
                                        }`}
                                    style={{
                                        border: done
                                            ? "1px solid rgba(0,255,135,0.30)"
                                            : "1px solid rgba(255,255,255,0.10)",

                                        background: done
                                            ? "rgba(0,255,135,0.09)"
                                            : "#222b27",
                                    }}
                                    aria-hidden="true"
                                >
                                    {done ? (
                                        <IconCheck
                                            size={10}
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        i + 1
                                    )}
                                </div>

                                <span>{label}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="fp-btn-ghost w-full justify-center"
                    >
                        <IconX
                            size={12}
                            aria-hidden="true"
                        />

                        Cancel
                    </button>
                </div>
            </div>

            <ErrorToast
                message={errorMsg}
                type="error"
                duration={5000}
                onClose={() => setErrorMsg(null)}
            />
        </>
    )
}