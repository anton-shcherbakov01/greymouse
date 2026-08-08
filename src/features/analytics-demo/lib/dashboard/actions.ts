export const PROBLEM_ACTIONS_KEY = 'grey-mouse.analytics.problem-actions.v1'
export const PROBLEM_ACTIONS_EVENT = 'grey-mouse:problem-actions'

export type ProblemActionStatus = 'in_progress' | 'resolved'

export interface ProblemAction {
  issueId: string
  title: string
  target: string
  status: ProblemActionStatus
  createdAt: string
  updatedAt: string
}

export function updateProblemAction(
  actions: ProblemAction[],
  issue: { id: string; title: string; target: string },
  status: ProblemActionStatus,
  at: string,
): ProblemAction[] {
  const existing = actions.find((action) => action.issueId === issue.id)
  const next: ProblemAction = {
    issueId: issue.id,
    title: issue.title,
    target: issue.target,
    status,
    createdAt: existing?.createdAt ?? at,
    updatedAt: at,
  }
  return [next, ...actions.filter((action) => action.issueId !== issue.id)].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )
}

export function loadProblemActions(): ProblemAction[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(window.localStorage.getItem(PROBLEM_ACTIONS_KEY) ?? '[]') as unknown
    if (!Array.isArray(value)) return []
    return value
      .filter((item): item is ProblemAction => {
        if (!item || typeof item !== 'object') return false
        const action = item as Partial<ProblemAction>
        return (
          typeof action.issueId === 'string' &&
          typeof action.title === 'string' &&
          typeof action.target === 'string' &&
          (action.status === 'in_progress' || action.status === 'resolved') &&
          typeof action.createdAt === 'string' &&
          typeof action.updatedAt === 'string'
        )
      })
      .slice(0, 50)
  } catch {
    return []
  }
}

export function saveProblemActions(actions: ProblemAction[]): void {
  window.localStorage.setItem(PROBLEM_ACTIONS_KEY, JSON.stringify(actions.slice(0, 50)))
  window.dispatchEvent(new CustomEvent<ProblemAction[]>(PROBLEM_ACTIONS_EVENT, { detail: actions }))
}
