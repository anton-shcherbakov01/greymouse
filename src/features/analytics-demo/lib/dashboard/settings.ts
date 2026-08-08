export const WORKSPACE_SETTINGS_KEY = 'grey-mouse.analytics.workspace.v1'
export const WORKSPACE_SETTINGS_EVENT = 'grey-mouse:workspace-settings'

export interface WorkspaceSettings {
  company: string
  timezone: 'moscow' | 'ekb'
  dailyDigest: boolean
  riskMonitoring: boolean
  systemTheme: boolean
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  company: 'Вектор Трейд',
  timezone: 'moscow',
  dailyDigest: true,
  riskMonitoring: true,
  systemTheme: false,
}

export function loadWorkspaceSettings(): WorkspaceSettings {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACE_SETTINGS
  try {
    const raw = window.localStorage.getItem(WORKSPACE_SETTINGS_KEY)
    if (!raw) return DEFAULT_WORKSPACE_SETTINGS
    const stored = JSON.parse(raw) as Partial<WorkspaceSettings>
    return {
      company:
        typeof stored.company === 'string' && stored.company.trim()
          ? stored.company.trim().slice(0, 80)
          : DEFAULT_WORKSPACE_SETTINGS.company,
      timezone: stored.timezone === 'ekb' ? 'ekb' : 'moscow',
      dailyDigest:
        typeof stored.dailyDigest === 'boolean'
          ? stored.dailyDigest
          : DEFAULT_WORKSPACE_SETTINGS.dailyDigest,
      riskMonitoring:
        typeof stored.riskMonitoring === 'boolean'
          ? stored.riskMonitoring
          : DEFAULT_WORKSPACE_SETTINGS.riskMonitoring,
      systemTheme:
        typeof stored.systemTheme === 'boolean'
          ? stored.systemTheme
          : DEFAULT_WORKSPACE_SETTINGS.systemTheme,
    }
  } catch {
    return DEFAULT_WORKSPACE_SETTINGS
  }
}

export function saveWorkspaceSettings(settings: WorkspaceSettings): void {
  window.localStorage.setItem(WORKSPACE_SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(
    new CustomEvent<WorkspaceSettings>(WORKSPACE_SETTINGS_EVENT, { detail: settings }),
  )
}
