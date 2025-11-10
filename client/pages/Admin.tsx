import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Withdrawal {
  id: string;
  userId: string;
  amount: string;
  email: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  routingNo: string;
  status: "pending" | "processing" | "completed";
  stage: 1 | 2 | 3;
  createdAt: string;
}

interface UserBalance {
  userId: string;
  email: string;
  totalBalance: number;
  assetCount: number;
}

const ADMIN_USERNAME = "ajibolaEmmanuel";
const ADMIN_PASSWORD = "Emmanuel123";

// Default withdrawal interface for API responses
interface APIWithdrawal {
  id: string;
  userId: string;
  walletId: string;
  amount: string;
  email: string;
  symbol: string;
  network: string;
  destinationAddress: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  createdAt: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Withdrawal>>({});
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [balanceForm, setBalanceForm] = useState({ totalBalance: "", assetCount: "" });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [balancesError, setBalancesError] = useState("");
  const [withdrawalsError, setWithdrawalsError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setUsername("");
      setPassword("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/");
  };

  const handleEditWithdrawal = (withdrawal: Withdrawal) => {
    setEditingId(withdrawal.id);
    setEditData({ ...withdrawal });
  };

  const handleSaveEdit = (id: string) => {
    const updatedWithdrawals = withdrawals.map((w) =>
      w.id === id ? { ...w, ...editData } : w
    );
    setWithdrawals(updatedWithdrawals);
    setEditingId(null);
    setEditData({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const markStageComplete = async (id: string, currentStage: number) => {
    if (currentStage < 1 || currentStage > 2) return;

    const nextStage = Math.min(currentStage + 1, 3);

    try {
      const response = await fetch(`/api/admin/withdrawal-requests/${id}/stage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stage: nextStage }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update stage: ${response.status}`);
      }

      const result = await response.json();

      // Update local state
      const updatedWithdrawals = withdrawals.map((w) => {
        if (w.id === id) {
          return { ...w, stage: nextStage as 1 | 2 | 3 };
        }
        return w;
      });
      setWithdrawals(updatedWithdrawals);

      if (selectedWithdrawal && selectedWithdrawal.id === id) {
        setSelectedWithdrawal({ ...selectedWithdrawal, stage: nextStage as 1 | 2 | 3 });
      }
    } catch (error) {
      console.error("Error updating withdrawal stage:", error);
      alert(`Failed to update stage: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch user balances from API
  const fetchUserBalances = async () => {
    try {
      setIsLoadingBalances(true);
      setBalancesError("");
      const response = await fetch("/api/admin/user-balances");

      if (!response.ok) {
        throw new Error(`Failed to fetch user balances: ${response.status}`);
      }

      const data = await response.json();
      setUserBalances(data.data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch user balances";
      setBalancesError(message);
      console.error("Error fetching user balances:", error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Fetch withdrawal requests from API
  const fetchWithdrawalRequests = async () => {
    try {
      setIsLoadingWithdrawals(true);
      setWithdrawalsError("");
      const response = await fetch("/api/admin/withdrawal-requests");

      if (!response.ok) {
        throw new Error(`Failed to fetch withdrawal requests: ${response.status}`);
      }

      const data = await response.json();
      const formattedWithdrawals = (data.data || []).map((wd: APIWithdrawal) => ({
        id: wd.id,
        userId: wd.userId,
        amount: wd.amount,
        email: wd.email,
        bankName: wd.symbol || "N/A",
        accountName: "Bank Transfer",
        accountNo: `****${wd.destinationAddress.slice(-4)}`,
        routingNo: wd.network || "N/A",
        status: wd.status as "pending" | "processing" | "completed",
        stage: wd.status === "completed" ? 3 : wd.status === "processing" ? 2 : 1,
        createdAt: wd.createdAt,
      }));
      setWithdrawals(formattedWithdrawals);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch withdrawal requests";
      setWithdrawalsError(message);
      console.error("Error fetching withdrawal requests:", error);
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  // Fetch data when admin logs in
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserBalances();
      fetchWithdrawalRequests();
    }
  }, [isLoggedIn]);

  const handleSaveUserBalance = () => {
    if (!selectedUserEmail || !balanceForm.totalBalance || !balanceForm.assetCount) {
      alert("Please fill in all fields");
      return;
    }

    const existingIndex = userBalances.findIndex(
      (ub) => ub.email === selectedUserEmail
    );

    if (existingIndex >= 0) {
      const updated = [...userBalances];
      updated[existingIndex] = {
        ...updated[existingIndex],
        totalBalance: parseFloat(balanceForm.totalBalance),
        assetCount: parseInt(balanceForm.assetCount),
      };
      setUserBalances(updated);
    } else {
      const newBalance: UserBalance = {
        userId: `U${Date.now()}`,
        email: selectedUserEmail,
        totalBalance: parseFloat(balanceForm.totalBalance),
        assetCount: parseInt(balanceForm.assetCount),
      };
      setUserBalances([...userBalances, newBalance]);
    }

    setSelectedUserEmail("");
    setBalanceForm({ totalBalance: "", assetCount: "" });
  };

  const handleDeleteUserBalance = (email: string) => {
    setUserBalances(userBalances.filter((ub) => ub.email !== email));
  };

  const handleSelectUserBalance = (userBalance: UserBalance) => {
    setSelectedUserEmail(userBalance.email);
    setBalanceForm({
      totalBalance: userBalance.totalBalance.toString(),
      assetCount: userBalance.assetCount.toString(),
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">C</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Coinbaze Admin
              </h1>
              <p className="text-gray-600">Manage withdrawals and user accounts</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{loginError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                Demo credentials available for testing
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm">Manage withdrawals</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                fetchUserBalances();
                fetchWithdrawalRequests();
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoadingBalances || isLoadingWithdrawals}
            >
              Refresh Data
            </Button>
            <Button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Balance Management Section */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Manage User Balances
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Balance Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  User Email
                </label>
                <input
                  type="email"
                  value={selectedUserEmail}
                  onChange={(e) => setSelectedUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Total Balance ($)
                </label>
                <input
                  type="number"
                  value={balanceForm.totalBalance}
                  onChange={(e) =>
                    setBalanceForm({
                      ...balanceForm,
                      totalBalance: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Asset Count
                </label>
                <input
                  type="number"
                  value={balanceForm.assetCount}
                  onChange={(e) =>
                    setBalanceForm({
                      ...balanceForm,
                      assetCount: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSaveUserBalance}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Save Balance
                </button>
              </div>
            </div>

            {/* Loading and Error States */}
            {isLoadingBalances && (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading user balances...</p>
              </div>
            )}

            {balancesError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{balancesError}</p>
              </div>
            )}

            {/* User Balances Table */}
            {!isLoadingBalances && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userBalances.length > 0 ? (
                      userBalances.map((ub) => (
                        <tr key={ub.userId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {ub.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${ub.totalBalance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ub.assetCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <button
                              onClick={() => handleSelectUserBalance(ub)}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUserBalance(ub.email)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Withdrawals</p>
            <p className="text-3xl font-bold text-gray-900">{withdrawals.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {withdrawals.filter((w) => w.status === "pending").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">
              {withdrawals.filter((w) => w.status === "completed").length}
            </p>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Withdrawal Requests
            </h2>
          </div>

          {/* Loading and Error States */}
          {isLoadingWithdrawals && (
            <div className="p-6 text-center">
              <p className="text-gray-600">Loading withdrawal requests...</p>
            </div>
          )}

          {withdrawalsError && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{withdrawalsError}</p>
              </div>
            </div>
          )}

          {!isLoadingWithdrawals && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {withdrawals.length > 0 ? (
                    withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {withdrawal.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === withdrawal.id ? (
                            <input
                              type="text"
                              value={editData.amount || ""}
                              onChange={(e) =>
                                setEditData({ ...editData, amount: e.target.value })
                              }
                              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">
                              ${withdrawal.amount}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === withdrawal.id ? (
                            <input
                              type="email"
                              value={editData.email || ""}
                              onChange={(e) =>
                                setEditData({ ...editData, email: e.target.value })
                              }
                              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">
                              {withdrawal.email}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {withdrawal.bankName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              withdrawal.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : withdrawal.status === "processing"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {withdrawal.status.charAt(0).toUpperCase() +
                              withdrawal.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                            <Clock size={14} />
                            Stage {withdrawal.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {editingId === withdrawal.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(withdrawal.id)}
                                className="text-green-600 hover:text-green-700 font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-700 font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  handleEditWithdrawal(withdrawal);
                                  setSelectedWithdrawal(withdrawal);
                                }}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setSelectedWithdrawal(withdrawal)}
                                className="text-green-600 hover:text-green-700 font-medium"
                              >
                                Manage
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No withdrawal requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedWithdrawal && (
          <div className="mt-8 bg-white rounded-xl border border-blue-100 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Withdrawal {selectedWithdrawal.id} - Stage Management
                </h2>
                <p className="text-gray-600">
                  Mark progression stages as complete
                </p>
              </div>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${selectedWithdrawal.amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedWithdrawal.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bank</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedWithdrawal.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Holder</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedWithdrawal.accountName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedWithdrawal.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stage Progression */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Progress Stages
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      stage: 1,
                      title: "Withdrawal Initiated",
                      description: "Automatically marked as complete",
                    },
                    {
                      stage: 2,
                      title: "Bank Processing",
                      description: "Mark when bank starts processing",
                    },
                    {
                      stage: 3,
                      title: "Transfer Complete",
                      description: "Mark when funds are transferred",
                    },
                  ].map((item) => (
                    <div
                      key={item.stage}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedWithdrawal.stage >= item.stage
                          ? "border-green-100 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {selectedWithdrawal.stage >= item.stage ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Stage {item.stage}: {item.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {item.stage > 1 &&
                        selectedWithdrawal.stage === item.stage - 1 && (
                          <button
                            onClick={() =>
                              markStageComplete(
                                selectedWithdrawal.id,
                                item.stage - 1
                              )
                            }
                            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition text-sm"
                          >
                            Mark as Complete
                          </button>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
