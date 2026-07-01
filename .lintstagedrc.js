const path = require('path');

module.exports = {
  // Frontend TypeScript and TSX files
  'apps/frontend/src/**/*.{ts,tsx}': (filenames) => {
    const relativeFiles = filenames.map((file) =>
      path.relative(path.join(process.cwd(), 'apps/frontend'), file),
    );
    const escapedFiles = relativeFiles.map((f) => `"${f}"`).join(' ');
    return [
      `npm run --prefix apps/frontend lint:fix -- ${escapedFiles}`,
      `npx prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
    ];
  },

  // Backend TypeScript files
  'apps/backend/src/**/*.ts': (filenames) => {
    const relativeFiles = filenames.map((file) =>
      path.relative(path.join(process.cwd(), 'apps/backend'), file),
    );
    const escapedFiles = relativeFiles.map((f) => `"${f}"`).join(' ');
    return [
      `npm run --prefix apps/backend lint:fix -- ${escapedFiles}`,
      `npx prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
    ];
  },

  // Other configurations, documentation, stylesheet files
  '**/*.{js,jsx,json,md,css,scss,html,yaml,yml}': (filenames) => {
    const filtered = filenames.filter((f) => !f.endsWith('package-lock.json'));
    if (filtered.length === 0) return [];
    const escapedFiles = filtered.map((f) => `"${f}"`).join(' ');
    return [`npx prettier --write ${escapedFiles}`];
  },
};
