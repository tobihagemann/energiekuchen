import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreDependencies: [
    // ESLint packages - used in eslint.config.mjs but knip doesn't detect config file usage
    'eslint-config-prettier', // Used via compat.extends('prettier')

    // TypeScript execution - required by Jest for processing TypeScript test files
    'ts-node', // Jest requires this to transform .ts test files
  ],
};

export default config;
