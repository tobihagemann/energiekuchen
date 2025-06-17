import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreDependencies: [
    // ESLint packages - used in eslint.config.mjs but knip doesn't detect config file usage
    'eslint', // Required for ESLint to function
    'eslint-config-next', // Used via compat.extends('next/core-web-vitals', 'next/typescript')
    'eslint-config-prettier', // Used via compat.extends('prettier')

    // Tailwind CSS - used indirectly through @tailwindcss/postcss in postcss.config.mjs
    'tailwindcss', // Required by @tailwindcss/postcss in v4

    // TypeScript execution - required by Jest for processing TypeScript test files
    'ts-node', // Jest requires this to transform .ts test files
  ],
};

export default config;
