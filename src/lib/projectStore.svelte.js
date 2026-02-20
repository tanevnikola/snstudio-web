function createDefaultProject() {
  return {
    sections: {
      actors: { collapsed: false },
      functions: { collapsed: false },
    },
    actors: [
      {
        id: crypto.randomUUID(),
        name: 'Actor 1',
        collapsed: false,
        sections: {
          services: { collapsed: false, items: [] },
        },
      },
    ],
    functions: [],
    selectedActorId: null,
    selectedServiceId: null,
    selectedFunctionId: null,
  };
}

function loadFromStorage(projectId) {
  try {
    const raw = localStorage.getItem(`snstudio_project_${projectId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors, fall back to defaults
  }
  return createDefaultProject();
}

let _currentProjectId = $state(null);
export const project = $state(createDefaultProject());

export function getCurrentProjectId() {
  return _currentProjectId;
}

export function loadProject(projectId) {
  _currentProjectId = projectId;
  const data = loadFromStorage(projectId);
  // Migration: ensure functions collection exists for older projects
  if (!data.functions) data.functions = [];
  if (!data.selectedFunctionId) data.selectedFunctionId = null;
  if (!data.sections.functions) data.sections.functions = { collapsed: false };
  Object.assign(project, data);
}

export function unloadProject() {
  _currentProjectId = null;
  const defaults = createDefaultProject();
  Object.assign(project, defaults);
}

export function persistProject() {
  if (!_currentProjectId) return;
  try {
    localStorage.setItem(`snstudio_project_${_currentProjectId}`, JSON.stringify(project));
  } catch {
    // ignore write errors (e.g. private browsing quota)
  }
}

// ── Actor CRUD ─────────────────────────────────────────────────

export function addActor(name = 'New Actor') {
  const actor = {
    id: crypto.randomUUID(),
    name,
    collapsed: false,
    sections: { services: { collapsed: false, items: [] } },
  };
  project.actors = [...project.actors, actor];
  persistProject();
  return actor;
}

export function removeActor(actorId) {
  if (project.selectedActorId === actorId) {
    project.selectedActorId = null;
    project.selectedServiceId = null;
  }
  project.actors = project.actors.filter(a => a.id !== actorId);
  persistProject();
}

export function renameActor(actorId, newName) {
  const actor = project.actors.find(a => a.id === actorId);
  if (actor) {
    actor.name = newName;
    persistProject();
  }
}

// ── Service CRUD ───────────────────────────────────────────────

export function addService(actorId, name = 'newService') {
  const actor = project.actors.find(a => a.id === actorId);
  if (!actor) return null;
  const service = { id: crypto.randomUUID(), name, functionId: null };
  actor.sections.services.items = [...actor.sections.services.items, service];
  persistProject();
  return service;
}

export function removeService(actorId, serviceId) {
  const actor = project.actors.find(a => a.id === actorId);
  if (!actor) return;
  if (project.selectedServiceId === serviceId) {
    project.selectedServiceId = null;
  }
  actor.sections.services.items = actor.sections.services.items.filter(s => s.id !== serviceId);
  persistProject();
}

export function renameService(actorId, serviceId, newName) {
  const actor = project.actors.find(a => a.id === actorId);
  if (!actor) return;
  const service = actor.sections.services.items.find(s => s.id === serviceId);
  if (service) {
    service.name = newName;
    persistProject();
  }
}

export function setServiceFunction(actorId, serviceId, functionId) {
  const actor = project.actors.find(a => a.id === actorId);
  if (!actor) return;
  const service = actor.sections.services.items.find(s => s.id === serviceId);
  if (service) {
    service.functionId = functionId;
    persistProject();
  }
}

// ── Function & Directory CRUD ──────────────────────────────────

// Find an item (function or directory) by id in a nested tree.
// Returns { item, parent } where parent is the containing array.
function findInTree(items, id) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) return { item: items[i], parent: items };
    if (items[i].type === 'directory' && items[i].children) {
      const found = findInTree(items[i].children, id);
      if (found) return found;
    }
  }
  return null;
}

// Collect all function ids in a subtree (for cleanup on directory delete)
function collectFunctionIds(items) {
  const ids = [];
  for (const item of items) {
    if (item.type === 'directory') ids.push(...collectFunctionIds(item.children || []));
    else ids.push(item.id);
  }
  return ids;
}

// Get all functions (flat) across the whole tree
export function getAllFunctions(items = project.functions) {
  const result = [];
  for (const item of items) {
    if (item.type === 'directory') result.push(...getAllFunctions(item.children || []));
    else result.push(item);
  }
  return result;
}

export function addFunction(name = 'New Function', parentDirId = null) {
  const fn = { id: crypto.randomUUID(), name, yaml: null };
  if (parentDirId) {
    const found = findInTree(project.functions, parentDirId);
    if (found && found.item.type === 'directory') {
      found.item.children = [...(found.item.children || []), fn];
    }
  } else {
    project.functions = [...project.functions, fn];
  }
  persistProject();
  return fn;
}

export function addDirectory(name = 'New Directory', parentDirId = null) {
  const dir = { id: crypto.randomUUID(), name, type: 'directory', collapsed: false, children: [] };
  if (parentDirId) {
    const found = findInTree(project.functions, parentDirId);
    if (found && found.item.type === 'directory') {
      found.item.children = [...(found.item.children || []), dir];
    }
  } else {
    project.functions = [...project.functions, dir];
  }
  persistProject();
  return dir;
}

export function removeFunction(functionId) {
  const found = findInTree(project.functions, functionId);
  if (!found) return;

  // Collect all function ids being removed (handles directory with children)
  const removedIds = found.item.type === 'directory'
    ? collectFunctionIds(found.item.children || [])
    : [functionId];

  if (removedIds.includes(project.selectedFunctionId)) {
    project.selectedFunctionId = null;
  }

  // Clear any service references to removed functions
  for (const id of removedIds) {
    for (const actor of project.actors) {
      for (const service of actor.sections.services.items) {
        if (service.functionId === id) {
          service.functionId = null;
        }
      }
    }
  }

  const idx = found.parent.indexOf(found.item);
  found.parent.splice(idx, 1);
  // Trigger reactivity
  project.functions = [...project.functions];
  persistProject();
}

export function renameFunction(functionId, newName) {
  const found = findInTree(project.functions, functionId);
  if (found) {
    found.item.name = newName;
    persistProject();
  }
}

export function getFunctionYaml(functionId) {
  const found = findInTree(project.functions, functionId);
  return found?.item?.yaml ?? null;
}

export function updateFunctionYaml(functionId, yaml) {
  const found = findInTree(project.functions, functionId);
  if (found && !found.item.type) {
    found.item.yaml = yaml;
    persistProject();
  }
}

// Get all directories (flat) with their path for display
export function getAllDirectories(items = project.functions, path = '') {
  const result = [];
  for (const item of items) {
    if (item.type === 'directory') {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      result.push({ id: item.id, name: item.name, path: fullPath });
      result.push(...getAllDirectories(item.children || [], fullPath));
    }
  }
  return result;
}

// Move a function or directory to a different parent (null = root)
export function moveFunction(itemId, targetDirId) {
  const found = findInTree(project.functions, itemId);
  if (!found) return;
  // Detach from current parent
  const idx = found.parent.indexOf(found.item);
  found.parent.splice(idx, 1);
  // Attach to target
  if (targetDirId) {
    const target = findInTree(project.functions, targetDirId);
    if (target && target.item.type === 'directory') {
      target.item.children = [...(target.item.children || []), found.item];
    }
  } else {
    project.functions = [...project.functions, found.item];
  }
  project.functions = [...project.functions];
  persistProject();
}

// Find which directory contains a given item (null = root)
export function getParentDirId(itemId, items = project.functions) {
  for (const item of items) {
    if (item.type === 'directory' && item.children) {
      if (item.children.some(c => c.id === itemId)) return item.id;
      const found = getParentDirId(itemId, item.children);
      if (found) return found;
    }
  }
  return null;
}

export function toggleDirectoryCollapsed(dirId) {
  const found = findInTree(project.functions, dirId);
  if (found && found.item.type === 'directory') {
    found.item.collapsed = !found.item.collapsed;
    persistProject();
  }
}

// ── Selection ──────────────────────────────────────────────────

export function selectActor(actorId) {
  project.selectedActorId = actorId;
  project.selectedServiceId = null;
  project.selectedFunctionId = null;
  persistProject();
}

export function selectService(actorId, serviceId) {
  project.selectedActorId = actorId;
  project.selectedServiceId = serviceId;
  project.selectedFunctionId = null;
  persistProject();
}

export function selectFunction(functionId) {
  project.selectedFunctionId = functionId;
  project.selectedActorId = null;
  project.selectedServiceId = null;
  persistProject();
}

// ── UI state ───────────────────────────────────────────────────

export function toggleActorCollapsed(actorId) {
  const actor = project.actors.find(a => a.id === actorId);
  if (actor) {
    actor.collapsed = !actor.collapsed;
    persistProject();
  }
}

export function toggleSectionCollapsed(actorId, sectionName) {
  const actor = project.actors.find(a => a.id === actorId);
  if (actor && actor.sections[sectionName]) {
    actor.sections[sectionName].collapsed = !actor.sections[sectionName].collapsed;
    persistProject();
  }
}

export function toggleProjectSectionCollapsed(sectionName) {
  if (project.sections[sectionName]) {
    project.sections[sectionName].collapsed = !project.sections[sectionName].collapsed;
    persistProject();
  }
}
