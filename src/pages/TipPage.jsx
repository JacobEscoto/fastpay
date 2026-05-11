import { useState, useEffect } from "react"
import { IconSearch, IconSend, IconCheck, IconLoader2, IconAlertTriangle, IconWallet } from "@tabler/icons-react"
import { useFastPay } from "../hooks/useFastPay"
import RecentTips from "../components/RecentTips"
import ErrorToast from "../components/ErrorToast"
import { supabase } from "../utils/supabase"

const AMOUNTS = [0.1, 0.5, 1, 5, 10]
const SOL_USD = 146.4

export default function TipPage({ onSuccess, onQR, initialHandle, initialAmount, walletInfo, connected, onConnect }) {
    const { sendTip, loading, error } = useFastPay()

    const [query, setQuery] = useState("")
    const [user, setUser] = useState(null)
    const [notFound, setNotFound] = useState(false)
    const [isSearching, setIsSearching] = useState(false)

    const [selAmt, setSelAmt] = useState(0.5)
    const [custom, setCustom] = useState("")
    const [message, setMessage] = useState("")
    const [lastTx, setLastTx] = useState(0)
    const [sent, setSent] = useState(false)
    const [errorMsg, setErrorMsg] = useState(null)

    // Handles the search when the URL already contains a user (e.g., /@jacob)
    useEffect(() => {
        if (initialHandle) {
            setQuery(initialHandle)
            executeSearch(initialHandle)
        }

        if (initialAmount) {
            if (AMOUNTS.includes(initialAmount)) {
                setSelAmt(initialAmount)
                setCustom("")
            } else {
                setCustom(String(initialAmount))
                setSelAmt(0)
            }
        }
    }, [initialHandle, initialAmount])

    // Main function for searching in Supabase
    async function executeSearch(searchTerm) {
        if (!searchTerm.trim()) return

        setIsSearching(true)
        setNotFound(false)
        setUser(null)

        const cleanUsername = searchTerm.trim().replace('@', '').toLowerCase()

        try {
            const { data, err } = await supabase
                .from('profiles')
                .select('username, display_name, bio, avatar_url, wallet_address')
                .eq('username', cleanUsername)
                .maybeSingle()

            if (err || !data) {
                setNotFound(true)
            } else {
                setUser(data)
            }
        } catch (err) {
            console.error("Error buscando usuario:", err)
            setNotFound(true)
        } finally {
            setIsSearching(false)
        }
    }

    function search() {
        executeSearch(query)
    }

    async function send() {
        if (!user?.wallet_address) return

        const amt = parseFloat(custom) > 0 ? parseFloat(custom) : selAmt
        const finalMsg = message.trim() === "" ? `Tip sent via FastPay to @${user.username}` : message

        try {
            const signature = await sendTip(user.wallet_address, user.username, amt, finalMsg)

            onSuccess({
                message: `${amt.toFixed(2)} SOL sent to @${user.username}`,
                hash: signature,
                handle: `@${user.username}`,
                amount: amt,
            })

            setSent(true)
            setTimeout(() => setSent(false), 2000)

            setCustom("")
            setMessage("")
            setLastTx(Date.now())
        } catch (err) {
            setErrorMsg(err?.message || "An unexpected error ocurred")
        }
    }

    const displayAmt = parseFloat(custom) > 0 ? parseFloat(custom) : selAmt
    const walletBalance = parseFloat(walletInfo?.sol) || 0
    const insufficientFunds = user && displayAmt > 0 && walletBalance < displayAmt
    const customInvalid = custom !== "" && (isNaN(parseFloat(custom)) || parseFloat(custom) <= 0)

    return (
        <div>
            {errorMsg && (
                <ErrorToast
                    message={errorMsg}
                    type="error"
                    duration={5000}
                    onClose={() => setErrorMsg(null)}
                />
            )}

            <div className="mb-5">
                <h2 className="font-head font-extrabold text-lg text-t1 mb-1">Send a Tip</h2>
                <p className="font-mono text-xs text-t2">Search by username to send Solana securely.</p>
            </div>

            <p className="fp-slash mb-2.5">RECIPIENT LOOKUP</p>
            <div className="flex gap-2 mb-4">
                <input
                    className="fp-input flex-1"
                    placeholder="@username (e.g., @jacob)"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && search()}
                />
                <button
                    className="fp-btn-green shrink-0 min-w-[90px] justify-center"
                    onClick={search}
                    disabled={isSearching}
                >
                    {isSearching ? <IconLoader2 size={13} className="animate-spin" /> : <><IconSearch size={13} /> Find</>}
                </button>
            </div>

            {notFound && !user && (
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

            {user && (
                <>
                    <div className="bg-bg2 rounded-fp p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3" style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
                        {/* Avatar */}
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-head font-extrabold text-base shrink-0"
                                style={{ background: "rgba(0,255,135,0.07)", border: "1px solid rgba(0,255,135,0.22)", color: "#00FF87" }}>
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(user.display_name)
                                )}
                            </div>

                            <div className="flex-1 sm:hidden">
                                <p className="font-head font-extrabold text-base text-t1">{user.display_name}</p>
                                <p className="font-mono text-xs text-green">@{user.username}</p>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="hidden sm:block flex-1">
                            <p className="font-head font-extrabold text-base text-t1">{user.display_name}</p>
                            <p className="font-mono text-xs text-green mb-1">@{user.username}</p>
                            {user.bio && <p className="font-mono text-xs text-t2 mb-1.5">{user.bio}</p>}
                        </div>

                        <div className="sm:hidden w-full">
                            {user.bio && <p className="font-mono text-xs text-t2 mb-1.5">{user.bio}</p>}
                        </div>

                        {/* Verified Badge */}
                        <div className="w-full sm:w-auto sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0" style={{ borderColor: "rgba(255,255,255,0.10)" }}>
                            <span className="fp-badge-green inline-flex items-center gap-1"><IconCheck size={10} /> Verified Profile</span>
                        </div>
                    </div>

                    <div className="fp-card green-top p-4 mb-3">
                        <p className="fp-slash mb-3">SELECT AMOUNT</p>
                        <div className="flex gap-2 flex-wrap mb-3">
                            {AMOUNTS.map(a => (
                                <button
                                    key={a}
                                    onClick={() => { setSelAmt(a); setCustom("") }}
                                    className={`fp-chip ${selAmt === a && !custom ? "active" : ""}`}
                                >
                                    {a} SOL
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center mb-1">
                            <div className="flex gap-2 items-center w-full">
                                <input
                                    className={`fp-input flex-1 ${customInvalid ? "border border-red-500/70 focus:border-red-500" : ""}`}
                                    placeholder="Custom SOL amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={custom}
                                    onChange={e => { setCustom(e.target.value); setSelAmt(0) }}
                                />
                                <span className="font-mono text-xs text-t3 whitespace-nowrap min-w-[80px]">
                                    ≈ ${Math.round(displayAmt * SOL_USD).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {customInvalid && (
                            <div className="flex items-center gap-1.5 mb-3">
                                <IconAlertTriangle size={12} className="text-red-400 shrink-0" />
                                <p className="font-mono text-xs text-red-400">Enter a valid amount greater than 0.</p>
                            </div>
                        )}

                        {!customInvalid && <div className="mb-3" />}

                        <div className="mb-4">
                            <input
                                className="fp-input w-full"
                                placeholder="Add a public message (optional)"
                                maxLength={200}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-2 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-xs">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2">
                            {!connected ? (
                                <button
                                    className="fp-btn-green flex-1 justify-center"
                                    onClick={onConnect}
                                >
                                    <IconWallet size={13} /> Connect Wallet to Send
                                </button>
                            ) : (
                                <button
                                    className="fp-btn-green flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={send}
                                    disabled={loading || insufficientFunds || customInvalid || sent}
                                >
                                    {sent ? (
                                        <><IconCheck size={13} /> Sent!</>
                                    ) : loading ? (
                                        <><IconLoader2 size={13} className="animate-spin" /> Processing...</>
                                    ) : (
                                        <><IconSend size={13} /> Send via Phantom</>
                                    )}
                                </button>
                            )}
                        </div>

                        {insufficientFunds && (
                            <div className="flex items-center gap-1.5 mt-2">
                                <IconAlertTriangle size={12} className="text-red-400 shrink-0" />
                                <p className="font-mono text-xs text-red-400">
                                    Insufficient balance — you have {walletBalance.toFixed(2)} SOL, need {displayAmt.toFixed(2)} SOL.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {user?.username && (
                <RecentTips receiverUsername={user.username} />
            )}
        </div>
    )
}

function getInitials(name) {
    if (!name?.trim()) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}