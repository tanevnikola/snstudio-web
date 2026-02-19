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

// ── Function CRUD ─────────────────────────────────────────────

export function addFunction(name = 'New Function') {
  const fn = { id: crypto.randomUUID(), name, yaml: null };
  project.functions = [...project.functions, fn];
  persistProject();
  return fn;
}

export function removeFunction(functionId) {
  if (project.selectedFunctionId === functionId) {
    project.selectedFunctionId = null;
  }
  // Clear any service references to this function
  for (const actor of project.actors) {
    for (const service of actor.sections.services.items) {
      if (service.functionId === functionId) {
        service.functionId = null;
      }
    }
  }
  project.functions = project.functions.filter(f => f.id !== functionId);
  persistProject();
}

export function renameFunction(functionId, newName) {
  const fn = project.functions.find(f => f.id === functionId);
  if (fn) {
    fn.name = newName;
    persistProject();
  }
}

export function getFunctionYaml(functionId) {
  const fn = project.functions.find(f => f.id === functionId);
  return fn?.yaml ?? null;
}

export function updateFunctionYaml(functionId, yaml) {
  const fn = project.functions.find(f => f.id === functionId);
  if (fn) {
    fn.yaml = yaml;
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
