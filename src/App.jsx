import { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useNavigate,
    useLocation,
    useParams,
} from 'react-router-dom'

import Topbar from "./components/Topbar"
import Sidebar from "./components/Sidebar"
import PhantomModal from "./components/PhantomModal"
import SuccessOverlay from "./components/SuccessOverlay"
import ProfileRegistration from "./components/ProfileRegistration"

import TipPage from "./pages/TipPage"
import QRPage from "./pages/QRPage"
import ProfilePage from "./pages/ProfilePage"
import Analytics from "./pages/Analytics"
import NotFound from "./pages/NotFound"

import { supabase } from "./utils/supabase"

/* ─── Profile status machine ───────────────────────────────────────────────
   idle       → wallet not connected yet, no check needed
   checking   → wallet just connected, querying Supabase
   exists     → profile found, user is fully onboarded
   new        → no profile found, show ProfileRegistration modal
──────────────────────────────────────────────────────────────────────────── */

/**
 * ProfileWrapper
 *
 * Thin route wrapper for /:user and /@:user paths.
 * Parses the handle and optional ?amount query param, then
 * delegates all data-fetching and NotFound logic to TipPage.
 * This avoids a duplicate Supabase round-trip that the old
 * implementation performed here before passing to TipPage.
 */
const ProfileWrapper = ({ onSuccess, onQR, walletInfo, connected, onConnect }) => {
    const { user } = useParams()
    const location = useLocation()

    // Normalize: ensure handle always starts with @
    const handle = user?.startsWith('@')
        ? user.toLowerCase()
        : `@${user?.toLowerCase()}`

    // Parse optional ?amount=X from the URL
    const rawAmount = new URLSearchParams(location.search).get('amount')
    const parsedAmount = parseFloat(rawAmount)
    const validAmount = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : null

    return (
        <TipPage
            onSuccess={onSuccess}
            onQR={onQR}
            initialHandle={handle}
            initialAmount={validAmount}
            isAmountLocked={validAmount !== null}
            walletInfo={walletInfo}
            connected={connected}
            onConnect={onConnect}
        />
    )
}

function AppContent() {
    const { publicKey, connected, disconnect } = useWallet()
    const { connection } = useConnection()
    const navigate = useNavigate()
    const location = useLocation()

    // UI state
    const [modal, setModal] = useState(false)
    const [success, setSuccess] = useState(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [walletInfo, setWalletInfo] = useState({ addr: '', sol: '0.00', usd: '≈ $0.00' })
    const [balanceTick, setBalanceTick] = useState(0)

    // Profile state
    const [profileStatus, setProfileStatus] = useState('idle')
    const [userProfile, setUserProfile] = useState(null)

    // Track previous connected value to detect the transition false → true
    const prevConnectedRef = useRef(false)

    // Fetch balance whenever wallet connects or a tip is sent
    useEffect(() => {
        if (connected && publicKey) {
            connection.getBalance(publicKey).then(balance => {
                const sol = balance / LAMPORTS_PER_SOL
                const fullAddress = publicKey.toBase58()
                const shortAddress = `${fullAddress.slice(0, 4)}...${fullAddress.slice(-4)}`
                setWalletInfo({
                    addr: shortAddress,
                    sol: sol.toFixed(2),
                    usd: `≈ $${(sol * 146.4).toLocaleString()} USD`,
                })
            })
        }
    }, [connected, publicKey, connection, balanceTick])

    // React to wallet connect / disconnect transitions
    useEffect(() => {
        const wasConnected = prevConnectedRef.current
        prevConnectedRef.current = connected

        if (wasConnected && !connected) {
            setProfileStatus('idle')
            setUserProfile(null)
            return
        }

        if (!wasConnected && connected && publicKey) {
            checkProfile(publicKey.toBase58())
        }
    }, [connected, publicKey])

    const checkProfile = useCallback(async (address) => {
        setProfileStatus('checking')
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username, display_name')
                .eq('wallet_address', address)
                .maybeSingle()

            if (error) {
                console.error('[FastPay] Profile check failed:', error.message)
                setProfileStatus('exists') // fail open
                return
            }

            if (data) {
                setUserProfile({ username: data.username, displayName: data.display_name })
                setProfileStatus('exists')
            } else {
                setProfileStatus('new')
            }
        } catch (err) {
            console.error('[FastPay] Unexpected error during profile check:', err)
            setProfileStatus('exists') // fail open
        }
    }, [])

    const handleRegistrationComplete = useCallback(({ username, displayName }) => {
        setUserProfile({ username, displayName })
        setProfileStatus('exists')
    }, [])

    const handleConnectClick = useCallback(() => {
        if (connected) disconnect()
        else setModal(true)
    }, [connected, disconnect])

    const handlePhantomDone = useCallback(() => setModal(false), [])

    // After a successful tip, bump the tick to re-fetch the sender's balance
    const handleSuccess = useCallback(({ message, hash }) => {
        setSuccess({ m: message, h: hash })
        setBalanceTick(t => t + 1)
    }, [])

    const activePage =
        location.pathname === '/qr' ? 'qr' :
            location.pathname === '/profile' ? 'profile' :
                location.pathname === '/analytics' ? 'analytics' : 'tip'

    const isCheckingProfile = profileStatus === 'checking'

    return (
        <div className="h-screen bg-bg0 text-t1 font-mono flex flex-col overflow-hidden">
            <Topbar
                connected={connected}
                onConnect={handleConnectClick}
                onMenuToggle={() => setIsMenuOpen(true)}
            />

            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar
                    active={activePage}
                    onNav={(id) => {
                        if (id === 'qr') navigate('/qr')
                        else if (id === 'profile') navigate('/profile')
                        else if (id === 'analytics') navigate('/analytics')
                        else navigate('/')
                        setIsMenuOpen(false)
                    }}
                    connected={connected}
                    onConnect={handleConnectClick}
                    wallet={walletInfo}
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    userProfile={userProfile}
                />

                <main className="flex-1 bg-bg0 p-4 lg:p-6 overflow-y-auto">
                    <Routes>
                        {/* Homepage: search & send */}
                        <Route
                            path="/"
                            element={
                                <TipPage
                                    onSuccess={handleSuccess}
                                    onQR={() => navigate('/qr')}
                                    initialHandle={null}
                                    initialAmount={null}
                                    walletInfo={walletInfo}
                                    connected={connected}
                                    onConnect={handleConnectClick}
                                />
                            }
                        />

                        {/* QR page */}
                        <Route path="/qr" element={<QRPage userProfile={userProfile} />} />

                        {/* Public profile page: /@username or /username */}
                        <Route
                            path="/:user"
                            element={
                                <ProfileWrapper
                                    onSuccess={handleSuccess}
                                    onQR={() => navigate('/qr')}
                                    walletInfo={walletInfo}
                                    connected={connected}
                                    onConnect={handleConnectClick}
                                />
                            }
                        />

                        {/* Authenticated pages */}
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route
                            path="/analytics"
                            element={
                                <Analytics
                                    username={userProfile?.username}
                                    connected={connected}
                                />
                            }
                        />

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
            </div>

            {/* Wallet modal */}
            <PhantomModal
                open={modal}
                onDone={handlePhantomDone}
                onCancel={() => setModal(false)}
            />

            {/* Verifying wallet overlay */}
            {isCheckingProfile && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center"
                    style={{ background: 'rgba(12,15,14,0.75)', backdropFilter: 'blur(4px)' }}
                    aria-live="polite"
                    aria-label="Verifying wallet profile"
                >
                    <div
                        className="fp-card px-6 py-5 flex flex-col items-center gap-3 green-top"
                        style={{ minWidth: '200px' }}
                    >
                        <span
                            className="w-2 h-2 rounded-full bg-green inline-block animate-pulse"
                            aria-hidden="true"
                        />
                        <p className="font-mono text-xs text-t2 text-center">
                            Verifying wallet…
                        </p>
                    </div>
                </div>
            )}

            {/* New wallet → registration modal */}
            {profileStatus === 'new' && connected && publicKey && (
                <ProfileRegistration
                    walletAddress={publicKey.toBase58()}
                    onComplete={handleRegistrationComplete}
                    onCancel={() => {
                        disconnect()
                        setProfileStatus('idle')
                    }}
                />
            )}

            {/* Tip success overlay */}
            {success && (
                <SuccessOverlay
                    show
                    message={success.m}
                    hash={success.h}
                    onClose={() => setSuccess(null)}
                />
            )}
        </div>
    )
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    )
}