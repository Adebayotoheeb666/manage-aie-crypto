import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletButton } from '../WalletButton';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestWrapper } from '@/test/TestWrapper';

// Mock the useWalletSync hook
const mockSyncWalletBalances = vi.fn().mockResolvedValue({ success: true });
vi.mock('@/hooks/useWalletSync', () => ({
  useWalletSync: () => ({
    syncWalletBalances: mockSyncWalletBalances,
    loading: false,
    error: null,
  }),
}));

// Mock the useToast hook
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock the Lucide icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Loader2: (props: any) => <div data-testid="loader-icon" {...props} />,
    RefreshCw: (props: any) => <div data-testid="refresh-icon" {...props} />,
  };
});

describe('WalletButton', () => {
  const renderWalletButton = () => {
    return render(
      <TestWrapper>
        <WalletButton />
      </TestWrapper>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncWalletBalances.mockReset().mockResolvedValue({ success: true });
    mockToast.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the sync button', () => {
    renderWalletButton();
    expect(screen.getByRole('button', { name: /sync balances/i })).toBeInTheDocument();
  });

  it('calls syncWalletBalances with correct wallet ID when the button is clicked', async () => {
    mockSyncWalletBalances.mockResolvedValueOnce({ success: true });
    renderWalletButton();
    
    const button = screen.getByRole('button', { name: /sync balances/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSyncWalletBalances).toHaveBeenCalledTimes(1);
      expect(mockSyncWalletBalances).toHaveBeenCalledWith('test-wallet-id');
    });
  });

  it('shows loading state while syncing', async () => {
    // Mock a slow sync response
    mockSyncWalletBalances.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
    );
    
    renderWalletButton();
    
    const button = screen.getByRole('button', { name: /sync balances/i });
    fireEvent.click(button);
    
    // Should show loading state
    expect(button).toHaveTextContent('Syncing...');
    expect(button).toContainElement(screen.getByTestId('loader-icon'));
    
    // Wait for sync to complete
    await waitFor(() => {
      expect(button).toHaveTextContent('Sync Balances');
    });
  });

  it('handles sync error', async () => {
    const errorMessage = 'Failed to sync wallet';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock the sync to fail
    mockSyncWalletBalances.mockRejectedValueOnce(new Error(errorMessage));

    renderWalletButton();
    
    const button = screen.getByRole('button', { name: /sync balances/i });
    fireEvent.click(button);

    // Wait for the error handling to complete
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sync wallet:', expect.any(Error));
    });

    // Clean up
    consoleErrorSpy.mockRestore();
  });

  it('disables the button while syncing', async () => {
    // Create a promise that we can resolve later
    let resolveSync: (value: { success: boolean }) => void;
    const syncPromise = new Promise<{ success: boolean }>((resolve) => {
      resolveSync = resolve;
    });
    
    mockSyncWalletBalances.mockImplementationOnce(() => syncPromise);
    
    renderWalletButton();
    
    const button = screen.getByRole('button', { name: /sync balances/i });
    fireEvent.click(button);
    
    // Button should be disabled while syncing
    expect(button).toBeDisabled();
    
    // Resolve the sync
    resolveSync!({ success: true });
    
    // Wait for the sync to complete
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('shows loading state when syncing', async () => {
    let resolveSync: (value: any) => void;
    const syncPromise = new Promise(resolve => {
      resolveSync = resolve;
    });
    
    mockSyncWalletBalances.mockImplementationOnce(() => syncPromise);
    
    renderWalletButton();
    
    const button = screen.getByRole('button', { name: /sync balances/i });
    fireEvent.click(button);

    // Check if the button is disabled and shows loading state
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/syncing/i);
    
    // Resolve the promise to clean up
    resolveSync!({ success: true });
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('calls syncWalletBalances with the correct wallet ID', async () => {
    renderWalletButton();
    
    const button = screen.getByRole('button', { name: /sync balances/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSyncWalletBalances).toHaveBeenCalledWith('test-wallet-id');
    });
  });

  it('shows loading state while syncing', async () => {
    // Mock a promise that won't resolve immediately
    let resolveSync: (value: { success: boolean }) => void;
    const syncPromise = new Promise<{ success: boolean }>((resolve) => {
      resolveSync = resolve;
    });
    mockSyncWalletBalances.mockReturnValueOnce(syncPromise);

    renderWalletButton();
    
    const button = screen.getByRole('button', { name: /sync balances/i });
    fireEvent.click(button);

    // Should show loading state
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(button).toHaveTextContent(/syncing/i);
    
    // Resolve the promise to clean up
    resolveSync!({ success: true });
    await waitFor(() => {
      expect(button).not.toHaveTextContent(/syncing/i);
    });
  });
});
