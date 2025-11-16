import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@shared/lib/supabase";

const assets = [
  { id: 1, symbol: "BTC", name: "Bitcoin", balance: 0.542, price: 370544.3 },
  { id: 2, symbol: "ETH", name: "Ethereum", balance: 5.148, price: 2280 },
  { id: 3, symbol: "USDC", name: "USD Coin", balance: 8500, price: 1.0 },
  { id: 4, symbol: "ADA", name: "Cardano", balance: 2500, price: 0.98 },
];

// USD to crypto conversion rates for Select Cryptocurrency dropdown
const usdConversionRates: Record<string, number> = {
  BTC: 0.00001, // 1 USD = 0.000010 BTC
  ETH: 0.00031, // 1 USD = 0.00031 ETH
  USDC: 1.0, // 1 USD = 1.00 USDC
  ADA: 1.97, // 1 USD = 1.97 ADA
};

// Tiered network fees based on amount
const getNetworkFee = (amount: number): number => {
  if (amount <= 100) return amount * 0.02; // 2% fee for 0-100
  if (amount <= 1000) return amount * 0.015; // 1.5% fee for 101-1000
  if (amount <= 10000) return amount * 0.01; // 1% fee for 1001-10000
  if (amount <= 100000) return amount * 0.005; // 0.5% fee for 10001-100000
  return amount * 0.003; // 0.3% fee for 100000+
};

export default function Withdraw() {
  const navigate = useNavigate();
  const { dbUser } = useAuth();

  // Form state
  const [selectedCrypto, setSelectedCrypto] = useState(assets[0].symbol);
  const [amount, setAmount] = useState("");
  // Prefill mock bank details for testing/demo
  const [bankName, setBankName] = useState("Bank of America");
  const [accountName, setAccountName] = useState("Thomas Hayles");
  const [accountNo, setAccountNo] = useState("898148351001");
  const [routingNo, setRoutingNo] = useState("063100277");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("ethereum");
  const [walletId, setWalletId] = useState("");
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch user's primary wallet on mount
  useEffect(() => {
    const fetchWallet = async () => {
      if (!dbUser?.id) return;
      try {
        const response = await fetch("/api/proxy/user-wallets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: dbUser.id, primaryOnly: true }),
        });

        if (!response.ok) {
          console.error("Failed to fetch wallet:", response.status);
          return;
        }

        const result = await response.json();
        if (result.data && result.data.length > 0) {
          const wallet = result.data[0];
          setWalletId(wallet.id);
          setAddress(wallet.wallet_address);
        }
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      }
    };

    fetchWallet();
  }, [dbUser?.id]);

  const TOTAL_BALANCE_USD = 225982.0;

  const selectedAsset = assets.find((a) => a.symbol === selectedCrypto);
  const maxBalance =
    TOTAL_BALANCE_USD * usdConversionRates[selectedCrypto] ?? 0;
  const selectedPrice = selectedAsset?.price ?? 0;

  const totalUsd = TOTAL_BALANCE_USD;
  const totalBtc = totalUsd * usdConversionRates.BTC;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedCrypto) newErrors.crypto = "Please select a cryptocurrency";
    if (!amount || parseFloat(amount) <= 0)
      newErrors.amount = "Amount must be greater than 0";
    if (parseFloat(amount) > maxBalance)
      newErrors.amount = "Insufficient balance";
    if (parseFloat(amount) < 0.001)
      newErrors.amount = "Minimum withdrawal is 0.001";
    if (!bankName.trim()) newErrors.bankName = "Please enter bank name";
    if (!accountName.trim())
      newErrors.accountName = "Please enter account name";
    if (!accountNo.trim()) newErrors.accountNo = "Please enter account number";
    if (!/^\d{8,17}$/.test(accountNo.replace(/\s/g, "")))
      newErrors.accountNo = "Invalid account number format";
    if (!routingNo.trim()) newErrors.routingNo = "Please enter routing number";
    if (!/^\d{9}$/.test(routingNo.replace(/\s/g, "")))
      newErrors.routingNo = "Routing number must be 9 digits";
    if (!email) newErrors.email = "Please enter your email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email";
    if (!confirmCheckbox)
      newErrors.confirm = "You must confirm the bank details are correct";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setErrors({ ...errors, address: "Wallet address not loaded. Please try again." });
      return;
    }
    if (validateForm()) {
      // Pass data to review page
      navigate("/withdraw/review", {
        state: {
          crypto: selectedCrypto,
          amount: parseFloat(amount),
          bankName,
          accountName,
          accountNo,
          routingNo,
          email,
          address,
          network,
          walletId,
          networkFee: getNetworkFee(parseFloat(amount)),
        },
      });
    }
  };

  const amountNum = parseFloat(amount) || 0;
  const networkFeeAmount = getNetworkFee(amountNum);
  const receiveAmount = amountNum - networkFeeAmount;

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
            Transfer your crypto to your bank account
          </h1>
          <p className="text-gray-600">
            Convert your cryptocurrency and transfer funds to your bank account
            securely
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-8 flex gap-3">
          <AlertCircle
            className="text-yellow-600 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div>
            <p className="font-semibold text-yellow-900 mb-1">
              ⚠️ Verify all bank details before submitting
            </p>
            <p className="text-yellow-800 text-sm">
              Transfers to incorrect bank accounts cannot be reversed. Please
              triple-check all information.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl p-8 border border-blue-100 space-y-6">
            {/* Current Balance */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalUsd)}
              </p>
              <p className="text-sm text-gray-600 mt-2">&nbsp;</p>

              <div className="mt-4 border-t border-blue-100 pt-4">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalUsd)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ≈ {totalBtc.toFixed(8)} BTC
                </p>
              </div>
            </div>

            {/* Cryptocurrency Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Cryptocurrency
              </label>
              <select
                value={selectedCrypto}
                onChange={(e) => {
                  setSelectedCrypto(e.target.value);
                  setErrors({});
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {assets.map((asset) => {
                  const convertedBalance =
                    TOTAL_BALANCE_USD * usdConversionRates[asset.symbol];
                  return (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.name} ({asset.symbol}) -{" "}
                      {convertedBalance.toFixed(8)} available
                    </option>
                  );
                })}
              </select>
              {errors.crypto && (
                <p className="text-red-600 text-sm mt-2">{errors.crypto}</p>
              )}
            </div>

            {/* Withdrawal Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Withdrawal Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.00000001"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors({ ...errors, amount: "" });
                  }}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setAmount(maxBalance.toString())}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Max
                </button>
              </div>
              {amount && (
                <p className="text-sm text-gray-600 mt-2">
                  ≈ $
                  {(
                    amountNum / usdConversionRates[selectedCrypto]
                  ).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
              {errors.amount && (
                <p className="text-red-600 text-sm mt-2">{errors.amount}</p>
              )}
            </div>

            {/* Bank Details Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bank Account Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      setErrors({ ...errors, bankName: "" });
                    }}
                    placeholder="e.g., Chase Bank"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.bankName && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.bankName}
                    </p>
                  )}
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value);
                      setErrors({ ...errors, accountName: "" });
                    }}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.accountName && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.accountName}
                    </p>
                  )}
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNo}
                    onChange={(e) => {
                      setAccountNo(e.target.value);
                      setErrors({ ...errors, accountNo: "" });
                    }}
                    placeholder="0000000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.accountNo && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.accountNo}
                    </p>
                  )}
                </div>

                {/* Routing Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    value={routingNo}
                    onChange={(e) => {
                      setRoutingNo(e.target.value);
                      setErrors({ ...errors, routingNo: "" });
                    }}
                    placeholder="000000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.routingNo && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.routingNo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Fee Summary */}
            {amount && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Withdrawal Amount:</span>
                  <span className="font-medium text-gray-900">
                    {amountNum} {selectedCrypto}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Network Fee:</span>
                  <span className="font-medium text-gray-900">
                    {networkFeeAmount.toFixed(8)} {selectedCrypto} (
                    {((networkFeeAmount / amountNum) * 100).toFixed(2)}%)
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">
                    You'll Receive:
                  </span>
                  <span className="font-bold text-blue-600">
                    {receiveAmount.toFixed(8)} {selectedCrypto}
                  </span>
                </div>
                <p className="text-xs text-gray-600 pt-2">
                  ≈ $
                  {(
                    receiveAmount / usdConversionRates[selectedCrypto]
                  ).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: "" });
                }}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-2">
                You'll receive withdrawal confirmation and updates at this
                address
              </p>
              {errors.email && (
                <p className="text-red-600 text-sm mt-2">{errors.email}</p>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="confirm"
                  checked={confirmCheckbox}
                  onChange={(e) => {
                    setConfirmCheckbox(e.target.checked);
                    setErrors({ ...errors, confirm: "" });
                  }}
                  className="w-5 h-5 rounded border-gray-300 mt-0.5"
                />
                <div>
                  <label
                    htmlFor="confirm"
                    className="text-sm font-medium text-gray-900"
                  >
                    I verify all bank details are correct
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Bank transfers are irreversible. Please confirm all
                    information is accurate.
                  </p>
                </div>
              </div>
              {errors.confirm && (
                <p className="text-red-600 text-sm mt-2">{errors.confirm}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Review Transfer
              </button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="px-8 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
