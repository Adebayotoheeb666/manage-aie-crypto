-- ==========================================
-- MIGRATION: Fix Wallet-Based Authentication
-- ==========================================
-- This migration makes auth_id nullable to support wallet-only users
-- who don't have entries in auth.users

-- Step 1: Make auth_id nullable (wallet users won't have auth.users entry)
ALTER TABLE public.users 
ALTER COLUMN auth_id DROP NOT NULL;

-- Step 2: Add primary_wallet_address for quick lookup
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS primary_wallet_address VARCHAR(255);

-- Step 3: Create index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_users_primary_wallet_address 
ON public.users(primary_wallet_address);

-- Step 4: Create unique constraint to prevent duplicate wallet users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_wallet 
ON public.users(primary_wallet_address) 
WHERE primary_wallet_address IS NOT NULL;

-- Step 5: Update RLS policies to support wallet users
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT 
  USING (
    auth_id = auth.uid() OR 
    primary_wallet_address IS NOT NULL
  );

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE 
  USING (
    auth_id = auth.uid() OR 
    primary_wallet_address IS NOT NULL
  );

-- Step 6: Add helpful function to find user by wallet or auth_id
-- Drop existing function if it exists to avoid type conflicts
DROP FUNCTION IF EXISTS get_user_by_identifier(TEXT);

CREATE OR REPLACE FUNCTION get_user_by_identifier(identifier TEXT)
RETURNS TABLE(
  id UUID,
  auth_id UUID,
  email TEXT,
  username TEXT,
  primary_wallet_address TEXT,
  account_status TEXT
) AS $$
BEGIN
  -- Check if identifier is a wallet address (starts with 0x and 42 chars)
  IF identifier ~ '^0x[a-fA-F0-9]{40}$' THEN
    RETURN QUERY
    SELECT 
      u.id::UUID, 
      u.auth_id::UUID, 
      u.email::TEXT, 
      u.username::TEXT, 
      u.primary_wallet_address::TEXT, 
      u.account_status::TEXT
    FROM public.users u
    WHERE u.primary_wallet_address = LOWER(identifier)
    LIMIT 1;
  ELSE
    -- Assume it's a UUID (auth_id)
    RETURN QUERY
    SELECT 
      u.id::UUID, 
      u.auth_id::UUID, 
      u.email::TEXT, 
      u.username::TEXT, 
      u.primary_wallet_address::TEXT, 
      u.account_status::TEXT
    FROM public.users u
    WHERE u.auth_id = identifier::UUID
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Verification queries
-- Check that auth_id is now nullable
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name IN ('auth_id', 'primary_wallet_address');

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Migration completed: Wallet-based authentication now supported';
  RAISE NOTICE 'Users can now authenticate with wallet addresses without auth.users entries';
END $$;
