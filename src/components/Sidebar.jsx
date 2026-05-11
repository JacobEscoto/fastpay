import {
    IconSend,
    IconQrcode,
    IconWallet,
    IconCheck,
    IconX,
    IconUserCircle,
    IconChartAreaLine
} from "@tabler/icons-react"

const NAV = [
    {
        group: "Payments",
        items: [
            { id: "tip", label: "Send Tip", Icon: IconSend },
        ],
    },
    {
        group: "Identity",
        items: [
            { id: "qr", label: "QR Code", Icon: IconQrcode },
            { id: "profile", label: "Profile", Icon: IconUserCircle },
            { id: "analytics", label: "Analytics", Icon: IconChartAreaLine },
        ],
    },
]

export default function Sidebar({
    active,
    onNav,
    connected,
    onConnect,
    wallet,
    userProfile,   // { username, displayName } | null  — passed from App
    isOpen,
    onClose,
}) {
    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                    aria-label="Close sidebar"
                />
            )}

            <aside
                aria-label="Sidebar"
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg1 flex flex-col px-3 py-4 border-r transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 overflow-y-auto sidebar-scroll-desktop ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                style={{ borderRightColor: "rgba(255,255,255,0.06)" }}
            >
                {/* ── Mobile header ── */}
                <div className="flex items-center justify-between mb-4 lg:hidden px-2">
                    <h2 className="font-head font-extrabold text-sm tracking-tight text-t1">
                        Menu
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-t3 hover:text-t1 transition-colors"
                        aria-label="Close menu"
                    >
                        <IconX size={20} aria-hidden="true" />
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav aria-label="Main navigation" className="flex flex-col gap-4">
                    {NAV.map(({ group, items }) => (
                        <section key={group} aria-labelledby={`nav-group-${group}`}>
                            <h2
                                id={`nav-group-${group}`}
                                className="fp-slash text-t3 px-2 pb-2 pt-1 text-xs tracking-widest"
                            >
                                {group}
                            </h2>

                            <ul className="flex flex-col gap-1">
                                {items.map(({ id, label, Icon }) => {
                                    const isActive = active === id

                                    /* Profile item only makes sense when connected */
                                    const isDisabled = id === "profile" && !connected

                                    return (
                                        <li key={id}>
                                            <button
                                                type="button"
                                                onClick={() => !isDisabled && onNav(id)}
                                                aria-current={isActive ? "page" : undefined}
                                                aria-disabled={isDisabled}
                                                className={`fp-nav ${isActive ? "active" : ""} ${isDisabled ? "opacity-35 cursor-not-allowed" : ""
                                                    } flex items-center gap-2`}
                                            >
                                                <Icon size={14} aria-hidden="true" />
                                                <span>{label}</span>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        </section>
                    ))}
                </nav>

                <div className="flex-1 min-h-[20px]" />

                {/* ── Wallet card ─────────────────────────────────────────────────
                    Connected state shows:
                      • Display name (or "@username" fallback) as the identity anchor
                      • SOL balance as the primary number
                      • USD equivalent below
                    The raw address is hidden — users know their own wallet.
                ──────────────────────────────────────────────────────────────── */}
                <section
                    aria-labelledby="wallet-status-title"
                    className="mt-4 rounded-fp bg-bg2 p-3.5 shrink-0"
                    style={{
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderTop: "1px solid rgba(0,255,135,0.27)",
                    }}
                >
                    <h2
                        id="wallet-status-title"
                        className="fp-slash text-t3 mb-2 text-xs tracking-widest"
                    >
                        WALLET BALANCE
                    </h2>

                    {connected ? (
                        <div className="overflow-hidden">
                            {/* Identity line — display name or @username */}
                            {userProfile && (
                                <p className="font-mono text-xs text-green mb-1.5 truncate">
                                    {userProfile.displayName
                                        ? userProfile.displayName
                                        : `@${userProfile.username}`}
                                </p>
                            )}

                            {/* SOL balance */}
                            <p className="font-mono text-xl font-medium text-t1 tracking-tight truncate">
                                {wallet.sol} SOL
                            </p>

                            <p className="font-mono text-xs text-t2 mt-0.5 truncate">
                                {wallet.usd}
                            </p>

                            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-t2">
                                <span
                                    className="w-1.5 h-1.5 rounded-full bg-green inline-block shrink-0"
                                    aria-hidden="true"
                                />
                                Connected
                            </div>
                        </div>
                    ) : (
                        <p className="font-mono text-xs text-t3 mb-3">
                            Not connected
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={onConnect}
                        className="fp-btn-green w-full justify-center mt-2.5 min-h-10"
                    >
                        {connected ? (
                            <IconCheck size={13} aria-hidden="true" />
                        ) : (
                            <IconWallet size={13} aria-hidden="true" />
                        )}
                        <span>
                            {connected ? "Connected" : "Connect Phantom"}
                        </span>
                    </button>
                </section>
            </aside>
        </>
    )
}