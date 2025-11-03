import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface HealthCheckResponse {
  ok: boolean;
  error?: string;
  message?: string;
  diagnostics?: {
    timestamp: string;
    nodeEnv: string;
    envVarsLoaded: {
      SUPABASE_URL: {
        loaded: boolean;
        isValidUrl: boolean;
        domain: string | null;
      };
      SUPABASE_KEY: {
        loaded: boolean;
        keyLength: number;
      };
    };
    rpcTest?: {
      status: string;
      error?: string;
      code?: string;
      reason?: string;
      data?: any;
    };
    tableTest?: {
      status: string;
      error?: string;
      code?: string;
      hint?: string;
      recordCount?: number;
    };
    fatalError?: string;
  };
}

export default function DatabaseStatus() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/supabase-health");
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch health status",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Database Connection Status
          </h1>
          <p className="text-slate-300">
            Monitor your Supabase database connectivity
          </p>
        </div>

        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Connection Status</CardTitle>
                <CardDescription>
                  Real-time Supabase diagnostics
                </CardDescription>
              </div>
              <Button
                onClick={checkConnection}
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

          <CardContent className="space-y-6">
            {error && (
              <Alert className="bg-red-900/20 border-red-800 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {response && (
              <>
                {/* Overall Status */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  {response.ok ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {response.ok
                        ? "Connection Successful"
                        : "Connection Failed"}
                    </p>
                    <p className="text-sm text-slate-300">
                      {response.message || response.error}
                    </p>
                  </div>
                </div>

                {/* Environment Variables */}
                {response.diagnostics?.envVarsLoaded && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-white">
                      Environment Variables
                    </h3>
                    <div className="bg-slate-700/30 rounded p-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">SUPABASE_URL</span>
                        <div className="flex items-center gap-2">
                          {response.diagnostics.envVarsLoaded.SUPABASE_URL
                            .loaded ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-slate-400">
                            {response.diagnostics.envVarsLoaded.SUPABASE_URL
                              .domain || "Not loaded"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">SUPABASE_KEY</span>
                        <div className="flex items-center gap-2">
                          {response.diagnostics.envVarsLoaded.SUPABASE_KEY
                            .loaded ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-slate-400">
                            {response.diagnostics.envVarsLoaded.SUPABASE_KEY
                              .keyLength > 0
                              ? `${response.diagnostics.envVarsLoaded.SUPABASE_KEY.keyLength} chars`
                              : "Not loaded"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* RPC Test */}
                {response.diagnostics?.rpcTest && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">RPC Test</h3>
                      {response.diagnostics.rpcTest.status === "success" && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {response.diagnostics.rpcTest.status === "error" && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      {response.diagnostics.rpcTest.status === "skipped" && (
                        <span className="text-yellow-500 text-xs font-semibold">
                          SKIPPED
                        </span>
                      )}
                    </div>
                    <div className="bg-slate-700/30 rounded p-3 text-sm">
                      <p className="text-slate-300">
                        Status: {response.diagnostics.rpcTest.status}
                      </p>
                      {response.diagnostics.rpcTest.error && (
                        <p className="text-red-400 mt-1">
                          {response.diagnostics.rpcTest.error}
                        </p>
                      )}
                      {response.diagnostics.rpcTest.reason && (
                        <p className="text-slate-400 mt-1">
                          {response.diagnostics.rpcTest.reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Table Test */}
                {response.diagnostics?.tableTest && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">
                        Table Query Test
                      </h3>
                      {response.diagnostics.tableTest.status === "success" && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {response.diagnostics.tableTest.status === "error" && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="bg-slate-700/30 rounded p-3 text-sm">
                      <p className="text-slate-300">
                        Status: {response.diagnostics.tableTest.status}
                      </p>
                      {response.diagnostics.tableTest.status === "success" && (
                        <p className="text-green-400 mt-1">
                          Found {response.diagnostics.tableTest.recordCount}{" "}
                          records in users table
                        </p>
                      )}
                      {response.diagnostics.tableTest.error && (
                        <p className="text-red-400 mt-1">
                          {response.diagnostics.tableTest.error}
                        </p>
                      )}
                      {response.diagnostics.tableTest.hint && (
                        <p className="text-slate-400 mt-1">
                          Hint: {response.diagnostics.tableTest.hint}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Fatal Error */}
                {response.diagnostics?.fatalError && (
                  <Alert className="bg-red-900/20 border-red-800 text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Fatal Error: {response.diagnostics.fatalError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Timestamp */}
                <div className="pt-4 border-t border-slate-700 text-xs text-slate-400">
                  Last checked: {response.diagnostics?.timestamp}
                </div>
              </>
            )}

            {loading && !response && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Troubleshooting Guide */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div>
              <p className="font-semibold text-white mb-2">
                Environment Variables Not Loaded
              </p>
              <p className="text-slate-400">
                Ensure SUPABASE_URL and SUPABASE_KEY are set in your
                environment. Check .env, .env.local, or DevServerControl
                environment settings.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">
                Network Connection Failed
              </p>
              <p className="text-slate-400">
                This may indicate a network issue connecting to Supabase. Verify
                your internet connection and that the Supabase URL is reachable.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Permission Denied</p>
              <p className="text-slate-400">
                Verify your Supabase key has the correct permissions. Check the
                Supabase dashboard for your project's API keys and permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
