# 🥧 Energiekuchen

A visual energy management tool that helps users balance their daily energy sources and drains through interactive pie charts.

## What is Energiekuchen?

Energiekuchen is a client-side web application that serves as a visual coaching tool for energy management. Users can create dual pie charts to visualize:

- **⚡ Positive Energy Sources** (activities that give energy): sports, relaxation, time with friends
- **🔋 Energy Drains** (activities that consume energy): overtime work, stress, difficult conversations

The application helps identify energy imbalances and plan improvements to achieve better work-life balance.

## Getting Started

### Prerequisites

- Node.js 22.x or later
- npm 9.x or later

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run prod          # Build and start production server

# Code Quality
npm run lint          # Run TypeScript + ESLint + Prettier checks
npm run format        # Format code with Prettier + ESLint
npm run knip          # Check for unused dependencies, exports, and types

# Testing
npm run test          # Run unit tests
npm run test:coverage # Run tests with coverage report
npm run test:e2e      # Run end-to-end tests
npm run test:all      # Run all tests
```

## Deployment

The application is deployed as a static site on GitHub Pages at [energiekuchen.de](https://energiekuchen.de).

```bash
# Build for production
npm run build

# The built application creates static files in the 'out' directory
```

## License

Distributed under the MIT license. See the LICENSE file for more info.
