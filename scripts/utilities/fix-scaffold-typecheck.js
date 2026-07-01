/**
 * Script to fix TypeScript strict compile errors in skeleton files.
 */
const fs = require('fs');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, '..', 'backend', 'src');

console.log('🔧 Fixing compiler strict typecheck issues in backend skeleton...\n');

// 1. Fix events.gateway.ts `@WebSocketServer() server: Server;` -> `server!: Server;`
const gatewayPath = path.join(BACKEND_DIR, 'gateway', 'events.gateway.ts');
if (fs.existsSync(gatewayPath)) {
  let content = fs.readFileSync(gatewayPath, 'utf8');
  content = content.replace('server: Server;', 'server!: Server;');
  fs.writeFileSync(gatewayPath, content);
  console.log('  ✅ Fixed events.gateway.ts server assertion.');
}

// 2. Fix modules/auth/dto/index.ts (definite assignment assertions for input properties)
const authDtoPath = path.join(BACKEND_DIR, 'modules', 'auth', 'dto', 'index.ts');
if (fs.existsSync(authDtoPath)) {
  let content = fs.readFileSync(authDtoPath, 'utf8');
  content = content.replace('email: string;', 'email!: string;');
  content = content.replace('password: string;', 'password!: string;');
  content = content.replace('name: string;', 'name!: string;');
  content = content.replace('email: string;', 'email!: string;');
  content = content.replace('password: string;', 'password!: string;');
  fs.writeFileSync(authDtoPath, content);
  console.log('  ✅ Fixed auth/dto/index.ts properties.');
}

// 3. Fix unused constructor injections and unused imports in empty placeholder controllers
const modulesDir = path.join(BACKEND_DIR, 'modules');
const modules = fs.readdirSync(modulesDir);

modules.forEach((mod) => {
  const controllerPath = path.join(modulesDir, mod, `${mod}.controller.ts`);
  if (fs.existsSync(controllerPath)) {
    let content = fs.readFileSync(controllerPath, 'utf8');
    const pascalName = mod
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

    // Clean constructor if present
    const constructorRegex = new RegExp(
      `constructor\\(private readonly ${mod}Service: ${pascalName}Service\\) \\{\\}`,
    );
    if (constructorRegex.test(content)) {
      content = content.replace(constructorRegex, 'constructor() {}');
    } else {
      // Also catch any previously modified constructor
      content = content.replace(/constructor\(\) \{\}/, 'constructor() {}');
    }

    // Clean import if present
    const importRegex = new RegExp(
      `import \\{ ${pascalName}Service \\} from '\\./${mod}.service';\\r?\\n`,
    );
    if (importRegex.test(content)) {
      content = content.replace(importRegex, '');
      console.log(`  ✅ Cleaned unused import and injection in ${mod}.controller.ts`);
    }

    fs.writeFileSync(controllerPath, content);
  }
});

console.log('\n🎉 Finished compilation fixes!');
