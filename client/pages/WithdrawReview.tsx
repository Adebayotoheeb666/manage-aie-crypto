import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getLatestPrice, createWithdrawalRequest } from "@shared/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ArrowLeft,
  ExternalLink,
  Loader,
} from "lucide-react";

export default function WithdrawReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser, dbUser } = useAuth();

  const state = location.state || {};
  const { crypto, amount, address, network, email, saveEmail, walletId } =
    state;

  const [step, setStep] = useState<
    "review" | "confirming" | "processing" | "success" | "failure"
  >("review");
  const [confirmCheckboxes, setConfirmCheckboxes] = useState({
    verify: false,
    irreversible: false,
  });
  const [price, setPrice] = useState(0);
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real price data
  useEffect(() => {
    async function fetchPrice() {
      try {
        const priceData = await getLatestPrice(crypto);
        if (priceData) {
          setPrice(priceData.price_usd);
        }
      } catch (err) {
        console.error("Failed to fetch price:", err);
        setError("Failed to load price data");
      } finally {
        setLoading(false);
      }
    }

    if (crypto) {
      fetchPrice();
    }
  }, [crypto]);

  const networkFee = 0.0005; // This should be fetched from API in production
  const receiveAmount = (amount || 0) - networkFee;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address || "");
    alert("Address copied!");
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(txHash);
    alert("Transaction hash copied!");
  };

  const handleConfirm = async () => {
    if (!confirmCheckboxes.verify || !confirmCheckboxes.irreversible) {
      return;
    }

    if (!authUser || !dbUser || !walletId) {
      setError("Authentication required");
      return;
    }

    setStep("processing");
    try {
      const result = await createWithdrawalRequest(
        dbUser.id,
        walletId,
        crypto,
        amount,
        amount * price,
        address,
        network,
        networkFee,
        networkFee * price,
      );

      // Simulate processing delay then show success
      setTimeout(() => {
        setTxHash(result.id); // Use request ID as reference
        setStep("success");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Withdrawal failed";
      setError(message);
      setStep("failure");
    }
  };

  if (step === "processing") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processing Your Withdrawal
          </h2>
          <p className="text-gray-600 mb-4">Please do not close this window</p>
          <p className="text-sm text-gray-500">
            Withdrawing {amount} {crypto} to {address?.substring(0, 10)}...
          </p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-blue-100">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Withdrawal Confirmation
            </h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Withdrawal Submitted Successfully
            </h2>
            <p className="text-xl text-gray-600">
              Your crypto is on its way to the recipient wallet
            </p>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Transaction Details
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Cryptocurrency</span>
                <span className="font-semibold text-gray-900">
                  {crypto} (Bitcoin)
                </span>
              </div>
              <div className="border-t border-gray-300 pt-4 flex justify-between items-start">
                <span className="text-gray-600">Amount</span>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {amount} {crypto}
                  </p>
                  <p className="text-sm text-gray-600">
                    ≈ ${(amount * price).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-300 pt-4 flex justify-between items-start">
                <span className="text-gray-600">Network Fee</span>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {networkFee} {crypto}
                  </p>
                  <p className="text-sm text-gray-600">
                    ≈ ${(networkFee * price).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-300 pt-4 flex justify-between items-start">
                <span className="text-gray-600 font-semibold">
                  You'll Receive
                </span>
                <div className="text-right">
                  <p className="font-bold text-blue-600 text-lg">
                    {receiveAmount} {crypto}
                  </p>
                  <p className="text-sm text-gray-600">
                    ≈ ${(receiveAmount * price).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-300 pt-4 flex justify-between items-start">
                <span className="text-gray-600">Recipient Address</span>
                <div className="text-right">
                  <p className="font-mono text-sm text-gray-900 flex items-center gap-2">
                    {address?.substring(0, 20)}...
                    <button
                      onClick={handleCopyAddress}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy size={16} />
                    </button>
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-300 pt-4 flex justify-between items-start">
                <span className="text-gray-600">Network</span>
                <span className="font-semibold text-gray-900">{network}</span>
              </div>
              <div className="border-t border-gray-300 pt-4 flex justify-between items-start">
                <span className="text-gray-600">Email</span>
                <span className="font-semibold text-gray-900">{email}</span>
              </div>
              <div className="border-t border-gray-300 pt-4">
                <span className="text-gray-600 block mb-2">
                  Transaction Hash
                </span>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-gray-900 flex-1 break-all">
                    {txHash}
                  </p>
                  <button
                    onClick={handleCopyHash}
                    className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                  >
                    <Copy size={16} />
                  </button>
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmations */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <CheckCircle2
                  className="text-green-600 flex-shrink-0"
                  size={20}
                />
                <span className="text-gray-700">
                  Confirmation email sent to <strong>{email}</strong>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-700 font-semibold">1-2 hours</span>
                <span className="text-gray-700">
                  Estimated confirmation time on the blockchain
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-700 font-semibold">
                  Always verify
                </span>
                <span className="text-gray-700">
                  Check the transaction hash on a blockchain explorer
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
            >
              Return to Dashboard
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg px-8"
            >
              View on Explorer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "failure") {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-blue-100">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Withdrawal Failed
            </h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Withdrawal Failed
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Unfortunately, your withdrawal could not be processed
            </p>
            <p className="text-gray-700 font-medium mb-8">
              Error: Insufficient balance for network fee
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate("/withdraw")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-8 rounded-lg"
            >
              Return to Dashboard
            </Button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-2">Need assistance?</p>
            <a
              href="#"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Review Step
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/withdraw")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Edit Details
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Review Withdrawal Details
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-8 flex gap-3">
          <AlertCircle
            className="text-yellow-600 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div>
            <p className="font-semibold text-yellow-900 mb-1">
              ⚠️ Please verify all details
            </p>
            <p className="text-yellow-800 text-sm">
              Crypto transactions cannot be reversed. Ensure the recipient
              address is correct.
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-xl p-8 border border-blue-100 shadow-sm mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Withdrawal Summary
          </h2>

          <div className="space-y-6">
            {/* Cryptocurrency */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Cryptocurrency</p>
              <p className="text-xl font-semibold text-gray-900">
                {crypto} (Bitcoin)
              </p>
            </div>

            {/* Amount */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-1">Withdrawal Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {amount} {crypto}
              </p>
              <p className="text-gray-600 mt-1">
                ≈ ${(amount * price).toLocaleString()}
              </p>
            </div>

            {/* Network Fee */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-1">Network Fee</p>
              <p className="text-lg font-semibold text-gray-900">
                {networkFee} {crypto}
              </p>
              <p className="text-gray-600 mt-1">
                ≈ ${(networkFee * price).toLocaleString()}
              </p>
            </div>

            {/* You'll Receive */}
            <div className="border-t border-gray-200 pt-6 bg-blue-50 -mx-8 px-8 py-6 rounded">
              <p className="text-sm text-gray-600 mb-1">You'll Receive</p>
              <p className="text-3xl font-bold text-blue-600">
                {receiveAmount} {crypto}
              </p>
              <p className="text-blue-700 mt-1 font-medium">
                ≈ ${(receiveAmount * price).toLocaleString()}
              </p>
            </div>

            {/* Recipient Address */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-2">Recipient Address</p>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <p className="font-mono text-sm text-gray-900 flex-1 break-all">
                  {address}
                </p>
                <button
                  onClick={handleCopyAddress}
                  className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            {/* Network */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-1">Network</p>
              <p className="text-lg font-semibold text-gray-900">{network}</p>
            </div>

            {/* Email */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-1">Confirmation Email</p>
              <p className="text-lg font-semibold text-gray-900">{email}</p>
            </div>
          </div>
        </div>

        {/* Confirmation Checkboxes */}
        <div className="bg-white rounded-xl p-8 border border-blue-100 shadow-sm mb-8 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-6">Confirmation</h3>

          <div className="flex items-start gap-3 p-4 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="verify"
              checked={confirmCheckboxes.verify}
              onChange={(e) =>
                setConfirmCheckboxes({
                  ...confirmCheckboxes,
                  verify: e.target.checked,
                })
              }
              className="w-5 h-5 rounded border-gray-300 mt-0.5"
            />
            <label htmlFor="verify" className="text-sm text-gray-700">
              I have verified the recipient address is correct and matches my
              intended recipient
            </label>
          </div>

          <div className="flex items-start gap-3 p-4 border border-red-200 rounded-lg">
            <input
              type="checkbox"
              id="irreversible"
              checked={confirmCheckboxes.irreversible}
              onChange={(e) =>
                setConfirmCheckboxes({
                  ...confirmCheckboxes,
                  irreversible: e.target.checked,
                })
              }
              className="w-5 h-5 rounded border-gray-300 mt-0.5"
            />
            <label htmlFor="irreversible" className="text-sm text-gray-700">
              I understand this transaction is irreversible and cannot be undone
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleConfirm}
            disabled={
              !confirmCheckboxes.verify || !confirmCheckboxes.irreversible
            }
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
          >
            Confirm & Send
          </button>
          <Button
            variant="outline"
            onClick={() => navigate("/withdraw")}
            className="px-8 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
