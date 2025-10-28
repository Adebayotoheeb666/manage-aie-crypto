// ==========================================
// CRYPTOVAULT DATABASE TYPES
// ==========================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ==========================================
// USER TYPES
// ==========================================

export interface User {
  id: string;
  auth_id: string;
  email: string;
  username?: string;
  full_name?: string;
  profile_picture_url?: string;
  phone_number?: string;
  country?: string;
  is_verified: boolean;
  email_verified_at?: string;
  two_factor_enabled: boolean;
  preferred_currency: string;
  notification_preferences: NotificationPreferences;
  kyc_status: 'pending' | 'verified' | 'rejected';
  kyc_submitted_at?: string;
  kyc_verified_at?: string;
  account_status: 'active' | 'suspended' | 'closed';
  last_login?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface NotificationPreferences {
  email_on_transaction: boolean;
  email_on_withdrawal: boolean;
  email_on_price_alert: boolean;
  push_notifications: boolean;
}

// ==========================================
// SESSION TYPES
// ==========================================

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  last_activity: string;
  is_active: boolean;
  created_at: string;
}

// ==========================================
// WALLET TYPES
// ==========================================

export type WalletType = 'coinbase' | 'metamask' | 'ledger' | 'trezor';

export interface Wallet {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_type: WalletType;
  label?: string;
  is_primary: boolean;
  balance_usd: number;
  balance_btc: number;
  last_synced?: string;
  connected_at: string;
  disconnected_at?: string;
  is_active: boolean;
  metadata?: Json;
  created_at: string;
  updated_at: string;
}

// ==========================================
// ASSET TYPES
// ==========================================

export interface Asset {
  id: string;
  user_id: string;
  wallet_id: string;
  symbol: string;
  name: string;
  balance: number;
  balance_usd: number;
  price_usd?: number;
  price_change_24h?: number;
  price_change_7d?: number;
  price_change_30d?: number;
  chain?: string;
  contract_address?: string;
  last_synced?: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// TRANSACTION TYPES
// ==========================================

export type TransactionType = 'send' | 'receive' | 'swap' | 'stake' | 'unstake';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  tx_hash?: string;
  tx_type: TransactionType;
  symbol: string;
  amount: number;
  amount_usd?: number;
  from_address?: string;
  to_address?: string;
  fee_amount?: number;
  fee_usd?: number;
  status: TransactionStatus;
  confirmation_count: number;
  gas_price?: number;
  gas_used?: number;
  nonce?: number;
  block_number?: number;
  block_timestamp?: string;
  network?: string;
  notes?: string;
  metadata?: Json;
  created_at: string;
  updated_at: string;
}

// ==========================================
// PRICE HISTORY TYPES
// ==========================================

export interface PriceHistory {
  id: string;
  symbol: string;
  price_usd: number;
  price_change_24h?: number;
  market_cap?: number;
  volume_24h?: number;
  circulating_supply?: number;
  timestamp: string;
  source: string;
}

// ==========================================
// WITHDRAWAL REQUEST TYPES
// ==========================================

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  wallet_id: string;
  symbol: string;
  amount: number;
  amount_usd?: number;
  destination_address: string;
  network: string;
  fee_amount?: number;
  fee_usd?: number;
  status: WithdrawalStatus;
  tx_hash?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  email_verification_token?: string;
  email_verified_at?: string;
  two_factor_verified_at?: string;
  estimated_completion_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// PORTFOLIO SNAPSHOT TYPES
// ==========================================

export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  total_value_usd?: number;
  total_value_btc?: number;
  total_value_eth?: number;
  assets_count?: number;
  allocation_data?: Json;
  snapshot_date: string;
  created_at: string;
}

// ==========================================
// PRICE ALERT TYPES
// ==========================================

export type PriceAlertType = 'above' | 'below';

export interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  alert_type: PriceAlertType;
  target_price: number;
  is_active: boolean;
  triggered: boolean;
  triggered_at?: string;
  triggered_price?: number;
  created_at: string;
  updated_at: string;
}

// ==========================================
// AUDIT LOG TYPES
// ==========================================

export type AuditAction =
  | 'WALLET_CONNECTED'
  | 'WALLET_DISCONNECTED'
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_UPDATED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_STATUS_UPDATED'
  | 'CUSTOM_ACTION';

export interface AuditLog {
  id: string;
  user_id?: string;
  action: AuditAction;
  entity_type?: string;
  entity_id?: string;
  old_values?: Json;
  new_values?: Json;
  ip_address?: string;
  user_agent?: string;
  status: string;
  error_message?: string;
  created_at: string;
}

// ==========================================
// FUNCTION RETURN TYPES
// ==========================================

export interface PortfolioValue {
  total_usd: number;
  total_btc: number;
  total_eth: number;
}

export interface PortfolioChange {
  change_percentage: number;
  change_usd: number;
}

export interface TransactionSummary {
  tx_type: TransactionType;
  count: number;
  total_amount: number;
  total_usd: number;
}

export interface AllocationItem {
  symbol: string;
  balance: number;
  balance_usd: number;
  percentage: number;
}

// ==========================================
// DATABASE SCHEMA TYPE
// ==========================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at'>;
        Update: Partial<Omit<Session, 'id' | 'created_at'>>;
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Wallet, 'id' | 'created_at'>>;
      };
      assets: {
        Row: Asset;
        Insert: Omit<Asset, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Asset, 'id' | 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>;
      };
      price_history: {
        Row: PriceHistory;
        Insert: Omit<PriceHistory, 'id'>;
        Update: Partial<Omit<PriceHistory, 'id'>>;
      };
      withdrawal_requests: {
        Row: WithdrawalRequest;
        Insert: Omit<WithdrawalRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WithdrawalRequest, 'id' | 'created_at'>>;
      };
      portfolio_snapshots: {
        Row: PortfolioSnapshot;
        Insert: Omit<PortfolioSnapshot, 'id' | 'created_at'>;
        Update: Partial<Omit<PortfolioSnapshot, 'id' | 'created_at'>>;
      };
      price_alerts: {
        Row: PriceAlert;
        Insert: Omit<PriceAlert, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PriceAlert, 'id' | 'created_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never;
      };
    };
    Functions: {
      calculate_portfolio_value: {
        Args: { p_user_id: string };
        Returns: PortfolioValue;
      };
      get_portfolio_24h_change: {
        Args: { p_user_id: string };
        Returns: PortfolioChange;
      };
      get_transaction_summary: {
        Args: { p_user_id: string; p_days?: number };
        Returns: TransactionSummary[];
      };
      get_portfolio_allocation: {
        Args: { p_user_id: string };
        Returns: AllocationItem[];
      };
      update_asset_prices: {
        Args: {};
        Returns: { updated_count: number };
      };
      check_and_trigger_price_alerts: {
        Args: {};
        Returns: { triggered_count: number };
      };
      cleanup_expired_sessions: {
        Args: {};
        Returns: { deleted_count: number };
      };
      log_audit_event: {
        Args: {
          p_user_id: string;
          p_action: string;
          p_entity_type: string;
          p_entity_id: string;
          p_old_values?: Json;
          p_new_values?: Json;
          p_ip_address?: string;
          p_user_agent?: string;
        };
        Returns: string;
      };
    };
  };
}
