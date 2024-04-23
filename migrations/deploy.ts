const anchor = require("@coral-xyz/anchor");
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Load the program from the workspace.
  const program = anchor.workspace.solana_carbon_contract; // Replace YourProgramName with your actual program name

  // Compile the program (optional step if not already compiled).
  // This step is usually done outside of the script via `anchor build`.

  // Deploy the program.
  console.log("Deploying program...");
  await program.deploy();

  // After deployment, you might want to initialize or set up your program,
  // which typically involves sending a transaction to your program's initialize
  // function.

  console.log("Program deployed successfully");
};
