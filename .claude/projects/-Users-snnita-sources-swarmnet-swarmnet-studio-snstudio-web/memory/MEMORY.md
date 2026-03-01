# Project Memory

## Function Builder - Root Block as Task.Chain

The root block in the function builder is always treated as a `Task.Chain`, even before any tasks are added.

In `initRoot()` (called on mount in `FunctionBuilder.svelte`), a `DomainFunction` node is created and immediately given `node.children['tasks'] = []`. This empty array makes `hasTasks` evaluate to `true` in `ComponentBlock.svelte`, causing the root to render as `Task.Chain` from the start.

Key files:
- `src/screens/function-builder/FunctionBuilder.svelte` — `initRoot()` sets up the root
- `src/screens/function-builder/ComponentBlock.svelte` — `hasTasks` flag drives the Task.Chain rendering branch
