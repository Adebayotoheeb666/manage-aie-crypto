# CryptoVault API Routes

Complete documentation of all available API endpoints.

## Authentication

All protected endpoints require an Authorization header with a Bearer token:

```bash
Authorization: Bearer <supabase-jwt-token>
```

Cron job endpoints require an X-API-Key header:

```bash
X-API-Key: <CRON_API_KEY>
```

---

## Withdrawal Routes

### `POST /api/withdraw` - Create Withdrawal Request

Create a new cryptocurrency withdrawal request.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "walletId": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "BTC",
  "amount": 0.5,
  "destinationAddress": "1A1z7agoat4xNAavZY2YoW6XwMEUpnqRDM",
  "network": "mainnet",
  "email": "user@example.com"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "amount": 0.5,
    "amountUsd": 21000.00,
    "fee": 0.005
  }
}
```

**Error Responses**:
- `400` - Invalid request data or insufficient balance
- `401` - Unauthorized (invalid or missing token)
- `403` - Wallet not found or doesn't belong to user
- `404` - User not found
- `500` - Server error

**Business Rules**:
- User must be authenticated
- Wallet must belong to the authenticated user
- Asset must exist in wallet
- Balance must be sufficient (amount + 1% fee)
- Fee is automatically calculated (1% of amount, minimum 0.0001)
- Withdrawal status starts as "pending"

---

## Price Routes

### `GET /api/prices?symbols=BTC,ETH` - Get Multiple Prices

Get current prices for multiple cryptocurrency symbols.

**Authentication**: Not required

**Query Parameters**:
- `symbols` (required): Comma-separated list of symbols (e.g., "BTC,ETH,USDC")
- Max 50 symbols per request

**Response**:
```json
{
  "success": true,
  "count": 2,
  "data": {
    "BTC": {
      "id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin",
      "price_usd": 42000,
      "price_change_24h": 2.5,
      "market_cap": 820000000000,
      "volume_24h": 28000000000,
      "circulating_supply": 21000000
    },
    "ETH": {
      "id": "ethereum",
      "symbol": "ETH",
      "name": "Ethereum",
      "price_usd": 2500,
      "price_change_24h": 1.8,
      "market_cap": 300000000000,
      "volume_24h": 15000000000,
      "circulating_supply": 120000000
    }
  }
}
```

**Error Responses**:
- `400` - Missing or invalid symbols parameter
- `500` - Failed to fetch prices

---

### `GET /api/prices/:symbol` - Get Single Price

Get current price for a single cryptocurrency symbol.

**Authentication**: Not required

**URL Parameters**:
- `symbol` (required): Cryptocurrency symbol (e.g., "BTC")

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "bitcoin",
    "symbol": "BTC",
    "name": "Bitcoin",
    "price_usd": 42000,
    "price_change_24h": 2.5,
    "market_cap": 820000000000,
    "volume_24h": 28000000000,
    "circulating_supply": 21000000
  }
}
```

**Error Responses**:
- `400` - Missing symbol parameter
- `404` - Price not found for symbol
- `500` - Failed to fetch price

---

### `POST /api/prices/update` - Update All Prices (Cron)

Update cryptocurrency prices for all symbols from CoinGecko API.

**Authentication**: Required (X-API-Key header)

**Headers**:
```bash
X-API-Key: <CRON_API_KEY>
```

**Request Body** (optional):
```json
{
  "symbols": ["BTC", "ETH", "USDT", "USDC", "ADA"]
}
```

**Response**:
```json
{
  "success": true,
  "updated": 10,
  "failed": 0,
  "message": "Updated 10 prices, 0 failed"
}
```

**Error Responses**:
- `401` - Unauthorized (invalid API key)
- `500` - Server error

**Notes**:
- Called periodically by cron jobs (every hour)
- Updates `price_history` table
- Automatically updates `assets` table with new prices
- Typical execution time: 10-20 seconds

---

### `POST /api/prices/alerts` - Check Price Alerts (Cron)

Check and trigger price alerts that have reached their target prices.

**Authentication**: Required (X-API-Key header)

**Headers**:
```bash
X-API-Key: <CRON_API_KEY>
```

**Response**:
```json
{
  "success": true,
  "triggered": 3,
  "message": "Triggered 3 price alerts"
}
```

**Error Responses**:
- `401` - Unauthorized (invalid API key)
- `500` - Server error

**Notes**:
- Called every 5 minutes
- Checks all active price alerts in database
- Sets `triggered = true` when target price is reached
- Disables alert after triggering
- Typical execution time: 5-10 seconds

---

## Maintenance Routes

### `POST /api/maintenance/cleanup-sessions` - Cleanup Sessions (Cron)

Remove expired and old inactive user sessions.

**Authentication**: Required (X-API-Key header)

**Headers**:
```bash
X-API-Key: <CRON_API_KEY>
```

**Response**:
```json
{
  "success": true,
  "cleaned": 42,
  "message": "Cleaned up 42 expired sessions"
}
```

**Error Responses**:
- `401` - Unauthorized (invalid API key)
- `500` - Server error

**Notes**:
- Called daily at 2 AM UTC
- Removes sessions older than 7 days
- Typical execution time: 5 seconds

---

### `POST /api/maintenance/unlock-accounts` - Unlock Accounts (Cron)

Unlock user accounts that have been locked due to excessive failed login attempts.

**Authentication**: Required (X-API-Key header)

**Headers**:
```bash
X-API-Key: <CRON_API_KEY>
```

**Response**:
```json
{
  "success": true,
  "cleaned": 5,
  "message": "Unlocked 5 accounts"
}
```

**Error Responses**:
- `401` - Unauthorized (invalid API key)
- `500` - Server error

**Notes**:
- Called hourly
- Unlocks accounts where lock period has expired (30 minutes)
- Resets `failed_login_attempts` counter to 0
- Typical execution time: 3 seconds

---

### `POST /api/maintenance/lock-accounts` - Lock Accounts (Cron)

Lock user accounts with excessive failed login attempts.

**Authentication**: Required (X-API-Key header)

**Headers**:
```bash
X-API-Key: <CRON_API_KEY>
```

**Response**:
```json
{
  "success": true,
  "cleaned": 2,
  "message": "Locked 2 accounts due to excessive login attempts"
}
```

**Error Responses**:
- `401` - Unauthorized (invalid API key)
- `500` - Server error

**Notes**:
- Called every 10 minutes
- Locks accounts with 5+ failed login attempts
- Lock duration: 30 minutes
- Typical execution time: 3 seconds

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (withdrawal request created)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token/API key)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

- Withdrawal requests: No explicit limit (Supabase RLS enforced)
- Price requests: No explicit limit (CoinGecko API limits apply)
- Cron endpoints: Limited to X-API-Key authentication

---

## Examples

### Create a Withdrawal (Using JavaScript):

```javascript
const token = "your-jwt-token";
const response = await fetch("/api/withdraw", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    walletId: "550e8400-e29b-41d4-a716-446655440000",
    symbol: "BTC",
    amount: 0.5,
    destinationAddress: "1A1z7agoat4xNAavZY2YoW6XwMEUpnqRDM",
    network: "mainnet",
    email: "user@example.com",
  }),
});

const data = await response.json();
console.log(data);
```

### Get Bitcoin Price (Using curl):

```bash
curl -X GET "https://yourdomain.com/api/prices/BTC" \
  -H "Content-Type: application/json"
```

### Trigger Price Update (Using curl):

```bash
curl -X POST "https://yourdomain.com/api/prices/update" \
  -H "X-API-Key: your-cron-api-key" \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["BTC", "ETH"]}'
```

---

## See Also

- [CRON_SETUP.md](./CRON_SETUP.md) - Cron job configuration guide
- [Supabase Schema](../supabase/schema.sql) - Database schema
- [Environment Variables](../.env.example) - Required configuration
