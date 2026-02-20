/**
 * Rules Engine
 *
 * Sources of truth: YAML (node tree) + Specs (spec cache).
 * Rules read those truths, produce a Facts contract.
 * The UI ONLY reads the contract — no spec queries, no classification.
 *
 * Adding a rule:
 *   1. Write a named function: (input, context, facts) => void
 *   2. Append it to PARAM_RULES or NODE_RULES
 *   3. Add new fields to ParamFacts/NodeFacts if needed
 *   4. Add rendering mapping in the UI layer
 */

import { getNode, getSpecSync, isInjectionPoint, isNestedParam, isPrimitive } from './specApi.js';
import { walkDown } from './nodeService.js';

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const ARRAY_TYPE_RE = /\[\]$/;
const STRING_LIKE = ['String', 'Object'];

// ────────────────────────────────────────────
// Context — derived from the node tree (YAML)
// ────────────────────────────────────────────

/** @type {Map<string, {insideFactory: boolean}>} */
let _contexts = new Map();

/**
 * Build context for every node by walking the tree top-down.
 * Must be called whenever the tree structure or factory flags change.
 */
export function initialize(rootNodeId) {
  _contexts = new Map();
  walkDown(rootNodeId, (node, insideFactory) => {
    _contexts.set(node.id, Object.freeze({ insideFactory }));
    return insideFactory || node.factory === true;
  }, false);
}

function _getContext(nodeId) {
  return _contexts.get(nodeId) ?? { insideFactory: false };
}

// ────────────────────────────────────────────
// Facts — the contract between rules and UI
// ────────────────────────────────────────────

/**
 * ParamFacts — everything the UI needs to render a parameter.
 *
 * @typedef {Object} ParamFacts
 * @property {string}   editor       — 'mnemonic'|'inject-only'|'injection'|'boolean'|'enum'|'text'
 * @property {string|null} literalType — fallback literal editor when editor='injection': 'boolean'|'enum'|'text'|null
 * @property {string}   strategy     — 'DIRECT'|'MAP'|'COLLECTION'
 * @property {boolean}  canMultiline — text editor supports multiline toggle
 * @property {string[]} enumValues   — dropdown options for 'enum' editor
 * @property {string[]} concretes    — type options for 'mnemonic' editor
 * @property {boolean}  required     — show required marker
 * @property {*}        defaultValue — placeholder/default
 * @property {string}   mnemonic     — param's mnemonic (for display labels)
 */
function _defaultParamFacts() {
  return {
    editor: 'text',
    literalType: null,
    strategy: 'DIRECT',
    canMultiline: false,
    enumValues: [],
    concretes: [],
    required: false,
    defaultValue: null,
    mnemonic: '',
  };
}

/**
 * NodeFacts — everything the UI needs for the factory checkbox.
 *
 * @typedef {Object} NodeFacts
 * @property {boolean} mustFactory — forced to factory (checkbox locked on)
 * @property {boolean} canFactory  — factory checkbox available
 */
function _defaultNodeFacts() {
  return { mustFactory: false, canFactory: false };
}

// ────────────────────────────────────────────
// Internal state — used by rules, not in contract
// ────────────────────────────────────────────

function _defaultState() {
  return { _injectOnly: false, _canInject: false };
}

// ────────────────────────────────────────────
// Param Rules — business rules
// ────────────────────────────────────────────

/**
 * R1 — Array-type injection points are always InjectOnly.
 * No override. No exception. This rule wins over everything.
 */
function R1_arrayInjectOnly(param, _ctx, state) {
  if (isInjectionPoint(param) && ARRAY_TYPE_RE.test(param.mnemonic)) {
    state._injectOnly = true;
    state._canInject = true;
  }
}

/**
 * R2 — Injection availability based on eagerness and factory context.
 *
 * Non-eager injection points can always inject.
 * Eager injection points can inject ONLY inside factory context.
 * Outside factory, eager IPs get literal input only.
 *
 * Skips if R1 already resolved this param as injectOnly.
 */
function R2_eagerInjection(param, ctx, state) {
  if (state._injectOnly) return;
  if (!isInjectionPoint(param)) return;

  if (!param.eager) {
    state._canInject = true;
  } else if (ctx.insideFactory) {
    state._canInject = true;
  }
  // else: eager + not inside factory → _canInject stays false (literal only)
}

// ────────────────────────────────────────────
// Param Resolvers — derive contract fields from rules + spec data
// ────────────────────────────────────────────

/**
 * Resolve the editor type based on rule state and spec data.
 */
function R_editor(param, _ctx, state, facts) {
  // R1 already decided: inject-only
  if (state._injectOnly) {
    facts.editor = 'inject-only';
    return;
  }

  // Nested params (DomainFunction/DomainTask) — handled as canvas blocks, not in properties
  if (isNestedParam(param)) {
    facts.editor = 'nested';
    return;
  }

  // Check if this is a mnemonic type (complex type with implementations)
  if (!isPrimitive(param.mnemonic)) {
    const spec = getSpecSync(param.mnemonic);
    if (spec && spec.category !== 'ENUM') {
      facts.editor = 'mnemonic';
      return;
    }
  }

  // Injection point (non-eager, or eager inside factory)
  if (state._canInject) {
    facts.editor = 'injection';
    return;
  }

  // Literal types
  if (param.mnemonic === 'Boolean') {
    facts.editor = 'boolean';
    return;
  }

  const spec = getSpecSync(param.mnemonic);
  if (spec?.category === 'ENUM' && spec.constraints?.values) {
    facts.editor = 'enum';
    return;
  }

  facts.editor = 'text';
}

/**
 * Resolve the literal fallback type for 'injection' editor.
 * Also determines literal type for standalone literal editors.
 */
function R_literalType(param, _ctx, _state, facts) {
  if (facts.editor !== 'injection') return;

  if (param.mnemonic === 'Boolean') {
    facts.literalType = 'boolean';
    return;
  }

  const spec = getSpecSync(param.mnemonic);
  if (spec?.category === 'ENUM' && spec.constraints?.values) {
    facts.literalType = 'enum';
    return;
  }

  facts.literalType = 'text';
}

/**
 * Populate editor-specific data: enum values, concretes, multiline capability.
 */
function R_options(param, _ctx, _state, facts) {
  // Enum values
  if (facts.editor === 'enum' || facts.literalType === 'enum') {
    const spec = getSpecSync(param.mnemonic);
    facts.enumValues = spec?.constraints?.values ?? [];
  }

  // Concrete implementations for mnemonic type selector
  if (facts.editor === 'mnemonic') {
    facts.concretes = _collectConcretes(param.mnemonic);
  }

  // Multiline capability for string-like types
  if (facts.editor === 'text' || facts.literalType === 'text') {
    facts.canMultiline = STRING_LIKE.includes(param.mnemonic);
  }
}

/**
 * Populate display metadata from the param spec.
 */
function R_metadata(param, _ctx, _state, facts) {
  facts.strategy = param.injectionStrategy ?? 'DIRECT';
  facts.required = param.required === true;
  facts.defaultValue = param.defaultValue ?? null;
  facts.mnemonic = param.mnemonic ?? '';
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function _collectConcretes(mnemonic, seen = new Set()) {
  if (seen.has(mnemonic)) return [];
  seen.add(mnemonic);

  const spec = getSpecSync(mnemonic);
  if (!spec) return [];
  if (spec.category === 'CONCRETE') return [mnemonic];

  const result = [];
  for (const impl of spec.implementations ?? []) {
    result.push(..._collectConcretes(impl, seen));
  }
  return result;
}

// ────────────────────────────────────────────
// Node Rules
// ────────────────────────────────────────────

/**
 * R3 — A node must be factory if it has any eager injection-point
 *       param AND is not already inside a factory ancestor.
 *
 * R4 is embedded: if already insideFactory, the constraint is
 *       satisfied by the ancestor — no forcing needed.
 */
function R3_forceFactory(spec, ctx, facts) {
  if (ctx.insideFactory) return; // R4: ancestor already satisfies
  if (!spec?.parameters) return;

  const hasEagerIP = Object.values(spec.parameters).some(
    (p) => isInjectionPoint(p) && p.eager
  );

  if (hasEagerIP) {
    facts.mustFactory = true;
    facts.canFactory = true;
  }
}

/**
 * R5 — Any non-primitive node can optionally be set to factory.
 */
function R5_canFactory(_spec, _ctx, facts) {
  facts.canFactory = true;
}

// ────────────────────────────────────────────
// Pipelines — ordered, append new rules/resolvers at end
// ────────────────────────────────────────────

/** Business rules — set internal state flags */
const PARAM_RULES = [R1_arrayInjectOnly, R2_eagerInjection];

/** Resolvers — derive contract fields from state + spec data */
const PARAM_RESOLVERS = [R_editor, R_literalType, R_options, R_metadata];

const NODE_RULES = [R3_forceFactory, R5_canFactory];

// ────────────────────────────────────────────
// Public API — returns frozen Facts contracts
// ────────────────────────────────────────────

/**
 * Resolve the complete contract for a parameter.
 * The UI reads this and nothing else.
 *
 * @param {string} nodeId    — the node that owns this param
 * @param {string} paramName — the param name in the spec
 * @returns {Readonly<ParamFacts>}
 */
export function resolveParam(nodeId, paramName) {
  const ctx = _getContext(nodeId);
  const node = getNode(nodeId);
  const param = node?.spec?.parameters?.[paramName];
  if (!param) return Object.freeze(_defaultParamFacts());

  // Phase 1: business rules → internal state
  const state = _defaultState();
  for (const rule of PARAM_RULES) rule(param, ctx, state);

  // Phase 2: resolvers → contract fields (read state + spec data)
  const facts = _defaultParamFacts();
  for (const resolver of PARAM_RESOLVERS) resolver(param, ctx, state, facts);

  return Object.freeze(facts);
}

/**
 * Resolve the complete contract for a node.
 * The UI reads this and nothing else.
 *
 * @param {string} nodeId
 * @returns {Readonly<NodeFacts>}
 */
export function resolveNode(nodeId) {
  const ctx = _getContext(nodeId);
  const node = getNode(nodeId);
  if (!node) return Object.freeze(_defaultNodeFacts());

  const facts = _defaultNodeFacts();
  for (const rule of NODE_RULES) rule(node.spec, ctx, facts);
  return Object.freeze(facts);
}
