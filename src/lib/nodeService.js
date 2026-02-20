/**
 * Node Service — tree walking utilities.
 *
 * Extends the node registry in specApi.js with tree traversal
 * operations that the rules engine and other consumers need.
 *
 * When we refactor, node CRUD operations will migrate here
 * from specApi.js. For now, only new utilities live here.
 */

import { getNode } from './specApi.js';

/**
 * Walk the node tree top-down from a given node, calling visitor
 * on each node with its accumulated context.
 *
 * The visitor receives (node, context) and returns the context
 * to propagate to children. If visitor returns undefined/null,
 * children are skipped.
 *
 * @param {string} nodeId — starting node
 * @param {function} visitor — (node, context) => childContext | null
 * @param {*} [context] — initial context for the root node
 */
export function walkDown(nodeId, visitor, context) {
  const node = getNode(nodeId);
  if (!node) return;

  const childContext = visitor(node, context);
  if (childContext == null) return;

  for (const kids of Object.values(node.children)) {
    for (const kid of kids) {
      walkDown(kid.id, visitor, childContext);
    }
  }
}
