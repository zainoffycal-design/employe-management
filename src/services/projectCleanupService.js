import { firebaseUtils } from '../utils/firebaseUtils';

const DEFAULT_IDENTIFIERS = ['Unknown', 'unknown', 'Unknown User', 'unknown user'];

const toIdentifierSet = (values = []) => {
  const identifierSet = new Set(DEFAULT_IDENTIFIERS);

  if (!Array.isArray(values)) {
    return identifierSet;
  }

  values.forEach((value) => {
    const cleaned = typeof value === 'string' ? value.trim() : value;
    if (cleaned) {
      identifierSet.add(cleaned);
    }
  });

  return identifierSet;
};

const filterAssignee = (assignee, identifiers) => {
  if (!assignee) return { changed: false, value: assignee };
  if (Array.isArray(assignee)) {
    const filtered = assignee
      .map((id) => (typeof id === 'string' ? id.trim() : id))
      .filter((id) => id && !identifiers.has(id));

    if (filtered.length === assignee.length) {
      return { changed: false, value: assignee };
    }
    return { changed: true, value: filtered.length > 0 ? filtered : null };
  }
  const normalized = typeof assignee === 'string' ? assignee.trim() : assignee;
  if (!normalized) {
    return { changed: true, value: null };
  }
  if (identifiers.has(normalized)) {
    return { changed: true, value: null };
  }
  return { changed: normalized !== assignee, value: normalized };
};

const filterReviews = (reviews, identifiers) => {
  if (!reviews || typeof reviews !== 'object') {
    return { changed: false, value: reviews };
  }

  const entries = Object.entries(reviews);
  if (entries.length === 0) {
    return { changed: false, value: reviews };
  }

  const filteredEntries = entries.filter(([assigneeId]) => {
    const normalizedId = typeof assigneeId === 'string' ? assigneeId.trim() : assigneeId;
    return normalizedId && !identifiers.has(normalizedId);
  });
  if (filteredEntries.length === entries.length) {
    return { changed: false, value: reviews };
  }

  if (filteredEntries.length === 0) {
    return { changed: true, value: null };
  }

  return {
    changed: true,
    value: filteredEntries.reduce((acc, [key, value]) => {
      const normalizedKey = typeof key === 'string' ? key.trim() : key;
      if (!normalizedKey) {
        return acc;
      }
      acc[normalizedKey] = value;
      return acc;
    }, {})
  };
};

export const unassignUsersFromProjectTasks = async (projectId, identifiers) => {
  const identifierSet = toIdentifierSet(identifiers);
  if (!projectId || identifierSet.size === 0) return;

  const tasks = await firebaseUtils.getDocuments(`projects/${projectId}/tasks`);

  await Promise.all(
    tasks.map(async (task) => {
      const { changed: assigneeChanged, value: assignee } = filterAssignee(task.assignee, identifierSet);
      const { changed: reviewsChanged, value: reviews } = filterReviews(task.reviews, identifierSet);

      if (!assigneeChanged && !reviewsChanged) {
        return;
      }

      const payload = {};
      if (assigneeChanged) {
        if (Array.isArray(assignee)) {
          payload.assignee = assignee.length > 0 ? assignee : null;
        } else {
          payload.assignee = assignee || null;
        }
      }
      if (reviewsChanged) {
        payload.reviews = reviews || null;
      }

      await firebaseUtils.updateDocument(`projects/${projectId}/tasks`, task.id, payload);
    })
  );
};

export const removeUsersFromProjects = async (identifiers) => {
  const identifierSet = toIdentifierSet(identifiers);
  if (identifierSet.size === 0) return;

  const projects = await firebaseUtils.getDocuments('projects');

  for (const project of projects) {
    let teamMembers = project.teamMembers;
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      const filteredMembers = teamMembers.filter((member) => !identifierSet.has(member));
      if (filteredMembers.length !== teamMembers.length) {
        await firebaseUtils.updateDocument('projects', project.id, { teamMembers: filteredMembers });
        teamMembers = filteredMembers;
      }
    }

    await unassignUsersFromProjectTasks(project.id, Array.from(identifierSet));
  }
};


