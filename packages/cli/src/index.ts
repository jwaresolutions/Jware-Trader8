#!/usr/bin/env node

import { createCLI } from './cli';
import { CLIErrorHandler } from './utils/error-handler';

async function main(): Promise<void> {
  try {
    // Setup global error handling
    CLIErrorHandler.setupGlobalErrorHandling();

    // Create and configure CLI
    const cli = createCLI();

    // Validate system requirements
    const systemValid = await cli.validateSystem();
    if (!systemValid) {
      process.exit(1);
    }

    // Check for updates/first run
    await cli.checkForUpdates();

    // Handle case where no command is provided
    if (process.argv.length <= 2) {
      cli.showHelp();
      return;
    }

    // Run the CLI with provided arguments
    await cli.run(process.argv);

  } catch (error) {
    CLIErrorHandler.handle(error);
  }
}

// Only run if this file is executed directly (not imported)
if (require.main === module) {
  main();
}

export { createCLI };
export * from './types/cli-types';
export * from './utils/error-handler';
export * from './utils/output-formatter';
export * from './utils/progress-indicator';
export * from './utils/prompt-handler';