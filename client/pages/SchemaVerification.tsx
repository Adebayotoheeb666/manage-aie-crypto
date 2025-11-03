import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Database,
  Code,
  Zap,
  Package,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VerificationReport {
  timestamp: string;
  status: "success" | "partial" | "failed" | "running";
  checks: {
    connectivity: {
      status: string;
      error?: string;
    };
    tables: {
      status: string;
      totalTables?: number;
      expectedTables?: number;
      tables?: string[];
      missing?: string[];
      error?: string;
    };
    functions: {
      status: string;
      totalFunctions?: number;
      expectedFunctions?: number;
      functions?: string[];
      missing?: string[];
      error?: string;
      message?: string;
      expectedFunctions?: string[];
    };
    seedData: {
      status: string;
      recordCount?: number;
      symbols?: string[];
      sampleRecords?: any[];
      error?: string;
    };
    extensions: {
      status: string;
      required?: string[];
      found?: string[];
      missing?: string[];
      error?: string;
    };
  };
  error?: string;
}

const expectedTables = [
  { name: "users", description: "User accounts and profiles" },
  { name: "sessions", description: "Active user sessions" },
  { name: "device_trust", description: "Trusted devices" },
  { name: "login_attempts", description: "Login attempt history" },
  { name: "api_keys", description: "API keys for access" },
  { name: "wallets", description: "Connected wallets" },
  { name: "assets", description: "Cryptocurrency holdings" },
  { name: "transactions", description: "Transaction history" },
  { name: "price_history", description: "Historical price data" },
  { name: "withdrawal_requests", description: "Withdrawal requests" },
  { name: "portfolio_snapshots", description: "Daily snapshots" },
  { name: "price_alerts", description: "Price alerts" },
  { name: "notification_logs", description: "Notification history" },
  { name: "audit_logs", description: "Audit trail" },
];

const expectedFunctions = [
  {
    name: "calculate_portfolio_value",
    description: "Calculate total portfolio value",
  },
  { name: "get_portfolio_24h_change", description: "Get 24h portfolio change" },
  { name: "get_transaction_summary", description: "Get transaction summary" },
  { name: "get_portfolio_allocation", description: "Get portfolio allocation" },
  { name: "get_total_fees_paid", description: "Calculate total fees" },
  { name: "update_asset_prices", description: "Update asset prices" },
  { name: "check_and_trigger_price_alerts", description: "Check price alerts" },
  { name: "cleanup_expired_sessions", description: "Clean expired sessions" },
  { name: "lock_accounts_excessive_attempts", description: "Lock accounts" },
  { name: "unlock_expired_account_locks", description: "Unlock accounts" },
  { name: "log_audit_event", description: "Log audit events" },
  { name: "log_api_call", description: "Log API calls" },
];

export default function SchemaVerification() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkSchema = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/schema-verification");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify schema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSchema();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "error":
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-900/20 border-green-800 text-green-300";
      case "warning":
        return "bg-yellow-900/20 border-yellow-800 text-yellow-300";
      case "error":
      case "failed":
        return "bg-red-900/20 border-red-800 text-red-300";
      default:
        return "bg-blue-900/20 border-blue-800 text-blue-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Schema Verification
          </h1>
          <p className="text-slate-300">
            Comprehensive database schema and function verification
          </p>
        </div>

        {error && (
          <Alert className="bg-red-900/20 border-red-800 text-red-300 mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {report && (
          <>
            {/* Overall Status */}
            <Card className="bg-slate-800 border-slate-700 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(report.status)}
                    <div>
                      <CardTitle className="text-white capitalize">
                        {report.status}
                      </CardTitle>
                      <CardDescription>
                        {report.status === "success"
                          ? "All checks passed"
                          : report.status === "partial"
                            ? "Some checks incomplete"
                            : "Connection failed"}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={checkSchema}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="text-slate-300 border-slate-600 hover:bg-slate-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs for different sections */}
            <Tabs defaultValue="connectivity" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5 bg-slate-700">
                <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
                <TabsTrigger value="tables">Tables</TabsTrigger>
                <TabsTrigger value="functions">Functions</TabsTrigger>
                <TabsTrigger value="seedData">Seed Data</TabsTrigger>
                <TabsTrigger value="extensions">Extensions</TabsTrigger>
              </TabsList>

              {/* Connectivity Tab */}
              <TabsContent value="connectivity">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Database Connectivity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded">
                      {getStatusIcon(report.checks.connectivity.status)}
                      <div>
                        <p className="text-white font-semibold capitalize">
                          {report.checks.connectivity.status}
                        </p>
                        {report.checks.connectivity.error && (
                          <p className="text-red-400 text-sm">
                            {report.checks.connectivity.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tables Tab */}
              <TabsContent value="tables">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Database Tables ({report.checks.tables.totalTables || 0}/
                      {report.checks.tables.expectedTables || 14})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {report.checks.tables.error && (
                      <Alert className="bg-red-900/20 border-red-800 text-red-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {report.checks.tables.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {report.checks.tables.missing &&
                      report.checks.tables.missing.length > 0 && (
                        <Alert className="bg-yellow-900/20 border-yellow-800 text-yellow-300">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Missing tables:{" "}
                            {report.checks.tables.missing.join(", ")}
                          </AlertDescription>
                        </Alert>
                      )}

                    <div className="grid grid-cols-2 gap-3">
                      {expectedTables.map((table) => {
                        const exists =
                          report.checks.tables.tables?.includes(table.name) ||
                          false;
                        return (
                          <div
                            key={table.name}
                            className={`p-3 rounded border ${
                              exists
                                ? "bg-green-900/20 border-green-800"
                                : "bg-red-900/20 border-red-800"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {exists ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                              )}
                              <div>
                                <p
                                  className={`font-semibold ${exists ? "text-green-300" : "text-red-300"}`}
                                >
                                  {table.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {table.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Functions Tab */}
              <TabsContent value="functions">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Database Functions (
                      {report.checks.functions.totalFunctions || 0}/
                      {report.checks.functions.expectedFunctions || 12})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {report.checks.functions.error && (
                      <Alert className="bg-red-900/20 border-red-800 text-red-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {report.checks.functions.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {report.checks.functions.message && (
                      <Alert className="bg-blue-900/20 border-blue-800 text-blue-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {report.checks.functions.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    {report.checks.functions.missing &&
                      report.checks.functions.missing.length > 0 && (
                        <Alert className="bg-yellow-900/20 border-yellow-800 text-yellow-300">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Missing functions:{" "}
                            {report.checks.functions.missing.join(", ")}
                          </AlertDescription>
                        </Alert>
                      )}

                    <div className="grid grid-cols-2 gap-3">
                      {expectedFunctions.map((func) => {
                        const exists =
                          report.checks.functions.functions?.includes(
                            func.name,
                          );
                        return (
                          <div
                            key={func.name}
                            className={`p-3 rounded border ${
                              exists
                                ? "bg-green-900/20 border-green-800"
                                : "bg-red-900/20 border-red-800"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {exists ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                              )}
                              <div>
                                <p
                                  className={`font-semibold ${exists ? "text-green-300" : "text-red-300"}`}
                                >
                                  {func.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {func.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Seed Data Tab */}
              <TabsContent value="seedData">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Seed Data ({report.checks.seedData.recordCount || 0}{" "}
                      records)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {report.checks.seedData.error && (
                      <Alert className="bg-red-900/20 border-red-800 text-red-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {report.checks.seedData.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {report.checks.seedData.status === "empty" && (
                      <Alert className="bg-yellow-900/20 border-yellow-800 text-yellow-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No seed data found. Run the supplementary SQL to
                          populate price history.
                        </AlertDescription>
                      </Alert>
                    )}

                    {report.checks.seedData.symbols &&
                      report.checks.seedData.symbols.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">
                            Symbols in Database
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {report.checks.seedData.symbols.map(
                              (symbol: string) => (
                                <span
                                  key={symbol}
                                  className="px-3 py-1 rounded bg-blue-900/30 border border-blue-800 text-blue-300 text-sm"
                                >
                                  {symbol}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {report.checks.seedData.sampleRecords &&
                      report.checks.seedData.sampleRecords.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">
                            Sample Records
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {report.checks.seedData.sampleRecords.map(
                              (record: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-slate-700/30 rounded text-sm"
                                >
                                  <p className="text-slate-300">
                                    <span className="font-semibold">
                                      {record.symbol}
                                    </span>
                                    {" - "}${record.price_usd?.toFixed(2)} (
                                    <span
                                      className={
                                        record.price_change_24h >= 0
                                          ? "text-green-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {record.price_change_24h >= 0 ? "+" : ""}
                                      {record.price_change_24h?.toFixed(2)}%
                                    </span>
                                    )
                                  </p>
                                  <p className="text-slate-500 text-xs mt-1">
                                    {new Date(
                                      record.timestamp,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Extensions Tab */}
              <TabsContent value="extensions">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      PostgreSQL Extensions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {report.checks.extensions.error && (
                      <Alert className="bg-red-900/20 border-red-800 text-red-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {report.checks.extensions.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {report.checks.extensions.missing &&
                      report.checks.extensions.missing.length > 0 && (
                        <Alert className="bg-yellow-900/20 border-yellow-800 text-yellow-300">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Missing extensions:{" "}
                            {report.checks.extensions.missing.join(", ")}
                          </AlertDescription>
                        </Alert>
                      )}

                    <div className="grid grid-cols-2 gap-3">
                      {report.checks.extensions.required?.map((ext: string) => {
                        const found =
                          report.checks.extensions.found?.includes(ext);
                        return (
                          <div
                            key={ext}
                            className={`p-3 rounded border flex items-center gap-2 ${
                              found
                                ? "bg-green-900/20 border-green-800"
                                : "bg-red-900/20 border-red-800"
                            }`}
                          >
                            {found ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span
                              className={
                                found ? "text-green-300" : "text-red-300"
                              }
                            >
                              {ext}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded text-sm text-slate-400">
              Last checked: {new Date(report.timestamp).toLocaleString()}
            </div>
          </>
        )}

        {loading && !report && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}
