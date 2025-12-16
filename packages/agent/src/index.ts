// Main classifier
export {
  classifyActivity,
  classifyActivities,
  type ClassificationResult,
  type ClassificationOptions,
} from './classifier.js';

// Deduplication
export {
  checkDuplicate,
  findPotentialDuplicates,
  type DuplicateCheckResult,
  type ActivityIdentifier,
} from './deduplicator.js';

// Prompts (for inspection/debugging)
export { SYSTEM_PROMPT, buildClassificationPrompt, type ClassificationHints } from './prompt.js';

// Client utilities
export { complete, getAnthropicClient, resetClient, type CompletionOptions, type CompletionResult } from './client.js';
