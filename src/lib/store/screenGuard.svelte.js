export const screenGuard = $state({
  isDirty: false,
  save: null, // async () => void
});

export function clearGuard() {
  screenGuard.isDirty = false;
  screenGuard.save = null;
}
