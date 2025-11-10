import { useState } from "react";
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

// Mock withdrawal data
const mockWithdrawals: Withdrawal[] = [
  {
    id: "W001",
    userId: "U001",
    amount: "5000",
    email: "user1@example.com",
    bankName: "Chase Bank",
    accountName: "John Doe",
    accountNo: "****1234",
    routingNo: "****0001",
    status: "pending",
    stage: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "W002",
    userId: "U002",
    amount: "10000",
    email: "user2@example.com",
    bankName: "Bank of America",
    accountName: "Jane Smith",
    accountNo: "****5678",
    routingNo: "****0002",
    status: "processing",
    stage: 2,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "W003",
    userId: "U003",
    amount: "3000",
    email: "user3@example.com",
    bankName: "Wells Fargo",
    accountName: "Bob Johnson",
    accountNo: "****9012",
    routingNo: "****0003",
    status: "processing",
    stage: 2,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export default function Admin() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(mockWithdrawals);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Withdrawal>>({});
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);

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

  const markStageComplete = (id: string, stage: number) => {
    if (stage < 1 || stage > 3) return;

    const updatedWithdrawals = withdrawals.map((w) => {
      if (w.id === id) {
        const newStage = Math.min(stage + 1, 3) as 1 | 2 | 3;
        const newStatus =
          newStage === 3 ? ("completed" as const) : ("processing" as const);
        return { ...w, stage: newStage, status: newStatus };
      }
      return w;
    });
    setWithdrawals(updatedWithdrawals);
    setSelectedWithdrawal(null);
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
          <Button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
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
                {withdrawals.map((withdrawal) => (
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
                ))}
              </tbody>
            </table>
          </div>
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
