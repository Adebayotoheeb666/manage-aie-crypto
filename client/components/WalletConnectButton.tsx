import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";

export function WalletConnectButton() {
  const { address, isConnected, connect, disconnect, loading, error } =
    useWallet();
  const { connectWallet: authConnectWallet } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setConnectError(null);
      // Connect to MetaMask
      await connect();
      
      // Get the connected address from wallet context
      // Note: The address might not be immediately available, so we need to wait
      const checkAddress = async () => {
        // Wait a bit for the wallet state to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const win = window as any;
        if (win.ethereum) {
          const accounts = await win.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            const walletAddress = accounts[0];
            // Authenticate with backend
            await authConnectWallet(walletAddress);
            // Navigate to dashboard
            navigate("/dashboard");
          } else {
            throw new Error("No wallet accounts found");
          }
        } else {
          throw new Error("MetaMask not available");
        }
      };
      
      await checkAddress();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setConnectError(message);
      console.error("Wallet connection error:", err);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <div className="bg-blue-50 rounded-lg px-4 py-2 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyAddress}
            className="text-gray-600 hover:text-blue-600 transition"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDisconnect}
          className="text-gray-600 hover:text-red-600 transition p-2"
          title="Disconnect wallet"
        >
          <LogOut className="w-5 h-5" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Button
        onClick={handleConnect}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
      >
        <Wallet size={18} />
        {loading ? "Connecting..." : "Connect MetaMask"}
      </Button>

      {(error || connectError) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-sm text-red-700">{connectError || error}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
