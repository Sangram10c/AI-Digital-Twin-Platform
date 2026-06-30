const path = require('path');

module.exports = {
  'frontend/**/*.{ts,tsx}': (filenames) => {
    const files = filenames.map((f) => path.relative('frontend', f)).join(' ');
    return [`cd frontend && npx eslint --fix ${files}`, `prettier --write ${filenames.join(' ')}`];
  },
  'backend/**/*.ts': (filenames) => {
    const files = filenames.map((f) => path.relative('backend', f)).join(' ');
    return [`cd backend && npx eslint --fix ${files}`, `prettier --write ${filenames.join(' ')}`];
  },
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
