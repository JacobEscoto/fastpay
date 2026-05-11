import { useState, useEffect, useRef } from "react"
import {
    IconAt,
    IconUser,
    IconCheck,
    IconX,
    IconLoader2,
    IconAlignLeft,
    IconSparkles,
} from "@tabler/icons-react"
import { supabase } from "../utils/supabase"

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

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

function FieldError({ message }) {
    if (!message) return null
    return (
        <p className="font-mono text-[10.5px] text-danger mt-1.5 flex items-center gap-1">
            <IconX size={10} aria-hidden="true" />
            {message}
        </p>
    )
}

function UsernameStatus({ status }) {
    if (status === "checking")
        return (
            <span className="font-mono text-[10.5px] text-t3 mt-1.5 flex items-center gap-1">
                <IconLoader2 size={10} className="animate-spin" aria-hidden="true" />
                Checking availability…
            </span>
        )
    if (status === "available")
        return (
            <span className="font-mono text-[10.5px] text-green mt-1.5 flex items-center gap-1">
                <IconCheck size={10} aria-hidden="true" />
                Username available
            </span>
        )
    if (status === "taken")
        return (
            <span className="font-mono text-[10.5px] text-danger mt-1.5 flex items-center gap-1">
                <IconX size={10} aria-hidden="true" />
                Already taken — try another
            </span>
        )
    return null
}

export default function ProfileRegistration({ walletAddress, onComplete, onCancel }) {
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")

    const [usernameError, setUsernameError] = useState(null)
    const [displayNameError, setDisplayNameError] = useState(null)

    const [usernameStatus, setUsernameStatus] = useState(null) // null | "checking" | "available" | "taken"
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)

    const debounceRef = useRef(null)
    const usernameRef = useRef(null)

    // Focus username on mount
    useEffect(() => {
        usernameRef.current?.focus()
    }, [])

    // Debounced Supabase availability check
    useEffect(() => {
        const validationErr = validateUsername(username)
        setUsernameError(validationErr)

        if (validationErr) {
            setUsernameStatus(null)
            clearTimeout(debounceRef.current)
            return
        }

        setUsernameStatus("checking")
        clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            const { data } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", username.toLowerCase())
                .maybeSingle()

            setUsernameStatus(data ? "taken" : "available")
        }, 420)

        return () => clearTimeout(debounceRef.current)
    }, [username])

    const handleUsernameChange = (e) => {
        setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
    }

    const handleDisplayNameBlur = () => {
        setDisplayNameError(validateDisplayName(displayName))
    }

    const canSubmit =
        !usernameError &&
        usernameStatus === "available" &&
        !validateDisplayName(displayName) &&
        !submitting

    const handleSubmit = async () => {
        const uErr = validateUsername(username)
        const dErr = validateDisplayName(displayName)
        setUsernameError(uErr)
        setDisplayNameError(dErr)
        if (uErr || dErr || usernameStatus !== "available") return

        setSubmitting(true)
        setSubmitError(null)

        const { error } = await supabase.from("profiles").insert([
            {
                username: username.toLowerCase(),
                wallet_address: walletAddress,
                display_name: displayName.trim(),
                bio: bio.trim() || null,
            },
        ])

        setSubmitting(false)

        if (error) {
            if (error.code === "23505") {
                setUsernameStatus("taken")
                setUsernameError("Username was just taken. Try another.")
            } else {
                setSubmitError("Something went wrong. Please try again.")
            }
            return
        }

        onComplete?.({ username: username.toLowerCase(), displayName: displayName.trim() })
    }

    const shortAddr = walletAddress
        ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
        : "—"

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: "rgba(12,15,14,0.88)" }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="reg-title"
                className="w-full sm:w-[420px] bg-bg1 rounded-t-[20px] sm:rounded-fp overflow-hidden"
                style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderTop: "1px solid rgba(0,255,135,0.30)",
                    maxHeight: "90dvh",
                    overflowY: "auto",
                }}
            >
                <div
                    className="px-6 pt-6 pb-5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-fp flex items-center justify-center shrink-0"
                                style={{
                                    background: "rgba(0,255,135,0.08)",
                                    border: "1px solid rgba(0,255,135,0.22)",
                                }}
                                aria-hidden="true"
                            >
                                <IconSparkles size={16} className="text-green" />
                            </div>

                            <div>
                                <h2
                                    id="reg-title"
                                    className="font-head font-extrabold text-base text-t1 leading-tight"
                                >
                                    Create your profile
                                </h2>
                                <p className="font-mono text-[11px] text-t3 mt-0.5">
                                    One-time setup · linked to your wallet
                                </p>
                            </div>
                        </div>

                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="text-t3 hover:text-t1 transition-colors mt-0.5 shrink-0"
                                aria-label="Cancel registration"
                            >
                                <IconX size={18} />
                            </button>
                        )}
                    </div>

                    <div
                        className="mt-4 flex items-center gap-2 rounded-fp px-3 py-2"
                        style={{
                            background: "rgba(0,255,135,0.05)",
                            border: "1px solid rgba(0,255,135,0.15)",
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-green shrink-0"
                            aria-hidden="true"
                        />
                        <span className="font-mono text-[11px] text-t2">
                            Wallet connected —&nbsp;
                        </span>
                        <span className="font-mono text-[11px] text-green">
                            {shortAddr}
                        </span>
                    </div>
                </div>

                <div className="px-6 py-5 flex flex-col gap-5">

                    <div>
                        <FieldLabel htmlFor="reg-username" required>
                            Username
                        </FieldLabel>

                        <div className="relative">
                            <span
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-t3 pointer-events-none"
                                aria-hidden="true"
                            >
                                <IconAt size={13} />
                            </span>

                            <input
                                ref={usernameRef}
                                id="reg-username"
                                type="text"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                maxLength={20}
                                value={username}
                                onChange={handleUsernameChange}
                                placeholder="your_handle"
                                aria-describedby="username-hint"
                                aria-invalid={!!usernameError || usernameStatus === "taken"}
                                className="fp-input pl-7 pr-8"
                                style={
                                    usernameStatus === "available"
                                        ? { borderColor: "rgba(0,255,135,0.50)" }
                                        : usernameStatus === "taken" || usernameError
                                            ? { borderColor: "rgba(255,64,96,0.50)" }
                                            : {}
                                }
                            />

                            <span
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                aria-hidden="true"
                            >
                                {usernameStatus === "checking" && (
                                    <IconLoader2 size={12} className="text-t3 animate-spin" />
                                )}
                                {usernameStatus === "available" && (
                                    <IconCheck size={12} className="text-green" />
                                )}
                                {(usernameStatus === "taken" || usernameError) && username && (
                                    <IconX size={12} className="text-danger" />
                                )}
                            </span>
                        </div>

                        <span id="username-hint" className="sr-only">
                            3–20 characters, lowercase letters, numbers, underscores only
                        </span>

                        {usernameError && username ? (
                            <FieldError message={usernameError} />
                        ) : (
                            <UsernameStatus status={usernameStatus} />
                        )}

                        {!usernameError && !username && (
                            <p className="font-mono text-[10.5px] text-t3 mt-1.5">
                                3–20 chars · a–z, 0–9, underscores
                            </p>
                        )}
                    </div>

                    <div>
                        <FieldLabel htmlFor="reg-display" required>
                            Display name
                        </FieldLabel>

                        <div className="relative">
                            <span
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-t3 pointer-events-none"
                                aria-hidden="true"
                            >
                                <IconUser size={13} />
                            </span>

                            <input
                                id="reg-display"
                                type="text"
                                autoComplete="name"
                                maxLength={40}
                                value={displayName}
                                onChange={(e) => {
                                    setDisplayName(e.target.value)
                                    if (displayNameError) setDisplayNameError(null)
                                }}
                                onBlur={handleDisplayNameBlur}
                                placeholder="How others see you"
                                aria-invalid={!!displayNameError}
                                className="fp-input pl-7"
                                style={
                                    displayNameError
                                        ? { borderColor: "rgba(255,64,96,0.50)" }
                                        : {}
                                }
                            />
                        </div>

                        <FieldError message={displayNameError} />
                    </div>

                    <div>
                        <FieldLabel htmlFor="reg-bio">
                            Bio
                            <span className="text-t3 ml-1.5 normal-case font-normal tracking-normal">
                                — optional
                            </span>
                        </FieldLabel>

                        <div className="relative">
                            <span
                                className="absolute left-3 top-2.5 text-t3 pointer-events-none"
                                aria-hidden="true"
                            >
                                <IconAlignLeft size={13} />
                            </span>

                            <textarea
                                id="reg-bio"
                                rows={3}
                                maxLength={160}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Short description (160 chars max)"
                                className="fp-input pl-7 resize-none leading-relaxed"
                                style={{ paddingTop: "8px" }}
                            />
                        </div>

                        <p className="font-mono text-[10.5px] text-t3 mt-1.5 text-right">
                            {bio.length}/160
                        </p>
                    </div>

                    {submitError && (
                        <p
                            className="font-mono text-[11px] text-danger flex items-center gap-1.5 rounded-fp px-3 py-2"
                            style={{ background: "rgba(255,64,96,0.07)", border: "1px solid rgba(255,64,96,0.20)" }}
                            role="alert"
                        >
                            <IconX size={12} aria-hidden="true" />
                            {submitError}
                        </p>
                    )}
                </div>

                <div
                    className="px-6 pb-6 flex flex-col gap-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="fp-btn-green w-full justify-center min-h-10 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <IconLoader2
                                        size={13}
                                        className="animate-spin"
                                        aria-hidden="true"
                                    />
                                    Creating profile…
                                </>
                            ) : (
                                <>
                                    <IconCheck size={13} aria-hidden="true" />
                                    Create profile
                                </>
                            )}
                        </button>
                    </div>

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

                    <p className="font-mono text-[10px] text-t3 text-center pt-1 leading-relaxed">
                        Your username is permanent · wallet address mapped on-chain
                    </p>
                </div>
            </div>
        </div>
    )
}