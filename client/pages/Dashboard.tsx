import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnimatedCard } from "@/components/AnimatedCard";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useDashboardData } from "@/hooks/useDashboardData";
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
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getPortfolioSnapshots } from "@shared/lib/supabase";

const COLORS = ["#2563eb", "#0ea5e9", "#06b6d4", "#0891b2"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { authUser, signOut } = useAuth();
  const { address: walletAddress } = useWallet();
  const {
    portfolioValue,
    portfolioChange,
    assets,
    transactions,
    loading,
    error,
    refetch,
  } = useDashboardData();
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [primaryWallet, setPrimaryWallet] = useState<string>("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authUser) {
      navigate("/connect-wallet");
    }
  }, [authUser, navigate]);

  // Set primary wallet from connected wallet
  useEffect(() => {
    if (walletAddress) {
      setPrimaryWallet(walletAddress);
    }
  }, [walletAddress]);

  // Fetch portfolio history for chart
  useEffect(() => {
    async function fetchHistory() {
      if (!authUser) return;
      try {
        const { id } = authUser;
        // Get user ID from auth
        const snapshots = await getPortfolioSnapshots(id, 30);

        // Transform snapshots to chart data
        const chartData = snapshots
          .reverse()
          .map((snapshot) => ({
            name: new Date(snapshot.snapshot_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            value: snapshot.total_value_usd || 0,
          }))
          .slice(-7); // Last 7 snapshots

        setPortfolioHistory(chartData);
      } catch (err) {
        const extractErrorMessage = (e: unknown) => {
          if (!e) return "Unknown error";
          if (e instanceof Error) return e.message;
          if (typeof e === "string") return e;
          const anyErr = e as any;
          if (anyErr?.error) {
            if (typeof anyErr.error === "string") return anyErr.error;
            if (typeof anyErr.error?.message === "string")
              return anyErr.error.message;
          }
          if (typeof anyErr.message === "string") return anyErr.message;
          if (
            typeof anyErr.status === "number" ||
            typeof anyErr.statusText === "string"
          ) {
            return `${anyErr.status || ""} ${anyErr.statusText || ""}`.trim();
          }
          try {
            return String(anyErr);
          } catch (_) {
            return "Unknown error";
          }
        };

        const msg = extractErrorMessage(err);
        console.error("Failed to fetch portfolio history:", msg);
      }
    }

    fetchHistory();
  }, [authUser]);

  const pieChartData = useMemo(
    () =>
      assets.map((asset) => ({
        name: asset.symbol,
        value: asset.balance_usd || 0,
      })),
    [assets],
  );

  const totalBalance = portfolioValue?.total_usd || 0;
  const btcEquivalent = portfolioValue?.total_btc || 0;
  const change24hAmount = portfolioChange?.change_usd || 0;
  const change24hPercent = portfolioChange?.change_percentage || 0;

  const filteredTransactions = transactions.filter((tx) => {
    const typeMatch =
      filterType === "all" ||
      (filterType === "sent" && tx.tx_type === "send") ||
      (filterType === "received" && tx.tx_type === "receive") ||
      (filterType === "swapped" && tx.tx_type === "swap");
    const searchMatch =
      searchTerm === "" ||
      (tx.tx_hash &&
        tx.tx_hash.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.from_address &&
        tx.from_address.toLowerCase().includes(searchTerm.toLowerCase()));
    return typeMatch && searchMatch;
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleCopyAddress = () => {
    if (primaryWallet) {
      navigator.clipboard.writeText(primaryWallet);
      alert("Wallet address copied!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-blue-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">₿</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                CryptoVault
              </span>
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
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Assets Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Connect a wallet to see your portfolio
            </p>
            <Button
              onClick={() => navigate("/connect-wallet")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Connect Wallet
            </Button>
          </div>
        </main>
      </div>
    );
  }

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
        <AnimatedCard className="bg-white rounded-xl p-6 border border-blue-100 mb-8 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-2">Primary Wallet</p>
              <p className="font-mono text-lg text-gray-900 flex items-center gap-2">
                {primaryWallet || "No wallet connected"}
                <motion.button
                  onClick={handleCopyAddress}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-blue-600 hover:text-blue-700 ml-2"
                >
                  <Copy size={18} />
                </motion.button>
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/withdraw")}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-2 rounded-lg"
              >
                <ArrowUpRight size={18} />
                Withdraw Funds
              </Button>
            </motion.div>
          </div>
        </AnimatedCard>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Balance Card */}
          <AnimatedCard className="lg:col-span-2 bg-white rounded-xl p-8 border border-blue-100 shadow-sm">
            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-2">
                Total Portfolio Value
              </p>
              <h2 className="text-5xl font-bold text-gray-900 mb-2">
                $
                {totalBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <TrendingUp
                    className={
                      change24hAmount >= 0 ? "text-green-600" : "text-red-600"
                    }
                    size={18}
                  />
                  <span
                    className={
                      change24hAmount >= 0
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {change24hAmount >= 0 ? "+" : ""}$
                    {change24hAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span
                    className={
                      change24hAmount >= 0
                        ? "text-green-600 text-sm"
                        : "text-red-600 text-sm"
                    }
                  >
                    ({change24hPercent.toFixed(2)}% 24h)
                  </span>
                </div>
                <button
                  onClick={() => refetch()}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={
                    portfolioHistory.length > 0
                      ? portfolioHistory
                      : [{ name: "Today", value: totalBalance }]
                  }
                >
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
                Total Balance:{" "}
                <span className="font-bold text-gray-900">
                  {btcEquivalent.toFixed(4)} BTC
                </span>
              </p>
            </div>
          </AnimatedCard>

          {/* Portfolio Allocation */}
          <AnimatedCard className="bg-white rounded-xl p-8 border border-blue-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Portfolio Allocation
            </h3>
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
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {assets.map((asset, idx) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx] }}
                    />
                    <span className="text-sm text-gray-700">
                      {asset.symbol}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {(
                      ((asset.balance * asset.price) / totalBalance) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              ))}
            </div>
          </AnimatedCard>
        </div>

        {/* Assets Overview */}
        <AnimatedCard className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900">Your Assets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-blue-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    24h Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    % of Portfolio
                  </th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const value = asset.balance_usd || 0;
                  const percentage =
                    totalBalance > 0 ? (value / totalBalance) * 100 : 0;
                  const change24h = asset.price_change_24h || 0;
                  return (
                    <tr
                      key={asset.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {asset.symbol}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {asset.balance.toFixed(8)}
                      </td>
                      <td className="px-6 py-4">
                        <motion.div
                          key={`${asset.symbol}-${asset.price_usd}`}
                          initial={{ scale: 1 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="text-gray-900"
                        >
                          $
                          {(asset.price_usd || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </motion.div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <motion.div
                          initial={{ opacity: 0.8 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          $
                          {value.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </motion.div>
                      </td>
                      <td
                        className={`px-6 py-4 font-medium ${change24h >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        <motion.div
                          initial={{ opacity: 0.8 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {change24h >= 0 ? "↑ " : "↓ "}
                          {Math.abs(change24h).toFixed(2)}%
                        </motion.div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {percentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AnimatedCard>

        {/* Transaction History */}
        <AnimatedCard className="bg-white rounded-xl border border-blue-100 shadow-sm">
          <div className="p-6 border-b border-blue-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Transaction History
              </h3>
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
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
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
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          tx.tx_type === "receive"
                            ? "bg-green-100"
                            : tx.tx_type === "send"
                              ? "bg-red-100"
                              : "bg-blue-100"
                        }`}
                      >
                        {tx.tx_type === "receive" && (
                          <ArrowDownLeft className="text-green-600" />
                        )}
                        {tx.tx_type === "send" && (
                          <ArrowUpRight className="text-red-600" />
                        )}
                        {tx.tx_type === "swap" && (
                          <ArrowLeftRight className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {tx.tx_type}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span className="font-mono">
                            {tx.tx_hash
                              ? tx.tx_hash.substring(0, 16) + "..."
                              : "Pending"}
                          </span>
                          {tx.tx_hash && (
                            <a
                              href={`https://etherscan.io/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(tx.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {tx.tx_type === "receive" ? "+" : "-"}
                        {tx.amount.toFixed(8)} {tx.symbol}
                      </p>
                      <p className="text-sm text-gray-600">
                        $
                        {(tx.amount_usd || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                          tx.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : tx.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
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
        </AnimatedCard>
      </main>
    </div>
  );
}
