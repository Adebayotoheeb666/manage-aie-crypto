import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: `${__dirname}/../.env` });

// Configuration
const API_URL = 'http://localhost:8080';
const TEST_SEED_PHRASE = 'test test test test test test test test test test test junk';

async function testWalletConnection() {
  try {
    console.log('=== Testing Wallet Connection ===');
    
    // 1. Derive wallet from test seed phrase
    const wallet = ethers.Wallet.fromPhrase(TEST_SEED_PHRASE);
    const walletAddress = wallet.address;
    console.log('Derived wallet address:', walletAddress);

    // 2. Connect wallet (seed phrase flow)
    console.log('\n=== Testing Seed Phrase Flow ===');
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/wallet-connect`,
        { walletAddress }
      );
      
      console.log('Response status:', response.status);
      console.log('User ID:', response.data.user?.id);
      console.log('Is new wallet?', response.data.isNewWallet);
      
      if (response.data.profile) {
        console.log('User profile created/retrieved successfully');
      }
      
      // 3. Test session
      const sessionResponse = await axios.get(
        `${API_URL}/api/auth/session`,
        { withCredentials: true }
      );
      
      console.log('\n=== Session Test ===');
      console.log('Session status:', sessionResponse.status);
      console.log('User authenticated:', !!sessionResponse.data.user);
      
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testWalletConnection().catch(console.error);
