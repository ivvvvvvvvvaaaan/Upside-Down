/**
 * ===========================================
 * SHARED SCRIPT UTILITIES
 * ===========================================
 * Common functions used across scripts
 */

import readline from 'readline'

// ANSI color codes
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
}

/**
 * Helper to wrap readline in a promise
 * @param {string} questionText - The question to display
 * @returns {Promise<string>} - The user's answer
 */
export function ask(questionText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(questionText, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

/**
 * Display a single-select menu and get user choice
 * @param {string} question - The question to display
 * @param {Array<{key: string, label: string, description?: string}>} options - Available options
 * @param {string} [defaultKey] - Default option key if user presses enter
 * @returns {Promise<string>} - Selected option key
 */
export async function askSelect(question, options, defaultKey) {
  console.log(`\n${colors.bright}${question}${colors.reset}\n`)

  options.forEach((opt, i) => {
    const num = i + 1
    const isDefault = opt.key === defaultKey
    const defaultMarker = isDefault ? ` ${colors.dim}(default)${colors.reset}` : ''
    const desc = opt.description ? `${colors.dim} - ${opt.description}${colors.reset}` : ''
    console.log(`  ${colors.cyan}${num}.${colors.reset} ${opt.label}${desc}${defaultMarker}`)
  })

  const defaultNum = defaultKey ? options.findIndex(o => o.key === defaultKey) + 1 : null
  const prompt = defaultNum ? `\nSelect (1-${options.length}) [${defaultNum}]: ` : `\nSelect (1-${options.length}): `

  const answer = await ask(prompt)

  if (!answer && defaultKey) {
    return defaultKey
  }

  const num = parseInt(answer, 10)
  if (num >= 1 && num <= options.length) {
    return options[num - 1].key
  }

  // Invalid input, try again
  console.log(`${colors.yellow}Please enter a number between 1 and ${options.length}${colors.reset}`)
  return askSelect(question, options, defaultKey)
}

/**
 * Display a multi-select menu and get user choices
 * @param {string} question - The question to display
 * @param {Array<{key: string, label: string, description?: string}>} options - Available options
 * @param {string[]} [defaultKeys] - Default selected keys
 * @returns {Promise<string[]>} - Array of selected option keys
 */
export async function askMultiSelect(question, options, defaultKeys = []) {
  console.log(`\n${colors.bright}${question}${colors.reset}`)
  console.log(`${colors.dim}Enter numbers separated by commas (e.g., 1,2,4)${colors.reset}\n`)

  options.forEach((opt, i) => {
    const num = i + 1
    const isDefault = defaultKeys.includes(opt.key)
    const defaultMarker = isDefault ? ` ${colors.green}*${colors.reset}` : ''
    const desc = opt.description ? `${colors.dim} - ${opt.description}${colors.reset}` : ''
    console.log(`  ${colors.cyan}${num}.${colors.reset} ${opt.label}${desc}${defaultMarker}`)
  })

  if (defaultKeys.length > 0) {
    const defaultNums = defaultKeys.map(k => options.findIndex(o => o.key === k) + 1).filter(n => n > 0)
    console.log(`\n${colors.dim}* = included by default (press Enter to accept)${colors.reset}`)
    var prompt = `\nSelect [${defaultNums.join(',')}]: `
  } else {
    var prompt = `\nSelect: `
  }

  const answer = await ask(prompt)

  // Use defaults if empty
  if (!answer && defaultKeys.length > 0) {
    return defaultKeys
  }

  if (!answer) {
    console.log(`${colors.yellow}Please select at least one option${colors.reset}`)
    return askMultiSelect(question, options, defaultKeys)
  }

  // Parse comma-separated numbers
  const nums = answer.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
  const validNums = nums.filter(n => n >= 1 && n <= options.length)

  if (validNums.length === 0) {
    console.log(`${colors.yellow}Please enter valid numbers between 1 and ${options.length}${colors.reset}`)
    return askMultiSelect(question, options, defaultKeys)
  }

  return validNums.map(n => options[n - 1].key)
}

/**
 * Convert a string to a URL-safe slug
 * @param {string} str - Input string
 * @returns {string} - Slugified string
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Convert a slug to Title Case
 * @param {string} slug - URL slug
 * @returns {string} - Title case string
 */
export function titleCase(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
