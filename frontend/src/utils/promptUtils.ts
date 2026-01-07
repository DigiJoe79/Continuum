/**
 * Utility functions for handling JSON-wrapped prompts
 * Used for Shot Types, Lighting Setups, and Styles which store prompts as {"core": "..."}
 */

/**
 * Extract the core value from a JSON prompt, or return the original string if not JSON
 */
export function extractCorePrompt(prompt: string | undefined | null): string {
  if (!prompt?.trim()) return ''

  try {
    const parsed = JSON.parse(prompt)
    if (typeof parsed === 'object' && typeof parsed.core === 'string') {
      return parsed.core
    }
  } catch {
    // Not valid JSON, return original
  }
  return prompt
}

/**
 * Wrap a plain text prompt in JSON format with core key
 */
export function wrapCorePrompt(text: string): string {
  return JSON.stringify({ core: text.trim() })
}

/**
 * Check if a prompt is in JSON format (has core key)
 */
export function isJsonPrompt(prompt: string | undefined | null): boolean {
  if (!prompt?.trim()) return false

  try {
    const parsed = JSON.parse(prompt)
    return typeof parsed === 'object' && typeof parsed.core === 'string'
  } catch {
    return false
  }
}

/**
 * Check if prompt has layered format (core + standard + detail)
 */
export function isLayeredPrompt(prompt: string | undefined | null): boolean {
  if (!prompt?.trim()) return false

  try {
    const parsed = JSON.parse(prompt)
    return (
      typeof parsed === 'object' &&
      typeof parsed.core === 'string' &&
      typeof parsed.standard === 'string' &&
      typeof parsed.detail === 'string'
    )
  } catch {
    return false
  }
}
