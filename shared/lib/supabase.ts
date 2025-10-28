import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@shared/types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// ==========================================
// PORTFOLIO FUNCTIONS
// ==========================================

export async function getPortfolioValue(userId: string) {
  const { data, error } = await supabase.rpc('calculate_portfolio_value', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
}

export async function getPortfolio24hChange(userId: string) {
  const { data, error } = await supabase.rpc('get_portfolio_24h_change', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
}

export async function getPortfolioAllocation(userId: string) {
  const { data, error } = await supabase.rpc('get_portfolio_allocation', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
}

// ==========================================
// TRANSACTION FUNCTIONS
// ==========================================

export async function getTransactionSummary(userId: string, days: number = 30) {
  const { data, error } = await supabase.rpc('get_transaction_summary', {
    p_user_id: userId,
    p_days: days,
  });

  if (error) throw error;
  return data;
}

export async function getTransactionHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function getTransactionByHash(txHash: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('tx_hash', txHash)
    .single();

  if (error) throw error;
  return data;
}

// ==========================================
// WALLET FUNCTIONS
// ==========================================

export async function getUserWallets(userId: string) {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPrimaryWallet(userId: string) {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function createWallet(
  userId: string,
  walletAddress: string,
  walletType: string,
  label?: string
) {
  const { data, error } = await supabase
    .from('wallets')
    .insert({
      user_id: userId,
      wallet_address: walletAddress,
      wallet_type: walletType,
      label,
      is_primary: false,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function disconnectWallet(walletId: string) {
  const { data, error } = await supabase
    .from('wallets')
    .update({
      is_active: false,
      disconnected_at: new Date().toISOString(),
    })
    .eq('id', walletId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================
// ASSET FUNCTIONS
// ==========================================

export async function getUserAssets(userId: string) {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', userId)
    .gt('balance', 0)
    .order('balance_usd', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getWalletAssets(walletId: string) {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('wallet_id', walletId)
    .gt('balance', 0)
    .order('balance_usd', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateAssetBalance(
  assetId: string,
  balance: number,
  priceUsd: number
) {
  const { data, error } = await supabase
    .from('assets')
    .update({
      balance,
      balance_usd: balance * priceUsd,
      price_usd: priceUsd,
      last_synced: new Date().toISOString(),
    })
    .eq('id', assetId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================
// WITHDRAWAL FUNCTIONS
// ==========================================

export async function createWithdrawalRequest(
  userId: string,
  walletId: string,
  symbol: string,
  amount: number,
  amountUsd: number,
  destinationAddress: string,
  network: string,
  feeAmount?: number,
  feeUsd?: number
) {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: userId,
      wallet_id: walletId,
      symbol,
      amount,
      amount_usd: amountUsd,
      destination_address: destinationAddress,
      network,
      fee_amount: feeAmount,
      fee_usd: feeUsd,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWithdrawalRequests(userId: string) {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: string,
  txHash?: string
) {
  const update: any = { status };
  if (txHash) update.tx_hash = txHash;
  if (status === 'completed') update.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .update(update)
    .eq('id', withdrawalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================
// PRICE HISTORY FUNCTIONS
// ==========================================

export async function getPriceHistory(
  symbol: string,
  daysBack: number = 30,
  limit: number = 1000
) {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('symbol', symbol)
    .gt('timestamp', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getLatestPrice(symbol: string) {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('symbol', symbol)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function insertPriceHistory(
  symbol: string,
  priceUsd: number,
  priceChange24h?: number,
  marketCap?: number,
  volume24h?: number,
  circulatingSupply?: number,
  source: string = 'coinbase'
) {
  const { data, error } = await supabase
    .from('price_history')
    .insert({
      symbol,
      price_usd: priceUsd,
      price_change_24h: priceChange24h,
      market_cap: marketCap,
      volume_24h: volume24h,
      circulating_supply: circulatingSupply,
      source,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================
// PRICE ALERT FUNCTIONS
// ==========================================

export async function createPriceAlert(
  userId: string,
  symbol: string,
  alertType: 'above' | 'below',
  targetPrice: number
) {
  const { data, error } = await supabase
    .from('price_alerts')
    .insert({
      user_id: userId,
      symbol,
      alert_type: alertType,
      target_price: targetPrice,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserPriceAlerts(userId: string, activeOnly: boolean = true) {
  const query = supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', userId);

  if (activeOnly) query.eq('is_active', true);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deletePriceAlert(alertId: string) {
  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', alertId);

  if (error) throw error;
  return true;
}

// ==========================================
// PORTFOLIO SNAPSHOT FUNCTIONS
// ==========================================

export async function createPortfolioSnapshot(
  userId: string,
  totalValueUsd: number,
  totalValueBtc: number,
  totalValueEth: number,
  assetsCount: number,
  allocationData?: any
) {
  const { data, error } = await supabase
    .from('portfolio_snapshots')
    .insert({
      user_id: userId,
      total_value_usd: totalValueUsd,
      total_value_btc: totalValueBtc,
      total_value_eth: totalValueEth,
      assets_count: assetsCount,
      allocation_data: allocationData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPortfolioSnapshots(userId: string, daysBack: number = 90) {
  const { data, error } = await supabase
    .from('portfolio_snapshots')
    .select('*')
    .eq('user_id', userId)
    .gt('snapshot_date', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('snapshot_date', { ascending: false });

  if (error) throw error;
  return data;
}

// ==========================================
// AUDIT LOG FUNCTIONS
// ==========================================

export async function getAuditLogs(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function logAuditEvent(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
) {
  const { data, error } = await supabase.rpc('log_audit_event', {
    p_user_id: userId,
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_old_values: oldValues,
    p_new_values: newValues,
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
  });

  if (error) throw error;
  return data;
}

// ==========================================
// USER FUNCTIONS
// ==========================================

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<any>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createUserProfile(userId: string, email: string, authId: string) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      auth_id: authId,
      email,
      account_status: 'active',
      is_verified: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================
// MAINTENANCE FUNCTIONS
// ==========================================

export async function updateAssetPrices() {
  const { data, error } = await supabase.rpc('update_asset_prices');

  if (error) throw error;
  return data;
}

export async function checkAndTriggerPriceAlerts() {
  const { data, error } = await supabase.rpc('check_and_trigger_price_alerts');

  if (error) throw error;
  return data;
}

export async function cleanupExpiredSessions() {
  const { data, error } = await supabase.rpc('cleanup_expired_sessions');

  if (error) throw error;
  return data;
}
