import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreDependencies: [
    // TypeScript execution - required by Jest for processing TypeScript test files
    'ts-node', // Jest requires this to transform .ts test files
  ],
};

export default config;
