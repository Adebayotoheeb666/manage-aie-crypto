import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
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
  logo_url?: string;
}

interface Transaction {
  id: string;
  tx_hash: string;
  tx_type: 'send' | 'receive' | 'swap' | 'deposit' | 'withdrawal';
  amount: number;
  symbol: string;
  amount_usd: number;
  status: 'pending' | 'confirmed' | 'failed' | 'completed';
  created_at: string;
  from?: string;
  to?: string;
  fee?: number;
  fee_currency?: string;
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
      const response = await fetch('/api/wallet/assets', {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Failed to fetch assets: ${response.status} ${errorData.error || ''}`);
      }

      const data = await response.json();

      setAssets(data.assets || []);

      // Calculate total balance
      const balance = (data.assets || []).reduce((sum: number, asset: Asset) => sum + (asset.value_usd || 0), 0);
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
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  // Fetch portfolio history
  const fetchPortfolioHistory = async () => {
    try {
      const response = await fetch('/api/portfolio/history', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch portfolio history');
      const data = await response.json();
      setPortfolioData(data.history || []);
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

  // Get transaction status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'receive':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'swap':
        return <ArrowLeftRight className="w-5 h-5 text-blue-500" />;
      case 'deposit':
        return <Download className="w-5 h-5 text-purple-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-orange-500" />;
      default:
        return <ArrowLeftRight className="w-5 h-5 text-gray-500" />;
    }
  };

  // Filter transactions based on search and filter
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount?.toString().includes(searchTerm) ||
      tx.amount_usd?.toString().includes(searchTerm);
      
    const matchesType = filterType === 'all' || tx.tx_type === filterType;
    return matchesSearch && matchesType;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {dbUser?.email?.split('@')[0] || 'User'}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Balance</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className={`w-4 h-4 ${change24h >= 0 ? 'text-green-500' : 'text-red-500'} mr-1`} />
                <span className={`text-sm ${change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {change24h >= 0 ? '+' : ''}{change24hPercent.toFixed(2)}% ({formatCurrency(change24h)})
                </span>
                <span className="text-xs text-gray-500 ml-2">24h</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Assets</p>
              <p className="text-3xl font-bold mt-1">{assets.length}</p>
              <p className="text-sm text-gray-500 mt-2">Across all accounts</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Recent Transactions</p>
              <p className="text-3xl font-bold mt-1">
                {transactions.filter(tx => tx.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500 mt-2">Pending transactions</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <RefreshCw className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assets */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Assets</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
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
                      24h
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assets.length > 0 ? (
                    assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {asset.logo_url ? (
                              <img className="w-8 h-8 rounded-full mr-3" src={asset.logo_url} alt={asset.symbol} />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <span className="text-xs font-medium text-gray-500">{asset.symbol.substring(0, 2)}</span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                              <div className="text-sm text-gray-500">{asset.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {asset.balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(asset.price_usd)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${asset.change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.change_24h >= 0 ? '+' : ''}{asset.change_24h.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatCurrency(asset.value_usd)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No assets found. Connect a wallet to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Portfolio Chart */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Portfolio Value</h2>
              <div className="flex items-center space-x-2">
                <select 
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="7d"
                >
                  <option value="24h">24h</option>
                  <option value="7d">7d</option>
                  <option value="30d">30d</option>
                  <option value="90d">90d</option>
                  <option value="1y">1y</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            
            <div className="h-64">
              {portfolioData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={portfolioData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(Number(value)), 'Portfolio Value']}
                      labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No portfolio data available
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">24h Change</p>
                  <p className={`text-lg font-semibold ${change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change24h >= 0 ? '+' : ''}{formatCurrency(change24h)} ({change24h >= 0 ? '+' : ''}{change24hPercent.toFixed(2)}%)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">All Time High</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {portfolioData.length > 0 
                      ? formatCurrency(Math.max(...portfolioData.map(p => p.value)))
                      : formatCurrency(0)
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h2 className="text-lg font-semibold mb-4 md:mb-0">Recent Transactions</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="block w-full md:w-40 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-lg"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="all">All Types</option>
                <option value="send">Sent</option>
                <option value="receive">Received</option>
                <option value="swap">Swaps</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getTransactionIcon(tx.tx_type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {tx.tx_type.charAt(0).toUpperCase() + tx.tx_type.slice(1)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {tx.tx_hash ? `${tx.tx_hash.substring(0, 6)}...${tx.tx_hash.substring(tx.tx_hash.length - 4)}` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.tx_type === 'receive' 
                          ? 'bg-green-100 text-green-800' 
                          : tx.tx_type === 'send' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tx.tx_type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${
                      tx.tx_type === 'receive' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {tx.tx_type === 'receive' ? '+' : tx.tx_type === 'send' ? '-' : ''}
                      {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {tx.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(tx.amount_usd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filterType !== 'all' 
                      ? 'No transactions match your search criteria.' 
                      : 'No transactions found. Your transactions will appear here.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredTransactions.length}</span> of{' '}
              <span className="font-medium">{transactions.length}</span> transactions
            </div>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={true}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={true}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center">
          <div className="bg-blue-100 p-3 rounded-full mb-2">
            <ArrowDownLeft className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium">Receive</span>
        </button>
        <button className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center">
          <div className="bg-red-100 p-3 rounded-full mb-2">
            <ArrowUpRight className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-sm font-medium">Send</span>
        </button>
        <button className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center">
          <div className="bg-green-100 p-3 rounded-full mb-2">
            <ArrowLeftRight className="w-6 h-6 text-green-600" />
          </div>
          <span className="text-sm font-medium">Swap</span>
        </button>
        <button className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center">
          <div className="bg-purple-100 p-3 rounded-full mb-2">
            <Plus className="w-6 h-6 text-purple-600" />
          </div>
          <span className="text-sm font-medium">Buy Crypto</span>
        </button>
      </div>
    </div>
  );
}
