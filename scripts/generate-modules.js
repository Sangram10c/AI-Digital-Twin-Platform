/**
 * Generate backend module scaffold files.
 *
 * This script creates the standard module structure for all backend modules.
 * Run: node scripts/generate-modules.js
 */
const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '..', 'backend', 'src', 'modules');

const modules = [
  'auth', 'users', 'organizations', 'workspaces', 'github', 'google',
  'documents', 'uploads', 'ai', 'embeddings', 'search', 'knowledge',
  'memory', 'timeline', 'notifications', 'integrations', 'analytics',
  'settings', 'admin', 'health'
];

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toPascalCase(str) {
  return str.split('-').map(capitalize).join('');
}

function generateModule(name) {
  const pascal = toPascalCase(name);
  const dir = path.join(MODULES_DIR, name);

  // Create directories
  ['dto', 'interfaces', 'types', 'constants'].forEach(sub => {
    fs.mkdirSync(path.join(dir, sub), { recursive: true });
  });

  // Module file
  fs.writeFileSync(path.join(dir, `${name}.module.ts`),
`import { Module } from '@nestjs/common';
import { ${pascal}Controller } from './${name}.controller';
import { ${pascal}Service } from './${name}.service';

@Module({
  controllers: [${pascal}Controller],
  providers: [${pascal}Service],
  exports: [${pascal}Service],
})
export class ${pascal}Module {}
`);

  // Controller file
  fs.writeFileSync(path.join(dir, `${name}.controller.ts`),
`import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ${pascal}Service } from './${name}.service';

@ApiTags('${name}')
@Controller('${name}')
export class ${pascal}Controller {
  constructor(private readonly ${name}Service: ${pascal}Service) {}
}
`);

  // Service file
  fs.writeFileSync(path.join(dir, `${name}.service.ts`),
`import { Injectable } from '@nestjs/common';

@Injectable()
export class ${pascal}Service {}
`);

  // DTO index
  fs.writeFileSync(path.join(dir, 'dto', 'index.ts'),
`// ${pascal} DTOs
// Export DTOs here as they are created
`);

  // Interfaces index
  fs.writeFileSync(path.join(dir, 'interfaces', 'index.ts'),
`// ${pascal} Interfaces
// Export interfaces here as they are created
`);

  // Types index
  fs.writeFileSync(path.join(dir, 'types', 'index.ts'),
`// ${pascal} Types
// Export types here as they are created
`);

  // Constants index
  fs.writeFileSync(path.join(dir, 'constants', 'index.ts'),
`// ${pascal} Constants
// Export constants here as they are created
`);

  console.log(`  ✅ ${pascal}Module`);
}

console.log('🔧 Generating backend modules...\n');
modules.forEach(generateModule);
console.log(`\n✅ Generated ${modules.length} modules`);
