You are reviewing the SocialMock project for bugs and issues. Focus on:

1. Read App.tsx and check for:
   - Missing dependencies in useCallback/useEffect dependency arrays
   - State mutations (direct mutation instead of setState)
   - Memory leaks (missing cleanup in useEffect)
   - Stale closures in event handlers

2. Read electron.cjs and check for:
   - Missing error handling in IPC handlers
   - File system operations without try/catch
   - Race conditions in async handlers

3. Read the new utility files (commands.ts, propertyTrack.ts, layerRegistry.ts, etc.) and check for:
   - Type safety issues
   - Edge cases in calculations
   - Missing null checks

Report findings with file path, line number, and fix suggestion.
