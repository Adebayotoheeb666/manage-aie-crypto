import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, CheckCircle2, QrCode } from "lucide-react";

const assets = [
  { id: 1, symbol: "BTC", name: "Bitcoin", balance: 0.542, price: 42500 },
  { id: 2, symbol: "ETH", name: "Ethereum", balance: 2.148, price: 2280 },
  { id: 3, symbol: "USDC", name: "USD Coin", balance: 5000, price: 1.0 },
  { id: 4, symbol: "ADA", name: "Cardano", balance: 1500, price: 0.98 },
];

const networkFees = {
  BTC: { Bitcoin: 0.0005 },
  ETH: { Ethereum: 0.005, "Ethereum L2": 0.001 },
  USDC: { Ethereum: 0.005, Polygon: 0.0001 },
  ADA: { Cardano: 0.17 },
};

const validateAddress = (address: string, crypto: string): boolean => {
  // Simple validation patterns (in production would be more thorough)
  const patterns: Record<string, RegExp> = {
    BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    USDC: /^0x[a-fA-F0-9]{40}$/, // Same as ETH
    ADA: /^addr1[a-z0-9]{53}$/,
  };
  return patterns[crypto]?.test(address) || false;
};

export default function Withdraw() {
  const navigate = useNavigate();

  // Form state
  const [selectedCrypto, setSelectedCrypto] = useState(assets[0].symbol);
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [email, setEmail] = useState("");
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [saveEmail, setSaveEmail] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedAsset = assets.find((a) => a.symbol === selectedCrypto);
  const maxBalance = selectedAsset?.balance ?? 0;
  const selectedPrice = selectedAsset?.price ?? 0;

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
    if (!recipientAddress) newErrors.address = "Please enter recipient address";
    if (!validateAddress(recipientAddress, selectedCrypto)) {
      newErrors.address = `Invalid ${selectedCrypto} address format`;
    }
    if (!network) newErrors.network = "Please select a network";
    if (!email) newErrors.email = "Please enter your email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email";
    if (!confirmCheckbox)
      newErrors.confirm = "You must confirm the recipient address";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Pass data to review page
      navigate("/withdraw/review", {
        state: {
          crypto: selectedCrypto,
          amount: parseFloat(amount),
          address: recipientAddress,
          network,
          email,
          saveEmail,
        },
      });
    }
  };

  const networkOptions = network
    ? Object.keys(networkFees[selectedCrypto as keyof typeof networkFees] || {})
    : [];
  const networkFeeAmount = network
    ? networkFees[selectedCrypto as keyof typeof networkFees]?.[
        network as keyof any
      ] || 0
    : 0;
  const amountNum = parseFloat(amount) || 0;
  const totalCost = amountNum + networkFeeAmount;
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
            Withdraw Funds
          </h1>
          <p className="text-gray-600">
            Transfer your crypto to another wallet securely
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
              ⚠️ Cryptocurrency transfers are irreversible
            </p>
            <p className="text-yellow-800 text-sm">
              Please double-check all details before confirming. Incorrect
              addresses cannot be corrected.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl p-8 border border-blue-100 space-y-6">
            {/* Current Balance */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {maxBalance.toFixed(8)} {selectedCrypto}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                ≈ ${(maxBalance * selectedPrice).toLocaleString()}
              </p>
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
                  setNetwork("");
                  setErrors({});
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {assets
                  .filter((a) => a.balance > 0)
                  .map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.name} ({asset.symbol}) - {asset.balance} available
                    </option>
                  ))}
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
                  {(amountNum * selectedPrice).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
              {errors.amount && (
                <p className="text-red-600 text-sm mt-2">{errors.amount}</p>
              )}
            </div>

            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Recipient {selectedCrypto} Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => {
                    setRecipientAddress(e.target.value);
                    setErrors({ ...errors, address: "" });
                  }}
                  placeholder={`Enter ${selectedCrypto} wallet address`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
                  title="Scan QR Code"
                >
                  <QrCode size={20} />
                </button>
                {recipientAddress &&
                  validateAddress(recipientAddress, selectedCrypto) && (
                    <CheckCircle2
                      className="absolute right-12 top-1/2 transform -translate-y-1/2 text-green-600"
                      size={20}
                    />
                  )}
              </div>
              {errors.address && (
                <p className="text-red-600 text-sm mt-2">{errors.address}</p>
              )}
            </div>

            {/* Network Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Blockchain Network
              </label>
              <select
                value={network}
                onChange={(e) => {
                  setNetwork(e.target.value);
                  setErrors({ ...errors, network: "" });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a network</option>
                {Object.keys(
                  networkFees[selectedCrypto as keyof typeof networkFees] || {},
                ).map((net) => (
                  <option key={net} value={net}>
                    {net} - Fee:{" "}
                    {networkFees[selectedCrypto as keyof typeof networkFees]?.[
                      net as keyof any
                    ]?.toFixed(6)}{" "}
                    {selectedCrypto}
                  </option>
                ))}
              </select>
              {errors.network && (
                <p className="text-red-600 text-sm mt-2">{errors.network}</p>
              )}
            </div>

            {/* Fee Summary */}
            {network && amount && (
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
                    {networkFeeAmount.toFixed(6)} {selectedCrypto}
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
                  {(receiveAmount * selectedPrice).toLocaleString("en-US", {
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

            {/* Save Email Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveEmail"
                checked={saveEmail}
                onChange={(e) => setSaveEmail(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="saveEmail" className="text-sm text-gray-700">
                Save this email for future withdrawals
              </label>
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
                    I verify the recipient address is correct
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Cryptocurrency transactions are irreversible. Please
                    triple-check the address.
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
                Review Withdrawal
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
