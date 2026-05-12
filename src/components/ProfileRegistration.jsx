import { useState, useEffect, useRef } from "react"
import {
    IconAt,
    IconUser,
    IconCheck,
    IconX,
    IconLoader2,
    IconAlignLeft,
    IconSparkles,
    IconChevronDown,
    IconUserCircle,
    IconPalette,
    IconBriefcase2,
    IconHeartHandshake
} from "@tabler/icons-react"
import { supabase } from "../utils/supabase"

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

// Definición de roles para el selector
const ROLES = [
    { id: "personal", label: "Personal Use", icon: <IconUserCircle size={14} /> },
    { id: "creator", label: "Content Creator", icon: <IconPalette size={14} /> },
    { id: "freelancer", label: "Freelancer", icon: <IconBriefcase2 size={14} /> },
    { id: "non-profit", label: "Non-Profit", icon: <IconHeartHandshake size={14} /> }
]

function validateUsername(value) {
    if (!value) return "Username is required."
    if (value.length < 3) return "Minimum 3 characters."
    if (value.length > 20) return "Maximum 20 characters."
    if (!/^[a-z0-9_]+$/.test(value))
        return "Only lowercase letters, numbers, and underscores."
    return null
}

function validateDisplayName(value) {
    if (!value.trim()) return "Display name is required."
    if (value.trim().length < 2) return "Minimum 2 characters."
    if (value.trim().length > 40) return "Maximum 40 characters."
    return null
}

function FieldLabel({ htmlFor, children, required }) {
    return (
        <label
            htmlFor={htmlFor}
            className="font-mono text-xs text-t2 mb-1.5 block tracking-wide"
        >
            {children}
            {required && (
                <span className="text-green ml-0.5" aria-hidden="true">*</span>
            )}
        </label>
    )
}

export default function ProfileRegistration({ walletAddress, onComplete, onCancel }) {
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [role, setRole] = useState("personal") // Estado para el nuevo selector
    const [bio, setBio] = useState("")

    // Estados originales preservados por solicitud del usuario
    const [usernameError, setUsernameError] = useState(null)
    const [displayNameError, setDisplayNameError] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)

    const checkTimeout = useRef(null)

    const checkUsernameAvailability = async (name) => {
        const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", name.toLowerCase())
            .maybeSingle()

        if (data) {
            setUsernameError("Username is already taken.")
        }
    }

    useEffect(() => {
        if (username.length >= 3 && /^[a-z0-9_]+$/.test(username)) {
            if (checkTimeout.current) clearTimeout(checkTimeout.current)
            checkTimeout.current = setTimeout(() => {
                checkUsernameAvailability(username)
            }, 500)
        }
        return () => clearTimeout(checkTimeout.current)
    }, [username])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (submitting) return

        // Limpieza de estados de error antes de validar
        setUsernameError(null)
        setDisplayNameError(null)
        setSubmitError(null)

        const uErr = validateUsername(username)
        const dErr = validateDisplayName(displayName)

        if (uErr || dErr) {
            setUsernameError(uErr)
            setDisplayNameError(dErr)
            return
        }

        setSubmitting(true)

        try {
            const { data, error } = await supabase
                .from("profiles")
                .insert([{
                    username: username.toLowerCase().trim(),
                    display_name: displayName.trim(),
                    wallet_address: walletAddress,
                    user_role: role, // Inserción del rol seleccionado
                    bio: bio.trim()
                }])
                .select()
                .single()

            if (error) throw error
            onComplete(data)
        } catch (err) {
            setSubmitError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="fp-card w-full max-w-md my-auto green-top overflow-hidden">
                <div className="p-6 sm:p-8">
                    <header className="mb-8 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                            <div className="w-9 h-9 rounded-fp flex items-center justify-center shrink-0" style={{
                                background: "rgba(0, 255, 255, 0.08)",
                                border: "1px solid rgba(0, 255, 255, 0.22)"
                            }}
                                aria-hidden="true"
                            >
                                <IconSparkles size={18} className="text-green" />
                            </div>
                            <div>
                                <h2
                                    id="reg-title"
                                    className="font-head font-extrabold text-xl text-t1 leading-tight"
                                >
                                    Create your profile
                                </h2>
                                <p className="font-mono text-[11px] text-t3 mt-0.5">
                                    One-time setup · linked to your wallet
                                </p>
                            </div>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {submitError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 font-mono text-[10px] uppercase">
                                {submitError}
                            </div>
                        )}

                        <div>
                            <FieldLabel htmlFor="username" required>Username</FieldLabel>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-t3">
                                    <IconAt size={14} />
                                </span>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value.toLowerCase())
                                        setUsernameError(null)
                                    }}
                                    className={`w-full bg-white/5 border ${usernameError ? 'border-red-500/50' : 'border-white/10'} rounded-lg pl-10 pr-4 py-3 font-mono text-xs text-t1 outline-none focus:border-green transition-all`}
                                    placeholder="johndoe"
                                />
                            </div>
                            {usernameError && (
                                <p className="text-[10px] text-red-400 mt-1 font-mono uppercase tracking-tight">
                                    {usernameError}
                                </p>
                            )}
                        </div>

                        <div>
                            <FieldLabel htmlFor="displayName" required>Display Name</FieldLabel>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-t3">
                                    <IconUser size={14} />
                                </span>
                                <input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => {
                                        setDisplayName(e.target.value)
                                        setDisplayNameError(null)
                                    }}
                                    className={`w-full bg-white/5 border ${displayNameError ? 'border-red-500/50' : 'border-white/10'} rounded-lg pl-10 pr-4 py-3 font-mono text-xs text-t1 outline-none focus:border-green transition-all`}
                                    placeholder="John Doe"
                                />
                            </div>
                            {displayNameError && (
                                <p className="text-[10px] text-red-400 mt-1 font-mono uppercase tracking-tight">
                                    {displayNameError}
                                </p>
                            )}
                        </div>

                        {/* SECCIÓN DEL SELECTOR DE ROL */}
                        <div>
                            <FieldLabel htmlFor="role" required>Account Type</FieldLabel>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-t3 pointer-events-none">
                                    {ROLES.find(r => r.id === role)?.icon}
                                </span>
                                <select
                                    id="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 font-mono text-xs text-t1 outline-none focus:border-green transition-all appearance-none cursor-pointer"
                                >
                                    {ROLES.map(r => (
                                        <option key={r.id} value={r.id} className="bg-[#121212]">
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-t3 pointer-events-none">
                                    <IconChevronDown size={14} />
                                </span>
                            </div>
                        </div>

                        <div>
                            <FieldLabel htmlFor="bio">Bio (Optional)</FieldLabel>
                            <div className="relative">
                                <span className="absolute left-4 top-4 text-t3">
                                    <IconAlignLeft size={14} />
                                </span>
                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 font-mono text-xs text-t1 outline-none focus:border-green transition-all min-h-[80px] resize-none"
                                    placeholder="Tell the world who you are..."
                                />
                            </div>
                        </div>

                        <div className="pt-2 space-y-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="fp-btn-green w-full justify-center py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <IconLoader2 size={13} className="animate-spin" aria-hidden="true" />
                                        Creating profile…
                                    </>
                                ) : (
                                    <>
                                        <IconCheck size={13} aria-hidden="true" />
                                        Create profile
                                    </>
                                )}
                            </button>

                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="fp-btn-ghost w-full justify-center"
                                >
                                    <IconX size={12} aria-hidden="true" />
                                    Cancel
                                </button>
                            )}
                        </div>

                        <p className="font-mono text-[10px] text-t3 text-center pt-1 leading-relaxed">
                            Your username is permanent · wallet address mapped on-chain
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}