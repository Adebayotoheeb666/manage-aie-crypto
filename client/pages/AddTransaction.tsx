import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnimatedCard } from "@/components/AnimatedCard";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { createTransaction, getPrimaryWallet } from "@shared/lib/supabase";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddTransaction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authUser, dbUser } = useAuth();
  const { assets } = useDashboardData();

  const [formData, setFormData] = useState({
    txType: "receive" as "send" | "receive" | "swap" | "stake" | "unstake",
    symbol: "",
    amount: "",
    amountUsd: "",
    fromAddress: "",
    toAddress: "",
    txHash: "",
    feeAmount: "",
    feeUsd: "",
    status: "confirmed" as "pending" | "confirmed" | "failed" | "cancelled",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [primaryWalletId, setPrimaryWalletId] = useState<string>("");

  useEffect(() => {
    if (!authUser) {
      navigate("/connect-wallet");
      return;
    }

    if (dbUser) {
      getPrimaryWallet(dbUser.id)
        .then((wallet) => {
          if (wallet) {
            setPrimaryWalletId(wallet.id);
          }
        })
        .catch((err) => {
          const message =
            err instanceof Error ? err.message : String(err);
          console.error("Failed to fetch wallet:", message);
          toast({
            title: "Warning",
            description:
              "Could not load your primary wallet. You can still add a transaction.",
            variant: "destructive",
          });
        });
    }
  }, [authUser, dbUser, navigate, toast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.symbol) newErrors.symbol = "Please select an asset";
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (formData.txType === "send" && !formData.toAddress) {
      newErrors.toAddress =
        "Recipient address is required for send transactions";
    }
    if (formData.txType === "receive" && !formData.fromAddress) {
      newErrors.fromAddress =
        "Sender address is required for receive transactions";
    }
    if (formData.txType === "swap" && !formData.toAddress) {
      newErrors.toAddress = "Destination required for swap transactions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !authUser || !dbUser || !primaryWalletId) {
      return;
    }

    setLoading(true);
    try {
      const amountUsd =
        formData.amountUsd && parseFloat(formData.amountUsd)
          ? parseFloat(formData.amountUsd)
          : undefined;

      const feeAmount =
        formData.feeAmount && parseFloat(formData.feeAmount)
          ? parseFloat(formData.feeAmount)
          : undefined;

      const feeUsd =
        formData.feeUsd && parseFloat(formData.feeUsd)
          ? parseFloat(formData.feeUsd)
          : undefined;

      const txData = await createTransaction(
        dbUser.id,
        primaryWalletId,
        formData.txType,
        formData.symbol,
        parseFloat(formData.amount),
        amountUsd,
        formData.txHash || undefined,
        formData.txType === "send"
          ? undefined
          : formData.fromAddress || undefined,
        formData.txType === "receive"
          ? undefined
          : formData.toAddress || undefined,
        feeAmount,
        feeUsd,
        formData.status,
        formData.notes || undefined,
      );

      toast({
        title: "Success",
        description: "Transaction added to your portfolio",
        duration: 3000,
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add transaction";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
      console.error("Failed to add transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAsset = assets.find((a) => a.symbol === formData.symbol);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Add Transaction
          </h1>
          <p className="text-gray-600">
            Record a crypto transaction to your portfolio
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-8 flex gap-3">
          <AlertCircle
            className="text-blue-600 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div>
            <p className="font-semibold text-blue-900 mb-1">
              📝 Manual Transaction Entry
            </p>
            <p className="text-blue-800 text-sm">
              Add historical or manual transactions to track your portfolio.
              Make sure all details are accurate.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <AnimatedCard className="bg-white rounded-xl p-8 border border-blue-100 space-y-6">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Transaction Type
              </label>
              <select
                value={formData.txType}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    txType: e.target.value as any,
                  });
                  setErrors({ ...errors, txType: "" });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="receive">Receive</option>
                <option value="send">Send</option>
                <option value="swap">Swap</option>
                <option value="stake">Stake</option>
                <option value="unstake">Unstake</option>
              </select>
            </div>

            {/* Asset Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Asset / Cryptocurrency
              </label>
              <select
                value={formData.symbol}
                onChange={(e) => {
                  setFormData({ ...formData, symbol: e.target.value });
                  setErrors({ ...errors, symbol: "" });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.symbol}>
                    {asset.name} ({asset.symbol}) - Balance:{" "}
                    {asset.balance.toFixed(8)}
                  </option>
                ))}
              </select>
              {errors.symbol && (
                <p className="text-red-600 text-sm mt-2">{errors.symbol}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Amount
              </label>
              <input
                type="number"
                step="0.00000001"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  setErrors({ ...errors, amount: "" });
                }}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.amount && (
                <p className="text-red-600 text-sm mt-2">{errors.amount}</p>
              )}
            </div>

            {/* Amount in USD */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Amount in USD (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amountUsd}
                onChange={(e) =>
                  setFormData({ ...formData, amountUsd: e.target.value })
                }
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-2">
                Enter the value in USD at the time of transaction
              </p>
            </div>

            {/* From Address */}
            {(formData.txType === "receive" || formData.txType === "swap") && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {formData.txType === "receive" ? "Sender" : "Source"} Address
                  {formData.txType === "receive" && (
                    <span className="text-red-600">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.fromAddress}
                  onChange={(e) => {
                    setFormData({ ...formData, fromAddress: e.target.value });
                    setErrors({ ...errors, fromAddress: "" });
                  }}
                  placeholder="Wallet address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.fromAddress && (
                  <p className="text-red-600 text-sm mt-2">
                    {errors.fromAddress}
                  </p>
                )}
              </div>
            )}

            {/* To Address */}
            {(formData.txType === "send" || formData.txType === "swap") && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {formData.txType === "send" ? "Recipient" : "Destination"}{" "}
                  Address
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.toAddress}
                  onChange={(e) => {
                    setFormData({ ...formData, toAddress: e.target.value });
                    setErrors({ ...errors, toAddress: "" });
                  }}
                  placeholder="Wallet address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.toAddress && (
                  <p className="text-red-600 text-sm mt-2">
                    {errors.toAddress}
                  </p>
                )}
              </div>
            )}

            {/* Transaction Hash */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Transaction Hash (Optional)
              </label>
              <input
                type="text"
                value={formData.txHash}
                onChange={(e) =>
                  setFormData({ ...formData, txHash: e.target.value })
                }
                placeholder="0x..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-2">
                Can be found on blockchain explorers like Etherscan
              </p>
            </div>

            {/* Fee Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Fee Amount (Optional)
              </label>
              <input
                type="number"
                step="0.00000001"
                value={formData.feeAmount}
                onChange={(e) =>
                  setFormData({ ...formData, feeAmount: e.target.value })
                }
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Fee in USD */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Fee in USD (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.feeUsd}
                onChange={(e) =>
                  setFormData({ ...formData, feeUsd: e.target.value })
                }
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Transaction Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any notes about this transaction..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Adding Transaction..." : "Add Transaction"}
              </button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
                className="px-8 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </AnimatedCard>
        </form>
      </div>
    </div>
  );
}
