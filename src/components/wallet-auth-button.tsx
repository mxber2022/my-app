"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { MiniKit } from "@worldcoin/minikit-js";
import {
  LogIn,
  LogOut,
  User,
  Loader2,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface WalletAuthButtonProps {
  onSuccess?: () => void;
}

export function WalletAuthButton({ onSuccess }: WalletAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleWalletAuth = async () => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/nonce");
      const { nonce } = await res.json();
      console.log("nonce", nonce);
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        expirationTime: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
        statement: "Sign in with your World ID wallet",
      });

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code);
      }

      const verifyRes = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      });
      console.log("verifyRes", verifyRes);
      const verification = await verifyRes.json();
      console.log("verification", verification);

      if (verification.isValid) {
        await signIn("worldcoin-wallet", {
          message: finalPayload.message,
          signature: finalPayload.signature,
          address: finalPayload.address,
          nonce,
          redirect: false,
        });

        // Call onSuccess if provided
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Wallet auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // <button
    //   onClick={handleWalletAuth}
    //   disabled={isLoading}
    //   className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg border-2 border-yellow-900/50 font-bold shadow-md transition-colors disabled:opacity-50 tracking-wide"
    // >
    //   {isLoading ? (
    //     <div className="flex items-center">
    //       <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    //       <span className="font-serif">Connecting...</span>
    //     </div>
    //   ) : (
    //     <div className="flex items-center">
    //       <span className="mr-2">🎰</span>
    //       <span className="font-serif">Connect Wallet</span>
    //     </div>
    //   )}
    // </button>

    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-red-100 text-red-600 text-base font-semibold">
            <AlertTriangle className="w-5 h-5" />
            Emergency Response Platform
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-red-600 to-red-400/60 text-transparent bg-clip-text">
                Welcome
              </span>
            </h1>

            <p className="text-lg text-gray-500 max-w-sm mx-auto leading-relaxed">
              Your presence matters. Sign in to help coordinate emergency
              responses and save lives.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-300 via-red-200 to-red-300 rounded-2xl blur-2xl opacity-50"></div>
          <div className="relative bg-white rounded-2xl shadow-xl border p-8 space-y-8">
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-br from-red-100 to-red-50 rounded-xl border border-red-200">
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-red-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Secure & Private Access
                    </h3>
                    <p className="text-base text-gray-500 leading-relaxed">
                      Your information is protected with enterprise-grade
                      encryption. We prioritize the security of emergency
                      responders.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleWalletAuth}
                className="w-full bg-red-600 text-white hover:bg-red-700 px-6 py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 font-semibold text-base shadow-lg hover:shadow-xl group"
              >
                <LogIn className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" />
                Sign In
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
