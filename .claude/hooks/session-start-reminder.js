#!/usr/bin/env node
/*
 * SessionStart hook — railapp project.
 * Injects the workflow reminder (custom subagents + documenter) into Claude's
 * context at the start of every session. Wired up in .claude/settings.json.
 * Runs under both PowerShell and bash because it's invoked via `node`.
 */

const reminder = [
  'WORKFLOW REMINDER — railapp project (auto-injected every session):',
  '',
  'Use the custom subagents in .claude/agents/ for every non-trivial task —',
  'do NOT do this work inline:',
  '  - BEFORE coding: researcher (explore codebase, gather context); when the',
  '    solution space is open, brainstormer (generate options) before architect',
  '    (design the implementation plan).',
  '  - DURING: builder (implement, following existing patterns).',
  '  - AFTER: code-reviewer (bugs + quality), security-reviewer (fast security',
  '    pass), tester (validate + edge cases), documenter (sync documentation).',
  '  - DEEP AUDIT (on demand, auth-critical code): security-auditor',
  '    (slower + more thorough than security-reviewer).',
  '',
  'After ANY code change: run the documenter agent AND update the memory files',
  '(MEMORY.md + memory/) before ending the session.',
].join('\n');

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: reminder,
    },
  })
);
