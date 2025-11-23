import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Jest environment
global.TextEncoder = TextEncoder;
// @ts-expect-error - TextDecoder types don't match exactly but work fine
global.TextDecoder = TextDecoder;

// Mock localStorage with actual storage behavior
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  ArcElement: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));
