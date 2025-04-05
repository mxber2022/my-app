"use client";
import {
  MiniKit,
  tokenToDecimals,
  Tokens,
  PayCommandInput,
} from "@worldcoin/minikit-js";
import { 
  Heart
} from "lucide-react";
import { useState } from "react";

const sendPayment = async (toAddress: any, amount: any) => {
  try {
    const res = await fetch(`/api/initiate-payment`, {
      method: "POST",
    });

    const { id } = await res.json();

    console.log(id);

    const payload: PayCommandInput = {
      reference: id,
      to: toAddress, // Test address
      tokens: [
        {
          symbol: Tokens.WLD,
          token_amount: tokenToDecimals(amount, Tokens.WLD).toString(),
        },
        {
          symbol: Tokens.USDCE,
          token_amount: tokenToDecimals(amount, Tokens.USDCE).toString(),
        },
      ],
      description: "You are donating for good cause",
    };
    if (MiniKit.isInstalled()) {
      return await MiniKit.commandsAsync.pay(payload);
    }
    return null;
  } catch (error: unknown) {
    console.log("Error sending payment", error);
    return null;
  }
};

const handlePay = async (toAddress: any, amount: any) => {
  if (!MiniKit.isInstalled()) {
    console.error("MiniKit is not installed");
    return;
  }
  console.log("donating to ", toAddress);
  const sendPaymentResponse = await sendPayment(toAddress, amount);
  const response = sendPaymentResponse?.finalPayload;
  if (!response) {
    return;
  }

  if (response.status == "success") {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: response }),
    });
    const payment = await res.json();
    if (payment.success) {
      // Congrats your payment was successful!
      console.log("SUCCESS!");
    } else {
      // Payment failed
      console.log("FAILED!");
    }
  }
};

export const PayBlock = ({ toAddress }: any) => {

  const [amount, setAmount] = useState(0.1); // Default amount

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFloat(e.target.value));
  };

  return (
    // <button className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground w-full px-3 py-2 md:px-4 md:py-2 rounded-md transition-colors flex items-center justify-center gap-2 text-sm md:text-base" 
    //   onClick={() => handlePay(toAddress)}>
    //   <Heart className="w-4 h-4" />
    //   Donate
    // </button>

    <div className="flex flex-col items-center gap-2">
    <input
      type="number"
      value={amount}
      onChange={handleAmountChange}
      className="w-full px-3 py-2 border rounded-md"
      min="0.01"
      step="0.01"
      placeholder="Enter amount"
    />
    <button
      className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground w-full px-3 py-2 md:px-4 md:py-2 rounded-md transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
      onClick={() => handlePay(toAddress, amount)}
    >
      <Heart className="w-4 h-4" />
      Donate
    </button>
  </div>
  );
};
