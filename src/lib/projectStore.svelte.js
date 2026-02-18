const STORAGE_KEY = 'snstudio_project';

function createDefaultProject() {
  return {
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
    selectedActorId: null,
    selectedServiceId: null,
  };
}

function load() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors, fall back to defaults
  }
  return createDefaultProject();
}

export const project = $state(load());

export function persistProject() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(project));
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
  const service = { id: crypto.randomUUID(), name, yaml: null };
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

export function getServiceYaml(actorId, serviceId) {
  const actor = project.actors.find(a => a.id === actorId);
  if (!actor) return null;
  const service = actor.sections.services.items.find(s => s.id === serviceId);
  return service?.yaml ?? null;
}

export function updateServiceYaml(actorId, serviceId, yaml) {
  const actor = project.actors.find(a => a.id === actorId);
  if (!actor) return;
  const service = actor.sections.services.items.find(s => s.id === serviceId);
  if (service) {
    service.yaml = yaml;
    persistProject();
  }
}

// ── Selection ──────────────────────────────────────────────────

export function selectActor(actorId) {
  project.selectedActorId = actorId;
  project.selectedServiceId = null;
  persistProject();
}

export function selectService(actorId, serviceId) {
  project.selectedActorId = actorId;
  project.selectedServiceId = serviceId;
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
