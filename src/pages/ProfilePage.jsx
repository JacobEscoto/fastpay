import { useState, useEffect, useRef, useCallback } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import {
    IconUser,
    IconAlignLeft,
    IconCheck,
    IconX,
    IconLoader2,
    IconCamera,
    IconAt,
    IconDeviceFloppy,
    IconAlertTriangle,
} from "@tabler/icons-react"
import { supabase } from "../utils/supabase"

function validateDisplayName(v) {
    if (!v.trim()) return "Display name is required."
    if (v.trim().length < 2) return "Minimum 2 characters."
    if (v.trim().length > 40) return "Maximum 40 characters."
    return null
}

function FieldLabel({ htmlFor, children, optional }) {
    return (
        <label
            htmlFor={htmlFor}
            className="font-mono text-xs text-t2 mb-1.5 block tracking-wide"
        >
            {children}
            {optional && (
                <span className="text-t3 ml-1.5 font-normal normal-case tracking-normal">
                    — optional
                </span>
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

function getInitials(name) {
    if (!name?.trim()) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Avatar Uploader
function AvatarUploader({ currentUrl, displayName, onFileSelected, uploading }) {
    const fileRef = useRef(null)
    const [preview, setPreview] = useState(currentUrl || null)
    const [imgError, setImgError] = useState(false)

    /* Sync preview whenever the loaded URL changes (initial load or after save) */
    useEffect(() => {
        setPreview(currentUrl || null)
        setImgError(false)
    }, [currentUrl])

    const handleFile = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.")
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be under 2 MB.")
            return
        }

        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)
        setImgError(false)
        onFileSelected(file)
    }

    const initials = getInitials(displayName)

    return (
        <div className="flex items-center gap-5">
            {/* Avatar circle */}
            <div className="relative shrink-0">
                <div
                    className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                    style={{
                        background: "rgba(0,255,135,0.07)",
                        border: "2px solid rgba(0,255,135,0.22)",
                    }}
                >
                    {preview && !imgError ? (
                        <img
                            src={preview}
                            alt="Profile avatar"
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <span className="font-head font-extrabold text-2xl text-green select-none">
                            {initials}
                        </span>
                    )}
                </div>

                {/* Camera badge */}
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{
                        background: "#141a17",
                        border: "1.5px solid rgba(0,255,135,0.35)",
                    }}
                    aria-label="Change profile picture"
                >
                    {uploading
                        ? <IconLoader2 size={12} className="text-green animate-spin" aria-hidden="true" />
                        : <IconCamera size={12} className="text-green" aria-hidden="true" />
                    }
                </button>
            </div>

            {/* Text hint */}
            <div className="flex flex-col gap-1">
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="fp-btn-ghost text-left px-3 py-1.5"
                >
                    <IconCamera size={12} aria-hidden="true" />
                    {uploading ? "Uploading…" : "Upload photo"}
                </button>
                <p className="font-mono text-[10px] text-t3 px-1">
                    JPG, PNG or WEBP · max 2 MB
                </p>
            </div>

            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleFile}
                aria-hidden="true"
                tabIndex={-1}
            />
        </div>
    )
}

// Loading Skeleton
function Skeleton({ className }) {
    return (
        <div
            className={`rounded-fp animate-pulse ${className}`}
            style={{ background: "rgba(255,255,255,0.05)" }}
        />
    )
}

export default function ProfilePage() {
    const { publicKey, connected } = useWallet()

    // Remote data
    const [loadStatus, setLoadStatus] = useState("loading") // loading | ready | error
    const [username, setUsername] = useState("")

    // Form Fields
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")

    const originalRef = useRef({ displayName: "", bio: "", avatarUrl: "" })
    const [pendingFile, setPendingFile] = useState(null) // File | null

    // UI state
    const [displayNameError, setDisplayNameError] = useState(null)
    const [saveStatus, setSaveStatus] = useState("idle") // idle | saving | saved | error
    const [saveError, setSaveError] = useState(null)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    // Load profile
    useEffect(() => {
        if (!connected || !publicKey) return

        setLoadStatus("loading")

        supabase
            .from("profiles")
            .select("username, display_name, bio, avatar_url")
            .eq("wallet_address", publicKey.toBase58())
            .maybeSingle()
            .then(({ data, error }) => {
                if (error || !data) {
                    setLoadStatus("error")
                    return
                }

                const dn = data.display_name ?? ""
                const b = data.bio ?? ""
                /* Strip any leftover cache-buster from a previous session so
                   the initial URL is clean and comparisons stay predictable. */
                const av = (data.avatar_url ?? "").split("?")[0]

                /* Add a fresh cache-buster so the image always loads on entry */
                const avDisplay = av ? `${av}?t=${Date.now()}` : ""

                setUsername(data.username ?? "")
                setDisplayName(dn)
                setBio(b)
                setAvatarUrl(avDisplay)
                originalRef.current = { displayName: dn, bio: b, avatarUrl: avDisplay }
                setLoadStatus("ready")
            })
    }, [connected, publicKey?.toBase58()])

    /* ── Dirty check ── */
    const isDirty =
        displayName !== originalRef.current.displayName ||
        bio !== originalRef.current.bio ||
        pendingFile !== null

    /* ── Upload avatar to Supabase Storage ──────────────────────────────────
       Bucket name: "avatars"  (create it in Supabase dashboard → Storage,
       set public access ON so avatar_url works as a direct image src)
    ─────────────────────────────────────────────────────────────────────── */
    const uploadAvatar = useCallback(async (file) => {
        const ext = file.name.split(".").pop()
        const path = `${publicKey.toBase58()}/avatar.${ext}`

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, file, { upsert: true, contentType: file.type })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("avatars").getPublicUrl(path)
        return data.publicUrl
    }, [publicKey])

    /* ── Save ── */
    const handleSave = async () => {
        const dnErr = validateDisplayName(displayName)
        setDisplayNameError(dnErr)
        if (dnErr) return

        setSaveStatus("saving")
        setSaveError(null)

        try {
            let finalAvatarUrl = avatarUrl

            if (pendingFile) {
                setUploadingAvatar(true)
                finalAvatarUrl = await uploadAvatar(pendingFile)
                setUploadingAvatar(false)
                setPendingFile(null)
            }

            const { error } = await supabase
                .from("profiles")
                .update({
                    display_name: displayName.trim(),
                    bio: bio.trim() || null,
                    avatar_url: finalAvatarUrl || null,
                })
                .eq("wallet_address", publicKey.toBase58())

            if (error) throw error

            /* Supabase Storage reuses the same URL for the same path on every
               upsert, so the string never changes and AvatarUploader's useEffect
               never fires. Appending ?t=timestamp makes the value unique each
               save → triggers the effect → browser re-fetches the new image. */
            const bustUrl = finalAvatarUrl
                ? `${finalAvatarUrl}?t=${Date.now()}`
                : finalAvatarUrl

            setAvatarUrl(bustUrl)
            originalRef.current = {
                displayName: displayName.trim(),
                bio: bio.trim(),
                avatarUrl: bustUrl,
            }

            setSaveStatus("saved")
            setTimeout(() => setSaveStatus("idle"), 2500)

        } catch (err) {
            setUploadingAvatar(false)
            setSaveError(err?.message ?? "Failed to save. Please try again.")
            setSaveStatus("error")
        }
    }

    const handleDiscard = () => {
        setDisplayName(originalRef.current.displayName)
        setBio(originalRef.current.bio)
        setAvatarUrl(originalRef.current.avatarUrl)
        setPendingFile(null)
        setDisplayNameError(null)
        setSaveStatus("idle")
        setSaveError(null)
    }

    /* ── Not connected guard ── */
    if (!connected) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
                <div
                    className="w-14 h-14 rounded-fp flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                    <IconUser size={22} className="text-t3" aria-hidden="true" />
                </div>
                <p className="font-mono text-xs text-t3 max-w-[200px] leading-relaxed">
                    Connect your Phantom wallet to view your profile.
                </p>
            </div>
        )
    }

    /* ── Loading skeleton ── */
    if (loadStatus === "loading") {
        return (
            <div className="max-w-lg mx-auto flex flex-col gap-6">
                <Skeleton className="h-7 w-40" />
                <div className="fp-card p-5 flex items-center gap-5">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <Skeleton className="h-8 w-28" />
                </div>
                <div className="fp-card p-5 flex flex-col gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-4 w-24 mt-2" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-4 w-24 mt-2" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        )
    }

    /* ── Load error ── */
    if (loadStatus === "error") {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                <IconAlertTriangle size={22} className="text-amber-400" aria-hidden="true" />
                <p className="font-mono text-xs text-t2">Could not load your profile.</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="fp-btn-ghost"
                >
                    Retry
                </button>
            </div>
        )
    }

    const isSaving = saveStatus === "saving"

    return (
        <div className="max-w-lg mx-auto flex flex-col gap-5 pb-10">

            {/* ── Page header ── */}
            <div>
                <p className="fp-slash text-t3 text-xs tracking-widest mb-1">
                    ACCOUNT
                </p>
                <h1 className="font-head font-extrabold text-xl text-t1 leading-tight">
                    Profile
                </h1>
            </div>

            {/* ── Username card (read-only) ────────────────────────────────
                Username is permanent — displayed as identity anchor only.
            ──────────────────────────────────────────────────────────────── */}
            <section
                className="fp-card green-top px-5 py-4 flex items-center justify-between gap-4"
                aria-label="Username"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-8 h-8 rounded-fp flex items-center justify-center shrink-0"
                        style={{
                            background: "rgba(0,255,135,0.07)",
                            border: "1px solid rgba(0,255,135,0.20)",
                        }}
                        aria-hidden="true"
                    >
                        <IconAt size={14} className="text-green" />
                    </div>

                    <div className="min-w-0">
                        <p className="font-mono text-[10px] text-t3 uppercase tracking-widest mb-0.5">
                            Username · permanent
                        </p>
                        <h2 className="font-head font-extrabold text-lg text-t1 truncate leading-tight">
                            @{username}
                        </h2>
                    </div>
                </div>

                <span className="fp-badge-green shrink-0 text-[10px]">
                    Locked
                </span>
            </section>

            {/* ── Avatar card ── */}
            <section className="fp-card px-5 py-4" aria-label="Profile photo">
                <p className="fp-slash text-t3 text-xs tracking-widest mb-4">
                    PROFILE PHOTO
                </p>

                <AvatarUploader
                    currentUrl={avatarUrl}
                    displayName={displayName}
                    onFileSelected={setPendingFile}
                    uploading={uploadingAvatar}
                />
            </section>

            {/* ── Editable fields card ── */}
            <section className="fp-card px-5 py-4" aria-label="Profile details">
                <p className="fp-slash text-t3 text-xs tracking-widest mb-4">
                    PROFILE DETAILS
                </p>

                <div className="flex flex-col gap-5">
                    {/* Display name */}
                    <div>
                        <FieldLabel htmlFor="prof-display">
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
                                id="prof-display"
                                type="text"
                                autoComplete="name"
                                maxLength={40}
                                value={displayName}
                                onChange={(e) => {
                                    setDisplayName(e.target.value)
                                    if (displayNameError) setDisplayNameError(null)
                                    if (saveStatus === "saved") setSaveStatus("idle")
                                }}
                                onBlur={() => setDisplayNameError(validateDisplayName(displayName))}
                                placeholder="How others see you"
                                aria-invalid={!!displayNameError}
                                className="fp-input pl-7"
                                style={displayNameError ? { borderColor: "rgba(255,64,96,0.50)" } : {}}
                            />
                        </div>

                        <FieldError message={displayNameError} />
                    </div>

                    {/* Bio */}
                    <div>
                        <FieldLabel htmlFor="prof-bio" optional>
                            Bio
                        </FieldLabel>

                        <div className="relative">
                            <span
                                className="absolute left-3 top-2.5 text-t3 pointer-events-none"
                                aria-hidden="true"
                            >
                                <IconAlignLeft size={13} />
                            </span>

                            <textarea
                                id="prof-bio"
                                rows={3}
                                maxLength={160}
                                value={bio}
                                onChange={(e) => {
                                    setBio(e.target.value)
                                    if (saveStatus === "saved") setSaveStatus("idle")
                                }}
                                placeholder="Short description (160 chars max)"
                                className="fp-input pl-7 resize-none leading-relaxed"
                                style={{ paddingTop: "8px" }}
                            />
                        </div>

                        <p className="font-mono text-[10.5px] text-t3 mt-1 text-right">
                            {bio.length}/160
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Save error banner ── */}
            {saveStatus === "error" && saveError && (
                <div
                    className="flex items-start gap-2.5 rounded-fp px-4 py-3"
                    role="alert"
                    style={{
                        background: "rgba(255,64,96,0.07)",
                        border: "1px solid rgba(255,64,96,0.20)",
                    }}
                >
                    <IconAlertTriangle size={13} className="text-danger mt-0.5 shrink-0" aria-hidden="true" />
                    <p className="font-mono text-[11px] text-danger leading-snug">{saveError}</p>
                </div>
            )}

            {/* ── Action bar ── */}
            <div className="flex items-center gap-2.5 pt-1">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className="fp-btn-green flex-1 justify-center min-h-10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <IconLoader2 size={13} className="animate-spin" aria-hidden="true" />
                            Saving…
                        </>
                    ) : saveStatus === "saved" ? (
                        <>
                            <IconCheck size={13} aria-hidden="true" />
                            Saved
                        </>
                    ) : (
                        <>
                            <IconDeviceFloppy size={13} aria-hidden="true" />
                            Save changes
                        </>
                    )}
                </button>

                {isDirty && !isSaving && (
                    <button
                        type="button"
                        onClick={handleDiscard}
                        className="fp-btn-ghost"
                        aria-label="Discard changes"
                    >
                        <IconX size={12} aria-hidden="true" />
                        Discard
                    </button>
                )}
            </div>

            {/* ── Dirty indicator dot ── */}
            {isDirty && (
                <p className="font-mono text-[10px] text-t3 text-center -mt-2">
                    You have unsaved changes
                </p>
            )}
        </div>
    )
}