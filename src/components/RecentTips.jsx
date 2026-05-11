import { useState, useEffect } from "react"
import { IconHistory, IconExternalLink } from "@tabler/icons-react"
import { supabase } from "../utils/supabase"

function RecentTipsSkeleton() {
    return (
        <section className="mt-6">
            <p className="fp-slash mb-4 uppercase">Recent Activity</p>

            <ul className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                    <li
                        key={index}
                        className="fp-card p-3 flex items-center justify-between"
                    >
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
                            <div className="h-2.5 w-24 rounded bg-white/5 animate-pulse" />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
                            <div className="h-4 w-4 rounded bg-white/5 animate-pulse" />
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}

export default function RecentTips({ receiverUsername }) {
    const normalizedReceiver =
        receiverUsername?.replace("@", "").toLowerCase() || ""

    const [tips, setTips] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!normalizedReceiver) {
            setTips([])
            setLoading(false)
            return
        }

        let isMounted = true

        const fetchTips = async () => {
            try {
                setLoading(true)

                const { data, error } = await supabase
                    .from("tips")
                    .select("*")
                    .eq("receiver_username", normalizedReceiver)
                    .order("timestamp_blockchain", { ascending: false })
                    .limit(10)

                if (!isMounted) return

                if (!error) {
                    setTips(data || [])
                }
            } catch (err) {
                console.error("Error fetching tips:", err)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        setTips([])
        fetchTips()

        const channel = supabase
            .channel(`public:tips:${normalizedReceiver}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "tips",
                    filter: `receiver_username=eq.${normalizedReceiver}`,
                },
                (payload) => {
                    setTips((prev) => [payload.new, ...prev].slice(0, 10))
                }
            )
            .subscribe()

        return () => {
            isMounted = false
            supabase.removeChannel(channel)
        }
    }, [normalizedReceiver])

    const formatDate = (seconds) => {
        return new Date(seconds * 1000).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (!normalizedReceiver) {
        return null
    }

    if (loading && tips.length === 0) {
        return <RecentTipsSkeleton />
    }

    if (!tips.length) {
        return (
            <section className="fp-card p-6 mt-3 flex flex-col items-center text-center gap-3">
                <IconHistory size={32} className="text-t3 opacity-20" />

                <div>
                    <p className="font-head font-extrabold text-sm text-t1">
                        No activity yet
                    </p>

                    <p className="font-mono text-xs text-t3">
                        Be the first to support this creator!
                    </p>
                </div>
            </section>
        )
    }

    return (
        <section className="mt-6">
            <p className="fp-slash mb-4 uppercase">
                Recent Activity
            </p>

            <ul className="flex flex-col gap-2">
                {tips.map((tip) => (
                    <li
                        key={tip.signature}
                        className="fp-card p-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="font-head font-bold text-sm text-t1">
                                {tip.message || "Support Tip"}
                            </span>

                            <time className="font-mono text-[10px] text-t3">
                                {formatDate(tip.timestamp_blockchain)}
                            </time>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-green font-bold">
                                +{(tip.amount_lamports / 1e9).toFixed(2)} SOL
                            </span>

                            <a
                                href={`https://solscan.io/tx/${tip.signature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-t3 hover:text-green transition-colors"
                            >
                                <IconExternalLink size={14} />
                            </a>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}