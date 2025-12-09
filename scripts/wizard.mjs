#!/usr/bin/env node

/**
 * Interactive Setup Wizard
 * Usage: npm run wizard
 */

import { spawn, execSync } from 'child_process'
import fs from 'fs'
import { ask } from './utils.mjs'

// ANSI Colors
const colors = {
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  reset: '\x1b[0m'
}

async function main() {
  console.clear()
  // Display more minimal or neutral title in prod
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    console.log(`${colors.bright}${colors.cyan}Prototype Factory${colors.reset}${colors.dim} v2.0${colors.reset}\n`);
  } else {
    console.log(
      colors.cyan + colors.bright +
      `
                          _    _           
      /\\  /\\__ ___      _| | _(_)_ __  ___ 
     / /_/ / _\` \\ \\ /\\ / / |/ / | '_ \\/ __|
    / __  / (_| |\\ V  V /|   <| | | | \\__ \\
    \\/ /_/ \\__,_| \\_/\\_/ |_|\\_\\_|_| |_|___/
                                                 
      ` +
      colors.reset + colors.dim + 'PROTOTYPE FACTORY v2.0' + colors.reset
    );
    }
    console.log('');

  // 1. Check First Run (node_modules)
  if (!fs.existsSync('node_modules')) {
    console.log('📦 First run detected. Installing dependencies...')
    try {
      execSync('npm install', { stdio: 'inherit' })
      console.log('✅ Dependencies installed.\n')
    } catch (e) {
      console.error('❌ Install failed.')
      process.exit(1)
    }
  }

  // 2. Ask Goal
  console.log('What would you like to do?')
  console.log('1. 👀 Just look around (Start server)')
  console.log('2. 🎨 Create a new prototype page')
  console.log('3. 💾 Deploy/Save changes')
  console.log('')

  const answer = await ask('Select (1-3) [1]: ')
  const choice = answer.trim() || '1'

  if (choice === '2') {
    // Run the new page generator
    await runScript('node', ['scripts/new-page.mjs'])
    
    // Ask if user wants to start server
    const startServer = await ask('\nStart development server to view your page? (Y/n): ')
    if (startServer.toLowerCase() === 'n') {
      console.log('\n✅ Page created! Run "npm run dev" when ready to view.')
      process.exit(0)
    }
  } else if (choice === '3') {
    // Run the save script
    await runScript('npm', ['run', 'save'])
    process.exit(0)
  }

  // 3. Start Server
  // Note: Next.js will auto-increment port (3001, 3002...) if 3000 is already in use
  console.log('\n🚀 Starting development server...')
  console.log('   (If port 3000 is busy, Next.js will use the next available port)\n')
  
  const server = spawn('npm', ['run', 'dev'], { stdio: 'inherit' })
  
  // Handle process signals to cleanup spawned server
  process.on('SIGINT', () => {
    server.kill('SIGINT')
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    server.kill('SIGTERM')
    process.exit(0)
  })
  
  server.on('close', (code) => {
    process.exit(code)
  })
}

function runScript(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command failed with code ${code}`))
    })
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
