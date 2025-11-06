// Extend the global Window interface
declare interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request?: (request: { method: string; params?: Array<any> }) => Promise<any>;
    on?: (event: string, callback: (...args: any[]) => void) => void;
    removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    [key: string]: any;
  };
}

// Declare the global ethereum variable
declare const ethereum: Window['ethereum'];

// Extend the global namespace
declare global {
  // This allows us to extend the global namespace
  // without using the `export {}` syntax which would make this a module
  const ethereum: Window['ethereum'];
}
