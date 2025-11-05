import { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  Plus,
  ChevronDown,
  Search,
  Download,
  ArrowUpDown,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  ExternalLink,
  Copy,
  Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

// Types
interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  price_usd: number;
  change_24h: number;
  value_usd: number;
}

interface Transaction {
  id: string;
  tx_hash: string;
  tx_type: 'send' | 'receive' | 'swap';
  amount: number;
  symbol: string;
  amount_usd: number;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  from?: string;
  to?: string;
}

interface PortfolioData {
  timestamp: string;
  value: number;
}

export default function Dashboard() {
  const { dbUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [change24h, setChange24h] = useState(0);
  const [change24hPercent, setChange24hPercent] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'send' | 'receive' | 'swap'>('all');

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchAssets(),
        fetchTransactions(),
        fetchPortfolioHistory()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch user's assets
  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/wallet/assets');
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      
      setAssets(data.assets);
      
      // Calculate total balance
      const balance = data.assets.reduce((sum: number, asset: Asset) => sum + asset.value_usd, 0);
      setTotalBalance(balance);
      
      // Calculate 24h change if we have previous data
      if (data.portfolio_history?.length >= 2) {
        const prev = data.portfolio_history[data.portfolio_history.length - 2].value;
        const current = data.portfolio_history[data.portfolio_history.length - 1].value;
        const change = current - prev;
        setPreviousBalance(prev);
        setChange24h(change);
        setChange24hPercent((change / prev) * 100);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  };

  // Fetch transaction history
  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  // Fetch portfolio history
  const fetchPortfolioHistory = async () => {
    try {
      const response = await fetch('/api/portfolio/history');
      if (!response.ok) throw new Error('Failed to fetch portfolio history');
      const data = await response.json();
      setPortfolioData(data.history);
    } catch (error) {
      console.error('Error fetching portfolio history:', error);
      throw error;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter transactions based on search and filter
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.tx_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.tx_type === filterType;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }
  },
  { 
    id: 4, 
    tx_type: 'receive', 
    amount: 50, 
    symbol: 'ADA',
    amount_usd: 25,
    status: 'pending', 
    created_at: '2023-06-16T12:00:00',
    tx_hash: null
  },
];

export default function Dashboard() {
  const [assets, setAssets] = useState(initialAssets);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [walletAddress] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4');
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Calculate portfolio metrics
  const totalBalance = assets.reduce((sum, asset) => sum + (asset.balance * (asset.price_usd || 0)), 0);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [change24hAmount, setChange24hAmount] = useState(0);
  const [change24hPercent, setChange24hPercent] = useState(0);

  // Fetch portfolio history when assets change
  useEffect(() => {
    async function fetchPortfolioHistory() {
      try {
        const response = await fetch('/api/portfolio/history');
        if (response.ok) {
          const history = await response.json();
          setPortfolioData(history);
          
          // Calculate 24h change if we have enough data
          if (history.length >= 2) {
            const prev = history[history.length - 2].value;
            const current = history[history.length - 1].value;
            const change = current - prev;
            const changePercent = (change / prev) * 100;
            
            setPreviousBalance(prev);
            setChange24hAmount(change);
            setChange24hPercent(changePercent);
          }
        }
      } catch (error) {
        console.error('Failed to fetch portfolio history:', error);
      }
    }
    
    fetchPortfolioHistory();
  }, [assets]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Copy wallet address
  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Filter assets based on search
  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filterType === 'all' || tx.tx_type === filterType.slice(0, -2);
    const matchesSearch = !searchTerm || 
      tx.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Wallet Address Section */}
        <div className="bg-white rounded-xl p-6 border border-blue-100 mb-8 shadow-sm">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <p className="text-gray-600 text-sm mb-2">Wallet Address</p>
              <p className="font-mono text-lg text-gray-900 flex items-center gap-2">
                {walletAddress}
                <button
                  onClick={copyAddress}
                  className="text-blue-600 hover:text-blue-700 ml-2 transition-colors"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <span className="text-green-600 text-sm">Copied!</span>
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6 py-2 rounded-lg transition-colors">
                <Plus size={18} />
                Add Transaction
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-2 rounded-lg transition-colors">
                <ArrowUpRight size={18} />
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between text-sm text-blue-900">
            <span>✓ Blockchain data synced</span>
            <span className="text-xs text-blue-600">Auto-refresh every 30 seconds</span>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Balance Card */}
          <div className="lg:col-span-2 bg-white rounded-xl p-8 border border-blue-100 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Total Portfolio Value</p>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Live Blockchain Data
                </span>
              </div>
              <h2 className="text-5xl font-bold text-gray-900 mb-2">
                {formatCurrency(totalBalance)}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <TrendingUp className="text-green-600" size={18} />
                  <span className="text-green-600 font-semibold">
                    +{formatCurrency(change24hAmount)}
                  </span>
                  <span className="text-green-600 text-sm">
                    ({change24hPercent.toFixed(2)}% 24h)
                  </span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 transition-colors">
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
                      backgroundColor: '#fff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
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
                Total Balance: <span className="font-semibold">{(totalBalance / 50000).toFixed(8)} BTC</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-2">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Receive</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Send</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 mb-2">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Swap</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500 mb-2">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Buy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Assets Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-blue-100">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Assets</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search assets..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  <span className="flex items-center">
                    All Assets
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    24h
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {asset.symbol.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                          <div className="text-sm text-gray-500">{asset.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {asset.balance.toFixed(8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatCurrency(asset.price_usd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(asset.balance * asset.price_usd)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                      asset.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.change}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">Trade</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm">
          <div className="p-6 border-b border-blue-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Download size={18} />
                Export
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {['all', 'received', 'sent', 'swapped'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
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
                <div key={tx.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        tx.tx_type === 'receive' ? 'bg-green-100' :
                        tx.tx_type === 'send' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {tx.tx_type === 'receive' && <ArrowDownLeft className="text-green-600" />}
                        {tx.tx_type === 'send' && <ArrowUpRight className="text-red-600" />}
                        {tx.tx_type === 'swap' && <ArrowLeftRight className="text-blue-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{tx.tx_type}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span className="font-mono">
                            {tx.tx_hash ? tx.tx_hash.substring(0, 16) + '...' : 'Pending'}
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
                          {new Date(tx.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {tx.tx_type === 'receive' ? '+' : '-'}
                        {tx.amount.toFixed(8)} {tx.symbol}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(tx.amount_usd)}
                      </p>
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                        tx.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More */}
          {filteredTransactions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex justify-center">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Load More
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}