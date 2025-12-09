/**
 * ===========================================
 * SHARED SCRIPT UTILITIES
 * ===========================================
 * Common functions used across scripts
 */

import readline from 'readline'

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
