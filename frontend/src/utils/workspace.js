// Helpers to derive views from the nested workspace tree loaded in the store.

export function allProjects(workspace) {
  return workspace?.projects || [];
}

export function allTasks(workspace) {
  return allProjects(workspace).flatMap((project) =>
    (project.tasks || []).map((task) => ({ ...task, project }))
  );
}
