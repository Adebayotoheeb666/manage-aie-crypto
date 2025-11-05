import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authMiddleware } from './middleware/auth';

const router = Router();

// Get user's assets
router.get('/assets', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    // Get user's wallets
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (walletsError) throw walletsError;

    // Get assets for each wallet
    const assetsPromises = wallets.map(async (wallet) => {
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('wallet_id', wallet.id);

      if (assetsError) throw assetsError;
      return assets || [];
    });

    const assetsResults = await Promise.all(assetsPromises);
    const allAssets = assetsResults.flat();

    // Get unique token addresses for price lookup
    const tokenAddresses = [...new Set(allAssets.map(asset => asset.token_address))];
    
    // Get token prices (mock implementation - replace with actual price API)
    const tokenPrices: Record<string, { usd: number; change_24h: number }> = {};
    for (const address of tokenAddresses) {
      // In a real implementation, you would fetch this from a price API
      tokenPrices[address] = {
        usd: Math.random() * 1000, // Mock price
        change_24h: (Math.random() * 20) - 10 // Random change between -10% and +10%
      };
    }

    // Calculate asset values and format response
    const formattedAssets = allAssets.map(asset => {
      const priceInfo = tokenPrices[asset.token_address] || { usd: 0, change_24h: 0 };
      const value = parseFloat(asset.balance) * priceInfo.usd;
      
      return {
        id: asset.id,
        symbol: asset.symbol || 'TOKEN',
        name: asset.name || 'Token',
        balance: parseFloat(asset.balance),
        price_usd: priceInfo.usd,
        change_24h: priceInfo.change_24h,
        value_usd: value,
        logo_url: asset.logo_url
      };
    });

    // Get portfolio history (last 30 days)
    const portfolioHistory = [];
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // In a real implementation, you would calculate the actual portfolio value for each day
      const dailyValue = formattedAssets.reduce((sum, asset) => {
        // Add some random variation to simulate market movement
        const variation = 1 + (Math.random() * 0.04 - 0.02); // ±2% daily variation
        return sum + (asset.value_usd * (i === 0 ? 1 : variation));
      }, 0);

      portfolioHistory.push({
        timestamp: date.toISOString().split('T')[0],
        value: Math.max(0, dailyValue) // Ensure value is not negative
      });
    }

    res.json({
      success: true,
      assets: formattedAssets,
      portfolio_history: portfolioHistory
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets',
      details: error.message
    });
  }
});

export default router;
