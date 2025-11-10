import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@shared/lib/supabase";
import type { WithdrawalRequest } from "@shared/types/database";

interface ProgressStage {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export default function ProgressReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser, dbUser } = useAuth();
  const [stages, setStages] = useState<ProgressStage[]>([
    {
      id: 1,
      title: "Withdrawal Initiated",
      description: "Your withdrawal request has been received and verified",
      completed: false,
    },
    {
      id: 2,
      title: "Bank Processing",
      description: "Awaiting bank processing and verification",
      completed: false,
    },
    {
      id: 3,
      title: "Transfer Complete",
      description: "Funds transferred to your bank account",
      completed: false,
    },
  ]);

  const state = location.state || {};
  const [withdrawalInfo, setWithdrawalInfo] = useState({
    amount: state.amount || "0",
    crypto: state.crypto || "",
    bankName: state.bankName || "N/A",
    accountName: state.accountName || "N/A",
    lastFourAccount: state.lastFourAccount || "0000",
    email: state.email || "",
    initiatedAt: new Date().toISOString(),
    withdrawalId: state.withdrawalId || "",
    address: state.address || "",
    network: state.network || "",
    price: state.price || 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawal, setWithdrawal] = useState<WithdrawalRequest | null>(null);

  // Fetch withdrawal request from database
  useEffect(() => {
    const fetchWithdrawal = async () => {
      if (!dbUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("withdrawal_requests")
          .select("*")
          .eq("user_id", dbUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError;
        }

        if (data) {
          setWithdrawal(data as WithdrawalRequest);

          // Update stages based on withdrawal stage
          const newStages = stages.map((stage) => ({
            ...stage,
            completed: (data as WithdrawalRequest).stage >= stage.id,
            completedAt: (data as WithdrawalRequest).stage >= stage.id ? new Date().toISOString() : undefined,
          }));
          setStages(newStages);

          // Update withdrawal info from database
          setWithdrawalInfo((prev) => ({
            ...prev,
            amount: String((data as WithdrawalRequest).amount),
            crypto: (data as WithdrawalRequest).symbol,
            email: (data as WithdrawalRequest).destination_address,
            address: (data as WithdrawalRequest).destination_address,
            network: (data as WithdrawalRequest).network,
            initiatedAt: (data as WithdrawalRequest).created_at,
            withdrawalId: (data as WithdrawalRequest).id,
          }));
        } else {
          setError("No active withdrawal request found");
        }
      } catch (err) {
        console.error("Error fetching withdrawal request:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch withdrawal request");
      } finally {
        setLoading(false);
      }
    };

    if (state.withdrawalId) {
      setLoading(false);
    } else {
      fetchWithdrawal();
    }
  }, [dbUser, state.withdrawalId]);

  const completedCount = stages.filter((s) => s.completed).length;
  const progressPercentage = (completedCount / stages.length) * 100;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            Withdrawal Progress
          </h1>
          <p className="text-gray-600">
            Track your withdrawal status and processing stages
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Timeline */}
          <div className="lg:col-span-2">
            {/* Progress Bar */}
            <div className="bg-white rounded-xl p-8 border border-blue-100 mb-8">
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    Overall Progress
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {completedCount} of {stages.length} Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Stages */}
            <div className="space-y-6">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className={`bg-white rounded-xl border transition-all ${
                    stage.completed
                      ? "border-green-100 bg-green-50"
                      : "border-gray-100"
                  }`}
                >
                  <div className="p-6 flex gap-6">
                    {/* Stage Icon */}
                    <div className="flex-shrink-0">
                      {stage.completed ? (
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Stage Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Stage {stage.id}: {stage.title}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {stage.description}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            stage.completed
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {stage.completed ? "✓ Complete" : "Pending"}
                        </span>
                      </div>

                      {stage.completedAt && (
                        <p className="text-sm text-gray-500 mt-3">
                          Completed on {formatDate(stage.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Divider between stages */}
                  {index < stages.length - 1 && (
                    <div className="px-6">
                      <div className="border-t border-gray-200 py-4">
                        <div className="flex justify-center">
                          <div className="w-1 h-8 bg-gray-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Withdrawal Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 border border-blue-100 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Withdrawal Details
              </h3>

              <div className="space-y-6">
                {/* Amount */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {withdrawalInfo.amount} {withdrawalInfo.crypto}
                  </p>
                  {withdrawalInfo.price > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      ≈ ${(parseFloat(withdrawalInfo.amount) * withdrawalInfo.price).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Bank Details */}
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-sm font-semibold text-gray-900 mb-4">
                    Bank Account
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600">Bank</p>
                      <p className="text-sm font-medium text-gray-900">
                        {withdrawalInfo.bankName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Account Holder</p>
                      <p className="text-sm font-medium text-gray-900">
                        {withdrawalInfo.accountName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Account Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        ••••{withdrawalInfo.lastFourAccount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {withdrawalInfo.email}
                  </p>
                </div>

                {/* Network */}
                {withdrawalInfo.network && (
                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-xs text-gray-600 mb-1">Network</p>
                    <p className="text-sm font-medium text-gray-900">
                      {withdrawalInfo.network}
                    </p>
                  </div>
                )}

                {/* Withdrawal ID */}
                {withdrawalInfo.withdrawalId && (
                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-xs text-gray-600 mb-1">Withdrawal ID</p>
                    <p className="text-sm font-medium text-gray-900 break-all">
                      {withdrawalInfo.withdrawalId}
                    </p>
                  </div>
                )}

                {/* Status Info */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Next Step
                        </p>
                        <p className="text-xs text-blue-800">
                          {completedCount === 1
                            ? "Your withdrawal is being processed by our team. You'll receive an email update shortly."
                            : completedCount === 2
                              ? "Almost there! Your bank is processing the transfer."
                              : "Withdrawal complete! Check your bank account."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Initiated Info */}
        <div className="mt-8 bg-white rounded-xl p-6 border border-gray-100">
          <p className="text-sm text-gray-600">
            Withdrawal initiated on{" "}
            <span className="font-semibold text-gray-900">
              {formatDate(withdrawalInfo.initiatedAt)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
