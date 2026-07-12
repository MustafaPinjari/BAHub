import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";

interface ResetState {
    loading: boolean;
    error: string;
    success: string;
}

export const PasswordResetPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const uid = queryParams.get("uid");
    const token = queryParams.get("token");

    // If uid+token present → confirm mode. Otherwise → request mode.
    const isConfirmMode = !!(uid && token);

    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [state, setState] = useState<ResetState>({ loading: false, error: "", success: "" });

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setState({ loading: true, error: "", success: "" });
        try {
            await api.post("/auth/password-reset/request/", { email });
            setState({
                loading: false,
                error: "",
                success: "If an account with that email exists, a reset link has been sent. Check your inbox.",
            });
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Failed to send reset email.";
            setState({ loading: false, error: msg, success: "" });
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setState({ loading: false, error: "Passwords do not match.", success: "" });
            return;
        }
        if (newPassword.length < 8) {
            setState({ loading: false, error: "Password must be at least 8 characters.", success: "" });
            return;
        }
        setState({ loading: true, error: "", success: "" });
        try {
            await api.post("/auth/password-reset/confirm/", {
                uid,
                token,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });
            setState({
                loading: false,
                error: "",
                success: "Password reset successfully! Redirecting to login...",
            });
            setTimeout(() => navigate("/login"), 2500);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Reset failed. The link may have expired.";
            setState({ loading: false, error: msg, success: "" });
        }
    };

    return (
        <div className="w-full max-w-sm flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-600/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">BAHub</span>
                </div>
                <h1 className="text-xl font-black text-white">
                    {isConfirmMode ? "Set New Password" : "Reset Password"}
                </h1>
                <p className="text-xs text-gray-500 leading-relaxed">
                    {isConfirmMode
                        ? "Enter your new password below. It must be at least 8 characters."
                        : "Enter your account email address and we'll send you a secure reset link."}
                </p>
            </div>

            {/* Success */}
            {state.success && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-xs text-green-400 font-semibold leading-relaxed">
                    {state.success}
                </div>
            )}

            {/* Error */}
            {state.error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400 font-semibold leading-relaxed">
                    {state.error}
                </div>
            )}

            {/* Form */}
            {!state.success && (
                <form onSubmit={isConfirmMode ? handleConfirm : handleRequest} className="flex flex-col gap-4">
                    {!isConfirmMode && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                                placeholder="you@company.com"
                                aria-label="Email address for password reset"
                                className="w-full bg-black/60 border border-white/[0.08] hover:border-white/[0.16] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-colors"
                            />
                        </div>
                    )}

                    {isConfirmMode && (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    autoFocus
                                    placeholder="At least 8 characters"
                                    aria-label="New password"
                                    className="w-full bg-black/60 border border-white/[0.08] hover:border-white/[0.16] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Repeat new password"
                                    aria-label="Confirm new password"
                                    className="w-full bg-black/60 border border-white/[0.08] hover:border-white/[0.16] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-colors"
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={state.loading}
                        aria-label={isConfirmMode ? "Set new password" : "Send reset link"}
                        className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                        {state.loading ? (
                            <>
                                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" className="opacity-75" />
                                </svg>
                                Processing...
                            </>
                        ) : isConfirmMode ? "Set New Password" : "Send Reset Link"}
                    </button>
                </form>
            )}

            {/* Footer link */}
            <p className="text-center text-[11px] text-gray-600">
                Remember your password?{" "}
                <button
                    onClick={() => navigate("/login")}
                    className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer bg-transparent border-none outline-none"
                >
                    Sign in
                </button>
            </p>
        </div>
    );
};
