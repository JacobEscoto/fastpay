import { useState, useEffect } from "react"
import logo from "../assets/icon_24.svg"

import {
    IconWallet,
    IconCheck,
    IconMenu2,
} from "@tabler/icons-react"

export default function Topbar({
    connected,
    onConnect,
    onMenuToggle,
}) {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const formattedTime = time
        .toUTCString()
        .split(" ")[4]
        .slice(0, 5)

    return (
        <header
            className="bg-bg1 flex flex-wrap items-center justify-between gap-3 px-4 py-2 shrink-0"
            style={{
                borderBottom:
                    "1px solid rgba(255,255,255,0.06)",
            }}
        >
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-fp flex items-center justify-center">
                        <img
                            src={logo}
                            alt=""
                            className="w-6 h-6"
                            loading="eager"
                            aria-hidden="true"
                        />
                    </div>

                    <h1 className="font-head font-extrabold text-base tracking-tight text-t1">
                        Fast
                        <span className="text-green">
                            Pay
                        </span>
                    </h1>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 bg-bg2 rounded-fp px-2.5 py-1 text-t2 text-xs fp-border2">
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-green inline-block"
                        aria-hidden="true"
                    />

                    <span>Devnet</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <time
                    dateTime={time.toISOString()}
                    className="text-t3 text-xs hidden md:block"
                >
                    {formattedTime} UTC
                </time>

                <button
                    type="button"
                    onClick={onConnect}
                    className={
                        connected
                            ? "fp-btn-green"
                            : "fp-btn-ghost"
                    }
                    aria-label="Connect wallet"
                >
                    {connected ? (
                        <IconCheck
                            size={13}
                            aria-hidden="true"
                        />
                    ) : (
                        <IconWallet
                            size={13}
                            aria-hidden="true"
                        />
                    )}

                    <span className="hidden sm:inline">
                        {connected
                            ? "Phantom Connected"
                            : "Connect Phantom"}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={onMenuToggle}
                    className="lg:hidden fp-btn-ghost px-2"
                    aria-label="Open navigation menu"
                >
                    <IconMenu2
                        size={20}
                        aria-hidden="true"
                    />
                </button>
            </div>
        </header>
    )
}