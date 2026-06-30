import * as vscode from 'vscode';

/**
 * AI Digital Twin Platform - VS Code Extension
 *
 * This extension will provide:
 * - AI-powered code assistance
 * - Digital twin workspace integration
 * - Real-time collaboration features
 * - Knowledge base access
 *
 * @module extension
 */

export function activate(context: vscode.ExtensionContext): void {
  console.log('AI Digital Twin extension is now active');

  const helloWorldCommand = vscode.commands.registerCommand(
    'ai-digital-twin.helloWorld',
    () => {
      vscode.window.showInformationMessage('Hello from AI Digital Twin!');
    },
  );

  context.subscriptions.push(helloWorldCommand);
}

export function deactivate(): void {
  // Cleanup resources
}
