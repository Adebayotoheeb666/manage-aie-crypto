-- ==========================================
-- TEST DATA SETUP
-- ==========================================

-- Create a test user
INSERT INTO users (
  id, email, username, full_name, is_verified, account_status, created_at
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  'testuser@example.com',
  'testuser',
  'Test User',
  true,
  'active',
  CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Create a wallet for the test user
INSERT INTO wallets (
  id, user_id, wallet_address, wallet_type, label, is_primary, is_active, connected_at
)
VALUES (
  '223e4567-e89b-12d3-a456-426614174000'::UUID,
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  '0xdf12925e53b8638e2ddbf4b0c64d4635609388ab',
  'metamask',
  'Primary Wallet',
  true,
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Create test assets
INSERT INTO assets (
  id, user_id, wallet_id, symbol, name, balance, balance_usd, price_usd, price_change_24h, created_at
)
VALUES
  (
    '323e4567-e89b-12d3-a456-426614174000'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'BTC',
    'Bitcoin',
    0.5,
    21625.00,
    43250.00,
    2.5,
    CURRENT_TIMESTAMP
  ),
  (
    '323e4567-e89b-12d3-a456-426614174001'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'ETH',
    'Ethereum',
    5.0,
    11402.50,
    2280.50,
    -0.8,
    CURRENT_TIMESTAMP
  ),
  (
    '323e4567-e89b-12d3-a456-426614174002'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'USDC',
    'USD Coin',
    5000.0,
    5000.00,
    1.00,
    0.0,
    CURRENT_TIMESTAMP
  ),
  (
    '323e4567-e89b-12d3-a456-426614174003'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'SOL',
    'Solana',
    25.0,
    2718.75,
    108.75,
    1.2,
    CURRENT_TIMESTAMP
  ),
  (
    '323e4567-e89b-12d3-a456-426614174004'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'DOGE',
    'Dogecoin',
    1000.0,
    380.00,
    0.38,
    5.2,
    CURRENT_TIMESTAMP
  )
ON CONFLICT DO NOTHING;

-- Create test transactions (receive)
INSERT INTO transactions (
  id, user_id, wallet_id, tx_type, symbol, amount, amount_usd, 
  tx_hash, from_address, to_address, status, created_at
)
VALUES
  (
    '423e4567-e89b-12d3-a456-426614174000'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'receive',
    'BTC',
    0.5,
    21625.00,
    '0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1',
    '0x0000000000000000000000000000000000000000',
    '0xdf12925e53b8638e2ddbf4b0c64d4635609388ab',
    'confirmed',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
  ),
  (
    '423e4567-e89b-12d3-a456-426614174001'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'receive',
    'ETH',
    5.0,
    11402.50,
    '0xb2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    '0x0000000000000000000000000000000000000000',
    '0xdf12925e53b8638e2ddbf4b0c64d4635609388ab',
    'confirmed',
    CURRENT_TIMESTAMP - INTERVAL '4 days'
  ),
  (
    '423e4567-e89b-12d3-a456-426614174002'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'receive',
    'USDC',
    5000.0,
    5000.00,
    '0xc3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3',
    '0x0000000000000000000000000000000000000000',
    '0xdf12925e53b8638e2ddbf4b0c64d4635609388ab',
    'confirmed',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
  ),
  (
    '423e4567-e89b-12d3-a456-426614174003'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'receive',
    'SOL',
    25.0,
    2718.75,
    '0xd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4',
    '0x0000000000000000000000000000000000000000',
    '0xdf12925e53b8638e2ddbf4b0c64d4635609388ab',
    'confirmed',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
  ),
  (
    '423e4567-e89b-12d3-a456-426614174004'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'receive',
    'DOGE',
    1000.0,
    380.00,
    '0xe5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5',
    '0x0000000000000000000000000000000000000000',
    '0xdf12925e53b8638e2ddbf4b0c64d4635609388ab',
    'confirmed',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;

-- Create test transactions (send)
INSERT INTO transactions (
  id, user_id, wallet_id, tx_type, symbol, amount, amount_usd, fee_amount, fee_usd,
  tx_hash, from_address, to_address, status, created_at
)
VALUES
  (
    '523e4567-e89b-12d3-a456-426614174000'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'send',
    'ETH',
    1.0,
    2280.50,
    0.001,
    2.28,
    '0xf6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6',
    '0xdf12925e53b8638e2ddbf4b0c64d4635609388ab',
    '0x1234567890123456789012345678901234567890',
    'confirmed',
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
  ),
  (
    '523e4567-e89b-12d3-a456-426614174001'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'send',
    'USDC',
    500.0,
    500.00,
    1.0,
    1.00,
    '0xg7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7',
    '0xdf12925e53b8638e2ddbf4b0c64d4635609388ab',
    '0x1234567890123456789012345678901234567890',
    'confirmed',
    CURRENT_TIMESTAMP - INTERVAL '3 hours'
  )
ON CONFLICT DO NOTHING;

-- Create test transactions (swap)
INSERT INTO transactions (
  id, user_id, wallet_id, tx_type, symbol, amount, amount_usd, fee_amount, fee_usd,
  tx_hash, from_address, status, created_at
)
VALUES
  (
    '623e4567-e89b-12d3-a456-426614174000'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    '223e4567-e89b-12d3-a456-426614174000'::UUID,
    'swap',
    'BTC',
    0.1,
    4325.00,
    0.0005,
    21.63,
    '0xh8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8',
    '0xdf12925e53b8638e2ddbf4b0c64d4635609388ab',
    'pending',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes'
  )
ON CONFLICT DO NOTHING;

-- Create portfolio snapshots (historical data for chart)
INSERT INTO portfolio_snapshots (
  id, user_id, total_value_usd, total_value_btc, total_value_eth, 
  assets_count, snapshot_date
)
VALUES
  (
    '723e4567-e89b-12d3-a456-426614174000'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    36000.00,
    0.83,
    15.77,
    4,
    CURRENT_TIMESTAMP - INTERVAL '6 days'
  ),
  (
    '723e4567-e89b-12d3-a456-426614174001'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    37500.00,
    0.87,
    16.43,
    4,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
  ),
  (
    '723e4567-e89b-12d3-a456-426614174002'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    38200.00,
    0.88,
    16.75,
    5,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
  ),
  (
    '723e4567-e89b-12d3-a456-426614174003'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    39500.00,
    0.91,
    17.31,
    5,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
  ),
  (
    '723e4567-e89b-12d3-a456-426614174004'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    40100.00,
    0.93,
    17.57,
    5,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
  ),
  (
    '723e4567-e89b-12d3-a456-426614174005'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    40750.00,
    0.94,
    17.88,
    5,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
  ),
  (
    '723e4567-e89b-12d3-a456-426614174006'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    41126.25,
    0.95,
    18.03,
    5,
    CURRENT_TIMESTAMP
  )
ON CONFLICT DO NOTHING;

-- Create sample price alerts
INSERT INTO price_alerts (
  id, user_id, symbol, alert_type, target_price, is_active, created_at
)
VALUES
  (
    '823e4567-e89b-12d3-a456-426614174000'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    'BTC',
    'above',
    50000.00,
    true,
    CURRENT_TIMESTAMP
  ),
  (
    '823e4567-e89b-12d3-a456-426614174001'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    'ETH',
    'below',
    2000.00,
    true,
    CURRENT_TIMESTAMP
  ),
  (
    '823e4567-e89b-12d3-a456-426614174002'::UUID,
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    'SOL',
    'above',
    150.00,
    true,
    CURRENT_TIMESTAMP
  )
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Wallets', COUNT(*) FROM wallets
UNION ALL
SELECT 'Assets', COUNT(*) FROM assets
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Price Alerts', COUNT(*) FROM price_alerts
UNION ALL
SELECT 'Portfolio Snapshots', COUNT(*) FROM portfolio_snapshots;
