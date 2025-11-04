-- ==========================================
-- MIGRATION: Fix Function Return Type Mismatches
-- ==========================================
-- This fixes timestamp type mismatches in all functions
-- where they return TIMESTAMP but the columns are TIMESTAMP WITH TIME ZONE

-- Fix: calculate_portfolio_value function
DROP FUNCTION IF EXISTS calculate_portfolio_value(UUID);

CREATE OR REPLACE FUNCTION calculate_portfolio_value(p_user_id UUID)
RETURNS TABLE(total_usd DECIMAL, total_btc DECIMAL, total_eth DECIMAL, updated_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(a.balance_usd), 0::DECIMAL) as total_usd,
    COALESCE(SUM(CASE WHEN a.symbol = 'BTC' THEN a.balance ELSE 0 END), 0::DECIMAL) as total_btc,
    COALESCE(SUM(CASE WHEN a.symbol = 'ETH' THEN a.balance ELSE 0 END), 0::DECIMAL) as total_eth,
    MAX(a.updated_at) as updated_at
  FROM public.assets a
  WHERE a.user_id = p_user_id AND a.balance > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Restore permissions
GRANT EXECUTE ON FUNCTION calculate_portfolio_value(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION calculate_portfolio_value(UUID) IS 'Calculate total portfolio value in USD, BTC, and ETH';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Function types fixed: calculate_portfolio_value now returns TIMESTAMP WITH TIME ZONE';
END $$;
