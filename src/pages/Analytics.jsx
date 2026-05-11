import { useState, useEffect } from "react"
import { IconCash, IconUsers, IconTrendingUp, IconLoader2, IconChartBar, IconWallet } from "@tabler/icons-react"
import { supabase } from "../utils/supabase"

export default function Analytics({ username, connected }) {
    const [stats, setStats] = useState({ totalSol: 0, count: 0, topSupporters: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!connected) {
            setLoading(false)
            return
        }

        if (connected && !username) {
            setLoading(true)
            return
        }

        fetchAnalytics()
    }, [username, connected])

    async function fetchAnalytics() {
        try {
            setLoading(true)
            const cleanName = username.replace('@', '').toLowerCase()

            const { data, error } = await supabase
                .from('tips')
                .select('amount_lamports, sender_address')
                .eq('receiver_username', cleanName)

            if (error) throw error

            if (data && data.length > 0) {
                // Total income calculation
                const totalLamports = data.reduce((sum, tip) => sum + (Number(tip.amount_lamports) || 0), 0)
                const sol = totalLamports / 1e9

                // Top supporter calculation
                const groups = data.reduce((acc, tip) => {
                    const addr = tip.sender_address
                    const amount = Number(tip.amount_lamports) / 1e9
                    acc[addr] = (acc[addr] || 0) + amount
                    return acc
                }, {})

                const sortedSupporters = Object.entries(groups)
                    .map(([address, total]) => ({ address, total }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 3)

                setStats({ totalSol: sol, count: data.length, topSupporters: sortedSupporters })
            } else {
                setStats({ totalSol: 0, count: 0, topSupporters: [] })
            }
        } catch (err) {
            console.error("Analytics fetch error:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
                <IconLoader2 className="animate-spin text-green" size={32} />
                <p className="font-mono text-xs text-t3 uppercase tracking-widest">Loading stats...</p>
            </div>
        )
    }

    if (!connected) {
        return (
            <div className="fp-card p-10 flex flex-col items-center text-center gap-4">
                <IconWallet size={40} className="text-t3 opacity-20" />
                <div>
                    <h2 className="font-head font-bold text-t1">Wallet disconnected</h2>
                    <p className="font-mono text-xs text-t3">Connect your wallet to view your earnings</p>
                </div>
            </div>
        )
    }

    return (
        <main className="flex flex-col gap-4">
            <header className="mb-5">
                <h1 className="font-head font-extrabold text-lg text-t1 mb-1">Analytics</h1>
                <p className="font-mono text-xs  uppercase text-t3">Your Performance</p>
            </header>

            <div className="grid grid-cols-2 gap-3">
                <div className="fp-card p-4 border-l-2 border-green bg-bg2">
                    <div className="flex items-center gap-2 text-t3 mb-1">
                        <IconCash size={14} />
                        <span className="font-mono text-[9px] uppercase tracking-wider">Total Revenue</span>
                    </div>
                    <p className="font-head font-black text-xl text-t1">
                        {stats.totalSol.toFixed(3)} <span className="text-[10px] text-green font-mono">SOL</span>
                    </p>
                </div>

                <div className="fp-card p-4 bg-bg2">
                    <div className="flex items-center gap-2 text-t3 mb-1">
                        <IconTrendingUp size={14} />
                        <span className="font-mono text-[9px] uppercase tracking-wider">Total Tips</span>
                    </div>
                    <p className="font-head font-black text-xl text-t1">{stats.count}</p>
                </div>
            </div>

            <section className="fp-card p-4 bg-bg2">
                <div className="flex items-center gap-2 text-t3 mb-4">
                    <IconUsers size={14} />
                    <span className="font-mono text-[9px] uppercase tracking-wider">Top Supporters</span>
                </div>

                {stats.topSupporters.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {stats.topSupporters.map((s, i) => (
                            <div key={s.address} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                                <span className="font-mono text-[10px] text-t2 bg-bg3 px-2 py-0.5 rounded">
                                    {s.address.slice(0, 4)}...{s.address.slice(-4)}
                                </span>
                                <span className="font-head font-bold text-xs text-green">
                                    {s.total.toFixed(2)} SOL
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-lg">
                        <p className="font-mono text-[10px] text-t3 uppercase italic">No activity detected yet</p>
                    </div>
                )}
            </section>
        </main>
    )
}