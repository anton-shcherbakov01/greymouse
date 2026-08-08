'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bell, Check, Database, Link2, Palette, ShieldCheck } from 'lucide-react'
import { Panel, PanelHeader } from '@/features/analytics-demo/components/ui'
import { demoDataset } from '@/features/analytics-demo/lib/data'
import { formatNumberRu } from '@/features/analytics-demo/lib/dashboard/format'
import {
  DEFAULT_WORKSPACE_SETTINGS,
  loadWorkspaceSettings,
  saveWorkspaceSettings,
  type WorkspaceSettings,
} from '@/features/analytics-demo/lib/dashboard/settings'

export function SettingsView() {
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_WORKSPACE_SETTINGS)
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<number | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setSettings(loadWorkspaceSettings()), 0)
    return () => {
      window.clearTimeout(timer)
      if (savedTimer.current !== null) window.clearTimeout(savedTimer.current)
    }
  }, [])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveWorkspaceSettings({
      ...settings,
      company: settings.company.trim() || DEFAULT_WORKSPACE_SETTINGS.company,
    })
    setSaved(true)
    if (savedTimer.current !== null) window.clearTimeout(savedTimer.current)
    savedTimer.current = window.setTimeout(() => setSaved(false), 2400)
  }

  return (
    <div className="view-stack settings-grid">
      <Panel>
        <PanelHeader eyebrow="Рабочее пространство" title="Основные настройки" />
        <form className="settings-list" onSubmit={submit}>
          <label>
            <span>
              <strong>Название компании</strong>
              <small>Показывается в рабочем пространстве</small>
            </span>
            <input
              value={settings.company}
              onChange={(event) =>
                setSettings((current) => ({ ...current, company: event.target.value }))
              }
              maxLength={80}
            />
          </label>
          <label>
            <span>
              <strong>Часовой пояс</strong>
              <small>Используется для времени обновления</small>
            </span>
            <select
              value={settings.timezone}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  timezone: event.target.value as WorkspaceSettings['timezone'],
                }))
              }
            >
              <option value="moscow">Москва · UTC+3</option>
              <option value="ekb">Екатеринбург · UTC+5</option>
            </select>
          </label>
          <label>
            <span>
              <strong>Валюта</strong>
              <small>Demo dataset и расчёты ведутся в рублях</small>
            </span>
            <select value="rub" disabled aria-label="Валюта отчёта">
              <option value="rub">Российский рубль · ₽</option>
            </select>
          </label>
          <button className="primary-button" type="submit">
            {saved ? (
              <>
                <Check size={14} />
                Сохранено
              </>
            ) : (
              'Сохранить изменения'
            )}
          </button>
        </form>
      </Panel>
      <Panel>
        <PanelHeader eyebrow="Профиль аналитики" title="Интерфейс и уведомления" />
        <div className="toggle-list">
          <label>
            <span className="setting-icon">
              <Bell size={16} />
            </span>
            <span>
              <strong>Ежедневный digest</strong>
              <small>Предпочтение доставки после подключения канала уведомлений</small>
            </span>
            <input
              type="checkbox"
              checked={settings.dailyDigest}
              onChange={(event) =>
                setSettings((current) => ({ ...current, dailyDigest: event.target.checked }))
              }
            />
            <i />
          </label>
          <label>
            <span className="setting-icon">
              <ShieldCheck size={16} />
            </span>
            <span>
              <strong>Счётчик проблем</strong>
              <small>Показывать количество активных сигналов в навигации</small>
            </span>
            <input
              type="checkbox"
              checked={settings.riskMonitoring}
              onChange={(event) =>
                setSettings((current) => ({ ...current, riskMonitoring: event.target.checked }))
              }
            />
            <i />
          </label>
          <label>
            <span className="setting-icon">
              <Palette size={16} />
            </span>
            <span>
              <strong>Системная тема</strong>
              <small>Следовать настройкам устройства</small>
            </span>
            <input
              type="checkbox"
              checked={settings.systemTheme}
              onChange={(event) =>
                setSettings((current) => ({ ...current, systemTheme: event.target.checked }))
              }
            />
            <i />
          </label>
        </div>
      </Panel>
      <Panel className="settings-span">
        <PanelHeader
          eyebrow="Источники"
          title="Подключения данных"
          description="MVP работает локально, архитектура готова к CRM и DWH"
        />
        <div className="integration-grid">
          <div className="integration-card is-connected">
            <span>
              <Database size={18} />
            </span>
            <div>
              <strong>Demo dataset</strong>
              <small>
                {formatNumberRu(demoDataset.deals.length)} сделок ·{' '}
                {demoDataset.metadata.historyMonths} месяца
              </small>
            </div>
            <em>Подключено</em>
          </div>
          {['Bitrix24', 'amoCRM', '1С', 'PostgreSQL'].map((name) => (
            <div className="integration-card" key={name}>
              <span>
                <Link2 size={18} />
              </span>
              <div>
                <strong>{name}</strong>
                <small>Подключение через ETL</small>
              </div>
              <em>В roadmap</em>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
