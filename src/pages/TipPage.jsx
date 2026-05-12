import { useState, useEffect } from "react"
import {
    IconSearch,
    IconSend,
    IconCheck,
    IconLoader2,
    IconAlertTriangle,
    IconWallet,
    IconShare2,
    IconArrowLeft,
} from "@tabler/icons-react"
import { useFastPay } from "../hooks/useFastPay"
import RecentTips from "../components/RecentTips"
import ErrorToast from "../components/ErrorToast"
import NotFound from "../pages/NotFound"
import { supabase } from "../utils/supabase"

const AMOUNTS = [0.1, 0.5, 1, 5, 10]
const SOL_USD = 146.4

function getInitials(name) {
    if (!name?.trim()) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Shared Supabase fetch — used by both profile-mode auto-load and search. */
async function fetchProfileByUsername(username) {
    const clean = username.replace("@", "").toLowerCase()
    const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, bio, avatar_url, wallet_address")
        .eq("username", clean)
        .maybeSingle()

    if (error || !data) return null
    return data
}

// ProfileCard  (left column)
function ProfileCard({ user }) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        const url = `${window.location.origin}/@${user.username}`
        try {
            await navigator.clipboard.writeText(url)
        } catch {
            // Fallback for browsers without clipboard API
            const el = Object.assign(document.createElement("input"), { value: url })
            document.body.appendChild(el)
            el.select()
            document.execCommand("copy")
            document.body.removeChild(el)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
    }

    return (
        <div className="fp-card green-top p-6 flex flex-col items-center text-center gap-5 lg:sticky lg:top-6">

            {/* Avatar */}
            <div
                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-head font-extrabold text-3xl shrink-0"
                style={{
                    background: "rgba(0,255,135,0.07)",
                    border: "2px solid rgba(0,255,135,0.35)",
                    color: "#00FF87",
                }}
            >
                {user.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    getInitials(user.display_name)
                )}
            </div>

            {/* Identity */}
            <div>
                <p className="font-head font-extrabold text-xl text-t1 leading-snug">
                    {user.display_name}
                </p>
                <p className="font-mono text-sm text-green mt-1">
                    @{user.username}
                </p>
            </div>

            {/* Bio */}
            {user.bio && (
                <p className="font-mono text-xs text-t2 leading-relaxed max-w-[240px]">
                    {user.bio}
                </p>
            )}

            {/* Verified badge */}
            <span className="fp-badge-green inline-flex items-center gap-1.5">
                <IconCheck size={10} /> Verified Profile
            </span>

            {/* Share button */}
            <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 font-mono text-xs py-2.5 px-4 rounded-lg transition-all duration-200 hover:bg-white/5"
                style={{
                    border: `1px solid ${copied ? "rgba(0,255,135,0.40)" : "rgba(255,255,255,0.10)"}`,
                    color: copied ? "#00FF87" : "var(--color-t2, #8a9a8f)",
                }}
                aria-label="Copy profile link to clipboard"
            >
                <IconShare2 size={13} />
                {copied ? "Link Copied!" : "Share Profile"}
            </button>
        </div>
    )
}

// PaymentPanel  (right column)
function PaymentPanel({ user, initialAmount, isAmountLocked, walletInfo, connected, onConnect, onSuccess }) {

    const { sendTip, loading, error } = useFastPay()

    const [selAmt, setSelAmt] = useState(0.5)
    const [custom, setCustom] = useState("")
    const [message, setMessage] = useState("")
    const [sent, setSent] = useState(false)
    const [errorMsg, setErrorMsg] = useState(null)

    // Initialise amount from ?amount= URL param (passed as initialAmount prop)
    useEffect(() => {
        if (!initialAmount) return
        if (AMOUNTS.includes(initialAmount)) {
            setSelAmt(initialAmount)
            setCustom("")
        } else {
            setCustom(String(initialAmount))
            setSelAmt(0)
        }
    }, [initialAmount])

    const displayAmt = parseFloat(custom) > 0 ? parseFloat(custom) : selAmt
    const walletBalance = parseFloat(walletInfo?.sol) || 0
    const insufficientFunds = connected && displayAmt > 0 && walletBalance < displayAmt
    const customInvalid = custom !== "" && (isNaN(parseFloat(custom)) || parseFloat(custom) <= 0)
    const canSend = connected && !loading && !insufficientFunds && !customInvalid && !sent

    const send = async () => {
        if (!user?.wallet_address) return
        const amt = parseFloat(custom) > 0 ? parseFloat(custom) : selAmt
        const finalMsg =
            message.trim() === ""
                ? `Tip sent via FastPay to @${user.username}`
                : message

        try {
            const signature = await sendTip(user.wallet_address, user.username, amt, finalMsg)
            onSuccess({
                message: `${amt.toFixed(2)} SOL sent to @${user.username}`,
                hash: signature,
                handle: `@${user.username}`,
                amount: amt,
            })
            setSent(true)
            setTimeout(() => setSent(false), 2500)
            setCustom("")
            setMessage("")
        } catch (err) {
            setErrorMsg(err?.message || "An unexpected error occurred")
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Error toast from send() */}
            {errorMsg && (
                <ErrorToast
                    message={errorMsg}
                    type="error"
                    duration={5000}
                    onClose={() => setErrorMsg(null)}
                />
            )}

            <div className="fp-card green-top p-5">
                {/* ── Header ── */}
                <div className="mb-5">
                    <h2 className="font-head font-extrabold text-lg text-t1 mb-0.5">
                        Send a Tip
                    </h2>
                    <p className="font-mono text-xs text-t2">
                        Support{" "}
                        <span className="text-green font-semibold">@{user.username}</span>{" "}
                        directly on-chain.
                    </p>
                </div>

                {/* Amount presets */}
                <p className="fp-slash mb-3">{isAmountLocked ? "AMOUNT" : "SELECT AMOUNT"}</p>
                <div className={`flex gap-2 flex-wrap mb-3 ${isAmountLocked ? "opacity-50 pointer-events-none" : ""}`}>
                    {AMOUNTS.map((a) => (
                        <button
                            key={a}
                            onClick={() => { setSelAmt(a); setCustom("") }}
                            className={`fp-chip ${selAmt === a && !custom ? "active" : ""}`}
                            disabled={isAmountLocked}
                        >
                            {a} SOL
                        </button>
                    ))}
                </div>

                {/* Custom amount + USD conversion */}
                <div className="flex gap-2 items-center mb-1">
                    <input
                        className={`fp-input flex-1 ${customInvalid ? "border border-red-500/70 focus:border-red-500" : ""}`}
                        placeholder="Custom SOL amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={custom}
                        onChange={(e) => { setCustom(e.target.value); setSelAmt(0) }}
                        disabled={isAmountLocked}
                    />
                    <span className="font-mono text-xs text-t3 whitespace-nowrap min-w-[96px] text-right">
                        ≈ ${Math.round(displayAmt * SOL_USD).toLocaleString()} USD
                    </span>
                </div>

                {isAmountLocked ? (
                    <div className="mb-3 p-2 bg-green/10 border border-green/30 rounded text-green text-xs font-mono">
                        Amount is fixed at {displayAmt.toFixed(2)} SOL. Cannot be modified.
                    </div>
                ) : customInvalid ? (
                    <div className="flex items-center gap-1.5 mb-3">
                        <IconAlertTriangle size={12} className="text-red-400 shrink-0" />
                        <p className="font-mono text-xs text-red-400">
                            Enter a valid amount greater than 0.
                        </p>
                    </div>
                ) : (
                    <div className="mb-3" />
                )}

                {/* Optional message */}
                <div className="mb-1">
                    <textarea
                        className="fp-input w-full resize-none"
                        placeholder="Add a public message (optional)"
                        maxLength={200}
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>
                <p className="font-mono text-[10px] text-t3 text-right mb-4">
                    {message.length}/200
                </p>

                {/* Error from useFastPay hook */}
                {error && (
                    <div className="mb-4 p-2 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-xs">
                        {error}
                    </div>
                )}

                {connected && insufficientFunds && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <IconAlertTriangle size={12} className="text-red-400 shrink-0" />
                        <p className="font-mono text-xs text-red-400">
                            Insufficient balance — you have {walletBalance.toFixed(2)} SOL,
                            need {displayAmt.toFixed(2)} SOL.
                        </p>
                    </div>
                )}
            </div>

            {/* Recent activity feed (realtime) */}
            <RecentTips receiverUsername={user.username} />
        </div>
    )
}

export default function TipPage({
    onSuccess,
    onQR,
    initialHandle,
    initialAmount,
    isAmountLocked,
    walletInfo,
    connected,
    onConnect,
}) {
    // Shared resolved-user state (populated by either auto-load or manual search)
    const [user, setUser] = useState(null)
    const [notFound, setNotFound] = useState(false)

    // Profile-mode loading (auto-fetch from URL handle)
    const [profileLoading, setProfileLoading] = useState(!!initialHandle)

    // Search-mode state
    const [query, setQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        if (!initialHandle) return

        setQuery(initialHandle)
        setUser(null)
        setNotFound(false)
        setProfileLoading(true)

        fetchProfileByUsername(initialHandle).then((data) => {
            if (data) setUser(data)
            else setNotFound(true)
        }).catch(() => {
            setNotFound(true)
        }).finally(() => {
            setProfileLoading(false)
        })
    }, [initialHandle])

    const executeSearch = async (term) => {
        if (!term.trim()) return
        setIsSearching(true)
        setNotFound(false)
        setUser(null)

        const data = await fetchProfileByUsername(term).catch(() => null)
        if (data) setUser(data)
        else setNotFound(true)

        setIsSearching(false)
    }

    const clearSearch = () => {
        setUser(null)
        setNotFound(false)
        setQuery("")
    }

    if (initialHandle) {
        // ── Loading ──
        if (profileLoading) {
            return (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div
                        className="fp-card px-8 py-6 flex flex-col items-center gap-3 green-top"
                        style={{ minWidth: "200px" }}
                    >
                        <span className="w-2 h-2 rounded-full bg-green inline-block animate-pulse" />
                        <p className="font-mono text-xs text-t2 text-center">
                            Loading profile…
                        </p>
                    </div>
                </div>
            )
        }

        if (notFound) return <NotFound />

        if (!user) return null

        // ── Two-column layout ──
        return (
            <div>
                {/* Breadcrumb-style sub-heading */}
                <div className="mb-5">
                    <p className="font-mono text-[11px] text-t3 uppercase tracking-widest">
                        FastPay · Tip a Creator
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
                    <ProfileCard user={user} />
                    <PaymentPanel
                        user={user}
                        initialAmount={initialAmount}
                        isAmountLocked={isAmountLocked}
                        walletInfo={walletInfo}
                        connected={connected}
                        onConnect={onConnect}
                        onSuccess={onSuccess}
                    />
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-5">
                <h2 className="font-head font-extrabold text-lg text-t1 mb-1">
                    Send a Tip
                </h2>
                <p className="font-mono text-xs text-t2">
                    Search by username to send Solana securely.
                </p>
            </div>

            {/* Search bar (visible until a user is found) */}
            {!user && (
                <>
                    <p className="fp-slash mb-2.5">RECIPIENT LOOKUP</p>
                    <div className="flex gap-2 mb-4">
                        <input
                            className="fp-input flex-1"
                            placeholder="@username  (e.g., @jacob)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && executeSearch(query)}
                        />
                        <button
                            className="fp-btn-green shrink-0 min-w-[90px] justify-center"
                            onClick={() => executeSearch(query)}
                            disabled={isSearching}
                        >
                            {isSearching ? (
                                <IconLoader2 size={13} className="animate-spin" />
                            ) : (
                                <><IconSearch size={13} /> Find</>
                            )}
                        </button>
                    </div>

                    {/* Not-found state */}
                    {notFound && (
                        <div className="fp-card p-6 mb-4 flex flex-col items-center text-center gap-3">
                            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="22" cy="22" r="13" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                                <line x1="31.5" y1="31.5" x2="42" y2="42" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
                                <line x1="17" y1="17" x2="27" y2="27" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="27" y1="17" x2="17" y2="27" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <div>
                                <p className="font-head font-extrabold text-sm text-t1 mb-1">
                                    User not found
                                </p>
                                <p className="font-mono text-xs text-t3 leading-relaxed">
                                    <span className="text-red-400">"{query}"</span> isn't registered on FastPay yet.
                                    <br />Double-check the username or ask them to join.
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Two-column layout once a user is found via search */}
            {user && (
                <div>
                    {/* Escape hatch: go back to search */}
                    <button
                        className="flex items-center gap-1.5 font-mono text-xs text-t3 hover:text-t1 transition-colors mb-4"
                        onClick={clearSearch}
                    >
                        <IconArrowLeft size={13} /> Search again
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
                        <ProfileCard user={user} />
                        <PaymentPanel
                            user={user}
                            initialAmount={null}
                            isAmountLocked={false}
                            walletInfo={walletInfo}
                            connected={connected}
                            onConnect={onConnect}
                            onSuccess={onSuccess}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}