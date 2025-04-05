"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TuteTimer } from "@/components/TuteTimer";
import { VerifyButton } from "@/components/VerifyButton";
import { ClaimButton } from "@/components/ClaimButton";
import { WalletAuthButton } from "@/components/wallet-auth-button";
import { useWaitForTransactionReceipt } from "@worldcoin/minikit-react";
import { createPublicClient, http } from "viem";
import { worldchain } from "@/lib/chains";
import { TransactionStatus } from "@/components/TransactionStatus";
import Map from "@/components/Map/Map";
import { MapProvider } from "@/components/Map/MapContext";
import { AlertTriangle } from "lucide-react";
// // This would come from environment variables in a real app
// const APP_ID =
//   process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID ||
//   "app_9a73963d73efdf2e7d9472593dc9dffd";

export default function Page() {
  const { data: session, status } = useSession();
  const [walletConnected, setWalletConnected] = useState(false);
  const [verified, setVerified] = useState(false);
  const [tuteClaimed, setTuteClaimed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [claimCount, setClaimCount] = useState(0);
  const [transactionId, setTransactionId] = useState<string>("");
  const [isMinting, setIsMinting] = useState(false);

  // Initialize Viem client
  const client = createPublicClient({
    chain: worldchain,
    transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
  });

  // Track transaction status
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      client,
      appConfig: {
        app_id: process.env.NEXT_PUBLIC_WLD_APP_ID || "",
      },
      transactionId,
    });

  // Check if user is authenticated when session changes
  useEffect(() => {
    if (status === "authenticated" && session?.user?.address) {
      setWalletConnected(true);
      console.log("User authenticated:", session.user);
    }
  }, [session, status]);

  // Update UI when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && !tuteClaimed) {
      setTuteClaimed(true);
      setClaimCount((prevCount) => prevCount + 1);
      setIsMinting(false);
    }
  }, [isConfirmed, tuteClaimed]);

  // Handle wallet connection success
  const handleWalletConnected = () => {
    setWalletConnected(true);
    console.log("Wallet connected");
  };

  // Handle verification success
  const handleVerificationSuccess = () => {
    console.log("Verification success callback triggered in TuteApp");
    setVerified(true);
  };

  // Handle claim success
  const handleClaimSuccess = (txId: string) => {
    console.log("Claim initiated with transaction ID:", txId);
    setTransactionId(txId);
    setIsMinting(true);
  };

  // Timer effect for claim cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (tuteClaimed && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      // When timer reaches zero, enable claiming again
      setTuteClaimed(false);
      setVerified(false); // Reset verification for next claim cycle
      setTimeRemaining(300); // Reset timer for next claim
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tuteClaimed, timeRemaining]);

  return (
    <div className="flex flex-col h-[100vh] bg-white safe-area-inset">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-0 py-8 gap-8">
        {!walletConnected ? (
          <WalletAuthButton onSuccess={handleWalletConnected} />
        ) : (
          <>
            <div className="min-h-screen bg-background">
              <div className="container mx-auto p-4 md:px-4 md:py-8">
                <div className="max-w-3xl mx-auto mb-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Emergency Services
                  </div>
                  {/* <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-destructive via-destructive/80 to-destructive/60 text-transparent bg-clip-text">
            Emergency Map
          </h1> */}
                  <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                    Quickly mark and share emergency locations. Use your current
                    location to mark emergency spots for immediate assistance.
                  </p>

                  {/* <button onClick={() => signOut()} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
            Sign Out
          </button> */}
                </div>

                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-destructive/30 via-destructive/20 to-destructive/30 rounded-2xl blur-2xl opacity-50"></div>
                  <div className="relative">
                    <MapProvider>
                      <Map />
                    </MapProvider>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
