/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeDisabled(): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace?: boolean }): R;
    }
  }
}

export {};
