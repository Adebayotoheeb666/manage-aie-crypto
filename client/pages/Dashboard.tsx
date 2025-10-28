import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  LogOut,
  Copy,
  ExternalLink,
  TrendingUp,
  RefreshCw,
  Search,
  Download,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useRealtimePrices } from "@/hooks/useRealtimePrices";

// Mock portfolio data
const portfolioData = [
  { name: "Jan", value: 28000 },
  { name: "Feb", value: 32000 },
  { name: "Mar", value: 29500 },
  { name: "Apr", value: 35000 },
  { name: "May", value: 38000 },
  { name: "Jun", value: 42000 },
];

const walletAddress = "1A1z7agoat4xNAavZY2YoW6XwMEUpnqRDM";

const assets = [
  { id: 1, symbol: "BTC", name: "Bitcoin", balance: 0.542, price: 42500, change24h: 5.2 },
  { id: 2, symbol: "ETH", name: "Ethereum", balance: 2.148, price: 2280, change24h: -2.1 },
  { id: 3, symbol: "USDC", name: "USD Coin", balance: 5000, price: 1.0, change24h: 0.1 },
  { id: 4, symbol: "ADA", name: "Cardano", balance: 1500, price: 0.98, change24h: 3.5 },
];

const transactions = [
  {
    id: 1,
    type: "receive",
    symbol: "BTC",
    amount: 0.25,
    usdValue: 10625,
    date: "2025-01-15",
    status: "confirmed",
    hash: "3a4b5c6d...",
    address: "1B1z7...",
  },
  {
    id: 2,
    type: "send",
    symbol: "ETH",
    amount: 1.0,
    usdValue: 2280,
    date: "2025-01-14",
    status: "confirmed",
    hash: "4b5c6d7e...",
    address: "0xAB12...",
  },
  {
    id: 3,
    type: "swap",
    symbol: "USDC",
    amount: 2000,
    usdValue: 2000,
    date: "2025-01-13",
    status: "confirmed",
    hash: "5c6d7e8f...",
    address: "Swap",
  },
  {
    id: 4,
    type: "receive",
    symbol: "ADA",
    amount: 500,
    usdValue: 490,
    date: "2025-01-12",
    status: "confirmed",
    hash: "6d7e8f9g...",
    address: "1C2d3e...",
  },
];

const pieChartData = assets.map(asset => ({
  name: asset.symbol,
  value: asset.balance * asset.price,
}));

const COLORS = ["#2563eb", "#0ea5e9", "#06b6d4", "#0891b2"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const totalBalance = assets.reduce((sum, asset) => sum + asset.balance * asset.price, 0);
  const btcEquivalent = totalBalance / 42500;
  const change24h = 2150; // Mock 24h change

  const filteredTransactions = transactions.filter((tx) => {
    const typeMatch =
      filterType === "all" ||
      (filterType === "sent" && tx.type === "send") ||
      (filterType === "received" && tx.type === "receive") ||
      (filterType === "swapped" && tx.type === "swap");
    const searchMatch =
      searchTerm === "" ||
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.address.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  const handleLogout = () => {
    navigate("/");
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("Wallet address copied!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">₿</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CryptoVault</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Wallet Address Section */}
        <div className="bg-white rounded-xl p-6 border border-blue-100 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-2">Wallet Address</p>
              <p className="font-mono text-lg text-gray-900 flex items-center gap-2">
                {walletAddress}
                <button
                  onClick={handleCopyAddress}
                  className="text-blue-600 hover:text-blue-700 ml-2"
                >
                  <Copy size={18} />
                </button>
              </p>
            </div>
            <Button
              onClick={() => navigate("/withdraw")}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-2 rounded-lg"
            >
              <ArrowUpRight size={18} />
              Withdraw Funds
            </Button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Balance Card */}
          <div className="lg:col-span-2 bg-white rounded-xl p-8 border border-blue-100 shadow-sm">
            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-2">Total Portfolio Value</p>
              <h2 className="text-5xl font-bold text-gray-900 mb-2">
                ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <TrendingUp className="text-green-600" size={18} />
                  <span className="text-green-600 font-semibold">+${change24h.toLocaleString()}</span>
                  <span className="text-green-600 text-sm">(+5.0% 24h)</span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={portfolioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* BTC Equivalent */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-700">
                Total Balance: <span className="font-bold text-gray-900">{btcEquivalent.toFixed(4)} BTC</span>
              </p>
            </div>
          </div>

          {/* Portfolio Allocation */}
          <div className="bg-white rounded-xl p-8 border border-blue-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Portfolio Allocation</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {assets.map((asset, idx) => (
                <div key={asset.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx] }}
                    />
                    <span className="text-sm text-gray-700">{asset.symbol}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {((asset.balance * asset.price) / totalBalance * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assets Overview */}
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900">Your Assets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-blue-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">24h Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">% of Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const value = asset.balance * asset.price;
                  const percentage = (value / totalBalance) * 100;
                  return (
                    <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{asset.symbol}</div>
                        <div className="text-sm text-gray-500">{asset.name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{asset.balance.toFixed(6)}</td>
                      <td className="px-6 py-4 text-gray-900">${asset.price.toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-6 py-4 font-medium ${asset.change24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {asset.change24h >= 0 ? "+" : ""}{asset.change24h}%
                      </td>
                      <td className="px-6 py-4 text-gray-900">{percentage.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm">
          <div className="p-6 border-b border-blue-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download size={18} />
                Export
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {["all", "received", "sent", "swapped"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === filter
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by hash or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Transaction List */}
          <div className="divide-y divide-gray-100">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-gray-600">
                <p>No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        tx.type === "receive"
                          ? "bg-green-100"
                          : tx.type === "send"
                          ? "bg-red-100"
                          : "bg-blue-100"
                      }`}>
                        {tx.type === "receive" && <ArrowDownLeft className="text-green-600" />}
                        {tx.type === "send" && <ArrowUpRight className="text-red-600" />}
                        {tx.type === "swap" && <ArrowLeftRight className="text-blue-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{tx.type}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span className="font-mono">{tx.hash}</span>
                          <a
                            href="#"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={(e) => e.preventDefault()}
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {tx.type === "receive" ? "+" : "-"}{tx.amount} {tx.symbol}
                      </p>
                      <p className="text-sm text-gray-600">
                        ${tx.usdValue.toLocaleString()}
                      </p>
                      <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex justify-center">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
