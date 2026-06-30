const path = require('path');

module.exports = {
  // Frontend TypeScript and TSX files
  'frontend/src/**/*.{ts,tsx}': (filenames) => {
    const relativeFiles = filenames.map((file) =>
      path.relative(path.join(process.cwd(), 'frontend'), file),
    );
    const escapedFiles = relativeFiles.map((f) => `"${f}"`).join(' ');
    return [
      `npm run --prefix frontend lint:fix -- ${escapedFiles}`,
      `npx prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
    ];
  },

  // Backend TypeScript files
  'backend/src/**/*.ts': (filenames) => {
    const relativeFiles = filenames.map((file) =>
      path.relative(path.join(process.cwd(), 'backend'), file),
    );
    const escapedFiles = relativeFiles.map((f) => `"${f}"`).join(' ');
    return [
      `npm run --prefix backend lint:fix -- ${escapedFiles}`,
      `npx prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
    ];
  },

  // Other configurations, documentation, stylesheet files
  '**/*.{js,jsx,json,md,css,scss,html,yaml,yml}': (filenames) => {
    const escapedFiles = filenames.map((f) => `"${f}"`).join(' ');
    return [`npx prettier --write ${escapedFiles}`];
  },
};
