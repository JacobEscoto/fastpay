import { useEffect, useState } from "react"
import {
    IconAlertTriangle,
    IconX,
    IconInfoCircle,
    IconCheck,
} from "@tabler/icons-react"

export default function ErrorToast({
    message,
    type = "error",
    duration = 4000,
    onClose,
}) {
    const [visible, setVisible] = useState(false)
    const [leaving, setLeaving] = useState(false)

    useEffect(() => {
        if (!message) return

        setLeaving(false)
        setVisible(true)

        if (duration > 0) {
            const t = setTimeout(() => dismiss(), duration)
            return () => clearTimeout(t)
        }
    }, [message, duration])

    function dismiss() {
        setLeaving(true)

        setTimeout(() => {
            setVisible(false)
            onClose?.()
        }, 280)
    }

    if (!message || !visible) return null

    const variants = {
        error: {
            icon: <IconAlertTriangle size={14} aria-hidden="true" />,
            accent: "rgba(255,80,80,0.85)",
            border: "rgba(255,80,80,0.25)",
            topBar: "rgba(255,80,80,0.50)",
            label: "ERROR",
            textCls: "text-danger",
        },

        info: {
            icon: <IconInfoCircle size={14} aria-hidden="true" />,
            accent: "rgba(0,180,255,0.85)",
            border: "rgba(0,180,255,0.20)",
            topBar: "rgba(0,180,255,0.45)",
            label: "INFO",
            textCls: "text-blue-400",
        },

        success: {
            icon: <IconCheck size={14} aria-hidden="true" />,
            accent: "rgba(0,255,135,0.85)",
            border: "rgba(0,255,135,0.20)",
            topBar: "rgba(0,255,135,0.40)",
            label: "OK",
            textCls: "text-green",
        },
    }

    const v = variants[type] ?? variants.error

    return (
        <>
            <style>{`
                @keyframes fp-toast-in {
                    from {
                        opacity: 0;
                        transform: translateY(14px) scale(0.97);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes fp-toast-out {
                    from {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }

                    to {
                        opacity: 0;
                        transform: translateY(8px) scale(0.97);
                    }
                }

                @keyframes fp-bar-shrink {
                    from {
                        transform: scaleX(1);
                    }

                    to {
                        transform: scaleX(0);
                    }
                }

                .fp-toast-enter {
                    animation: fp-toast-in 0.22s
                        cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }

                .fp-toast-leave {
                    animation: fp-toast-out 0.26s
                        cubic-bezier(0.55, 0, 1, 0.45) forwards;
                }
            `}</style>

            <div
                className="fixed bottom-5 left-1/2 z-[60] w-full max-w-xs px-4"
                style={{ transform: "translateX(-50%)" }}
            >
                <div
                    role={type === "error" ? "alert" : "status"}
                    aria-live={type === "error" ? "assertive" : "polite"}
                    aria-atomic="true"
                    className={`fp-toast-enter ${leaving ? "fp-toast-leave" : ""
                        }`}
                    style={{
                        background: "rgba(15,20,18,0.96)",
                        border: `1px solid ${v.border}`,
                        borderTop: `2px solid ${v.topBar}`,
                        borderRadius: "10px",
                        padding: "12px 14px",
                        backdropFilter: "blur(12px)",
                        boxShadow:
                            "0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
                    }}
                >
                    <div className="flex items-center justify-between mb-1.5">
                        <div
                            className="flex items-center gap-1.5"
                            style={{ color: v.accent }}
                        >
                            {v.icon}

                            <span
                                className="font-mono font-semibold tracking-widest"
                                style={{
                                    fontSize: "9px",
                                    color: v.accent,
                                    letterSpacing: "0.12em",
                                }}
                            >
                                {v.label}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={dismiss}
                            className="text-t3 hover:text-t1 transition-colors flex items-center justify-center"
                            style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}
                            aria-label="Dismiss notification"
                        >
                            <IconX size={10} aria-hidden="true" />
                        </button>
                    </div>

                    <p
                        className="font-mono text-t1 leading-snug"
                        style={{ fontSize: "11.5px" }}
                    >
                        {message}
                    </p>

                    {duration > 0 && (
                        <div
                            className="mt-2.5 w-full rounded-full overflow-hidden"
                            style={{
                                height: "2px",
                                background: "rgba(255,255,255,0.07)",
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    background: v.accent,
                                    borderRadius: "9999px",
                                    transformOrigin: "left",
                                    animation: `fp-bar-shrink ${duration}ms linear forwards`,
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}