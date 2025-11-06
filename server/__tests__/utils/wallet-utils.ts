import { Wallet, HDNodeWallet, Mnemonic } from 'ethers';

export interface TestWallet {
  address: string;
  privateKey: string;
  mnemonic: string;
}

/**
 * Generates a new test wallet with a random mnemonic
 * @returns A new test wallet with address, private key, and mnemonic
 */
export function generateTestWallet(): TestWallet {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || ''
  };
}

/**
 * Creates a test wallet from a mnemonic
 * @param mnemonic - The mnemonic to create the wallet from
 * @returns A test wallet with address and private key
 */
export function getWalletFromMnemonic(mnemonic: string): TestWallet {
  const wallet = HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(mnemonic));
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: mnemonic
  };
}

/**
 * Signs a message with a test wallet
 * @param message - The message to sign
 * @param privateKey - The private key to sign with
 * @returns The signature
 */
export async function signMessage(message: string, privateKey: string): Promise<string> {
  const wallet = new Wallet(privateKey);
  return wallet.signMessage(message);
}

// Export a default test wallet for convenience
export const testWallet = generateTestWallet();
