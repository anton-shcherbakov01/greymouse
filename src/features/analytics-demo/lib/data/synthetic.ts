import {
  DEAL_SOURCES,
  LOSS_REASONS,
  PRODUCTS,
  REGIONS,
  type ActivePipelineStage,
  type Client,
  type Deal,
  type DealSource,
  type DealStage,
  type DealStageEvent,
  type LossReason,
  type Manager,
  type SalesDataset,
  type SalesPlan,
} from './types'

export const DEMO_SEED = 2_608_2026
export const DEMO_AS_OF = '2026-08-24T12:00:00.000Z'
export const DEMO_HISTORY_START = '2024-09-01T00:00:00.000Z'
export const DEMO_HISTORY_MONTHS = 24

class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let value = this.state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  pick<T>(values: readonly T[]): T {
    return values[this.int(0, values.length - 1)]
  }

  weighted<T>(values: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    let cursor = this.next() * total
    for (let index = 0; index < values.length; index += 1) {
      cursor -= weights[index]
      if (cursor <= 0) return values[index]
    }
    return values[values.length - 1]
  }

  shuffle<T>(values: readonly T[]): T[] {
    const result = [...values]
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = this.int(0, index)
      ;[result[index], result[target]] = [result[target], result[index]]
    }
    return result
  }
}

const MANAGERS: Manager[] = [
  {
    id: 'mgr-ivanov',
    name: '\u0410\u043b\u0435\u043a\u0441\u0435\u0439 \u0418\u0432\u0430\u043d\u043e\u0432',
    initials: '\u0410\u0418',
    role: 'team_lead',
    team: '\u041e\u0442\u0434\u0435\u043b \u043f\u0440\u043e\u0434\u0430\u0436',
    startedAt: '2021-04-12T00:00:00.000Z',
    active: true,
    planWeight: 0.2,
  },
  {
    id: 'mgr-sokolova',
    name: '\u041c\u0430\u0440\u0438\u044f \u0421\u043e\u043a\u043e\u043b\u043e\u0432\u0430',
    initials: '\u041c\u0421',
    role: 'manager',
    team: '\u041e\u0442\u0434\u0435\u043b \u043f\u0440\u043e\u0434\u0430\u0436',
    startedAt: '2022-02-07T00:00:00.000Z',
    active: true,
    planWeight: 0.18,
  },
  {
    id: 'mgr-petrov',
    name: '\u0421\u0435\u0440\u0433\u0435\u0439 \u041f\u0435\u0442\u0440\u043e\u0432',
    initials: '\u0421\u041f',
    role: 'manager',
    team: '\u041e\u0442\u0434\u0435\u043b \u043f\u0440\u043e\u0434\u0430\u0436',
    startedAt: '2023-09-18T00:00:00.000Z',
    active: true,
    planWeight: 0.13,
  },
  {
    id: 'mgr-volkova',
    name: '\u0410\u043d\u043d\u0430 \u0412\u043e\u043b\u043a\u043e\u0432\u0430',
    initials: '\u0410\u0412',
    role: 'manager',
    team: '\u041e\u0442\u0434\u0435\u043b \u043f\u0440\u043e\u0434\u0430\u0436',
    startedAt: '2022-11-21T00:00:00.000Z',
    active: true,
    planWeight: 0.17,
  },
  {
    id: 'mgr-orlov',
    name: '\u0414\u043c\u0438\u0442\u0440\u0438\u0439 \u041e\u0440\u043b\u043e\u0432',
    initials: '\u0414\u041e',
    role: 'manager',
    team: '\u041e\u0442\u0434\u0435\u043b \u043f\u0440\u043e\u0434\u0430\u0436',
    startedAt: '2024-01-15T00:00:00.000Z',
    active: true,
    planWeight: 0.16,
  },
  {
    id: 'mgr-kuznetsova',
    name: '\u0415\u043b\u0435\u043d\u0430 \u041a\u0443\u0437\u043d\u0435\u0446\u043e\u0432\u0430',
    initials: '\u0415\u041a',
    role: 'manager',
    team: '\u041e\u0442\u0434\u0435\u043b \u043f\u0440\u043e\u0434\u0430\u0436',
    startedAt: '2021-08-30T00:00:00.000Z',
    active: true,
    planWeight: 0.16,
  },
]

const CLIENT_ROOTS = [
  '\u0421\u0435\u0432\u0435\u0440\u0441\u0442\u0430\u043b\u044c',
  '\u0422\u0435\u0445\u043d\u043e\u041f\u0440\u043e\u043c',
  '\u0412\u043e\u043b\u0433\u0430',
  '\u0410\u043b\u044c\u044f\u043d\u0441',
  '\u0413\u043e\u0440\u0438\u0437\u043e\u043d\u0442',
  '\u041f\u0440\u043e\u0442\u043e\u043d',
  '\u041c\u0430\u0433\u0438\u0441\u0442\u0440\u0430\u043b\u044c',
  '\u041d\u0435\u0432\u0430',
  '\u041a\u043e\u043d\u0442\u0443\u0440',
  '\u0410\u0442\u043b\u0430\u043d\u0442',
  '\u0412\u0435\u043a\u0442\u043e\u0440',
  '\u0421\u043f\u0435\u043a\u0442\u0440',
  '\u0424\u043e\u0440\u0432\u0430\u0440\u0434',
  '\u0420\u0435\u0441\u0443\u0440\u0441',
  '\u041e\u0440\u0438\u043e\u043d',
  '\u0421\u043e\u044e\u0437',
] as const

const CLIENT_SUFFIXES = [
  '\u041a\u043e\u043c\u043f\u043b\u0435\u043a\u0442',
  '\u0418\u043d\u0436\u0438\u043d\u0438\u0440\u0438\u043d\u0433',
  '\u041c\u0430\u0448',
  '\u0421\u043d\u0430\u0431',
  '\u0418\u043d\u0434\u0430\u0441\u0442\u0440\u0438',
] as const

const INDUSTRIES = [
  '\u041c\u0430\u0448\u0438\u043d\u043e\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435',
  '\u041c\u0435\u0442\u0430\u043b\u043b\u0443\u0440\u0433\u0438\u044f',
  '\u0421\u0442\u0440\u043e\u0438\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u043e',
  '\u041d\u0435\u0444\u0442\u0435\u0433\u0430\u0437',
  '\u041f\u0438\u0449\u0435\u0432\u043e\u0435 \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0441\u0442\u0432\u043e',
  '\u041b\u043e\u0433\u0438\u0441\u0442\u0438\u043a\u0430',
  '\u042d\u043d\u0435\u0440\u0433\u0435\u0442\u0438\u043a\u0430',
] as const

function createClients(): Client[] {
  return Array.from({ length: 80 }, (_, index) => {
    const root = CLIENT_ROOTS[index % CLIENT_ROOTS.length]
    const suffix = CLIENT_SUFFIXES[Math.floor(index / CLIENT_ROOTS.length)]
    return {
      id: `client-${String(index + 1).padStart(3, '0')}`,
      name: `\u041e\u041e\u041e «${root} ${suffix}»`,
      industry: INDUSTRIES[index % INDUSTRIES.length],
      region: REGIONS[index % REGIONS.length],
      segment: index < 3 ? 'strategic' : index < 18 ? 'growth' : 'standard',
      createdAt: new Date(Date.UTC(2020 + (index % 4), index % 12, 1)).toISOString(),
      accountManagerId: MANAGERS[index % MANAGERS.length].id,
    }
  })
}

interface OutcomeDraft {
  stage: DealStage
  lostAtStage: ActivePipelineStage | null
  forceStale?: boolean
}

interface DealDraft extends OutcomeDraft {
  manager: Manager
  source?: DealSource
}

const MANAGER_QUALITY: Record<string, number> = {
  'mgr-ivanov': 0.24,
  'mgr-sokolova': 0.11,
  'mgr-petrov': -0.24,
  'mgr-volkova': 0.04,
  'mgr-orlov': 0.08,
  'mgr-kuznetsova': 0.02,
}

function monthStartAt(index: number): Date {
  return new Date(Date.UTC(2024, 8 + index, 1))
}

function daysInMonth(monthStart: Date): number {
  return new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
  ).getUTCDate()
}

function isoAtDay(monthStart: Date, day: number, hour = 10): string {
  return new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day, hour),
  ).toISOString()
}

function monthKey(monthStart: Date): string {
  return `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}`
}

function repeat<T>(value: T, count: number): T[] {
  return Array.from({ length: count }, () => value)
}

function makeManagerAssignments(
  count: number,
  random: SeededRandom,
  isCurrentMonth: boolean,
): Manager[] {
  if (isCurrentMonth) {
    const quotas = [40, 35, 35, 32, 30, 28]
    return random.shuffle(quotas.flatMap((quota, index) => repeat(MANAGERS[index], quota)))
  }
  const weights = MANAGERS.map((manager) => manager.planWeight)
  return Array.from({ length: count }, () => random.weighted(MANAGERS, weights))
}

function historicalOutcomes(count: number): OutcomeDraft[] {
  const qualification = Math.round(count * 0.8)
  const proposal = Math.round(count * 0.5)
  const invoice = Math.round(proposal * 0.4)
  const won = Math.round(invoice * 0.8)
  return [
    ...repeat<OutcomeDraft>({ stage: 'won', lostAtStage: null }, won),
    ...repeat<OutcomeDraft>({ stage: 'lost', lostAtStage: 'invoice' }, invoice - won),
    ...repeat<OutcomeDraft>({ stage: 'lost', lostAtStage: 'proposal' }, proposal - invoice),
    ...repeat<OutcomeDraft>(
      { stage: 'lost', lostAtStage: 'qualification' },
      qualification - proposal,
    ),
    ...repeat<OutcomeDraft>({ stage: 'lost', lostAtStage: 'new' }, count - qualification),
  ]
}

function currentOutcomesByManager(
  assignments: readonly Manager[],
  random: SeededRandom,
): OutcomeDraft[] {
  const winQuota = new Map(
    MANAGERS.map((manager, index) => [manager.id, [7, 5, 2, 4, 3, 3][index]]),
  )
  const activeQuota = new Map(
    MANAGERS.map((manager, index) => [manager.id, [7, 7, 7, 6, 6, 6][index]]),
  )
  const result: Array<OutcomeDraft | undefined> = Array(assignments.length)
  const activeSlots = random.shuffle<OutcomeDraft>([
    ...repeat<OutcomeDraft>({ stage: 'new', lostAtStage: null }, 5),
    ...repeat<OutcomeDraft>({ stage: 'qualification', lostAtStage: null }, 10),
    ...repeat<OutcomeDraft>({ stage: 'proposal', lostAtStage: null }, 20),
    ...repeat<OutcomeDraft>({ stage: 'invoice', lostAtStage: null }, 4),
  ])
  const lostSlots = random.shuffle<OutcomeDraft>([
    ...repeat<OutcomeDraft>({ stage: 'lost', lostAtStage: 'new' }, 35),
    ...repeat<OutcomeDraft>({ stage: 'lost', lostAtStage: 'qualification' }, 50),
    ...repeat<OutcomeDraft>({ stage: 'lost', lostAtStage: 'proposal' }, 51),
    ...repeat<OutcomeDraft>({ stage: 'lost', lostAtStage: 'invoice' }, 1),
  ])
  let activeCursor = 0
  let lostCursor = 0

  for (const manager of MANAGERS) {
    const indices = random.shuffle(
      assignments.flatMap((item, index) => (item.id === manager.id ? [index] : [])),
    )
    const wins = winQuota.get(manager.id) ?? 0
    const active = activeQuota.get(manager.id) ?? 0
    indices.slice(0, wins).forEach((index) => {
      result[index] = { stage: 'won', lostAtStage: null }
    })
    indices.slice(wins, wins + active).forEach((index) => {
      result[index] = activeSlots[activeCursor++]
    })
    indices.slice(wins + active).forEach((index) => {
      result[index] = lostSlots[lostCursor++]
    })
  }

  const activeCandidates = result
    .map((outcome, index) => ({ outcome, index }))
    .filter(({ outcome }) => outcome?.stage === 'proposal' || outcome?.stage === 'invoice')
    .slice(0, 8)
  activeCandidates.forEach(({ index }) => {
    result[index] = { ...(result[index] as OutcomeDraft), forceStale: true }
  })
  return result as OutcomeDraft[]
}

function assignHistoricalOutcomes(
  assignments: readonly Manager[],
  outcomes: readonly OutcomeDraft[],
  random: SeededRandom,
): OutcomeDraft[] {
  const ranked = assignments
    .map((manager, index) => ({
      index,
      score: random.next() + (MANAGER_QUALITY[manager.id] ?? 0),
    }))
    .sort((left, right) => right.score - left.score)
  const ordered = [...outcomes].sort((left, right) => {
    const rank = (outcome: OutcomeDraft): number => {
      if (outcome.stage === 'won') return 5
      if (outcome.lostAtStage === 'invoice') return 4
      if (outcome.lostAtStage === 'proposal') return 3
      if (outcome.lostAtStage === 'qualification') return 2
      return 1
    }
    return rank(right) - rank(left)
  })
  const result: OutcomeDraft[] = Array(assignments.length)
  ranked.forEach(({ index }, rank) => {
    result[index] = ordered[rank]
  })
  return result
}

function assignCurrentSources(drafts: DealDraft[], random: SeededRandom): void {
  const wonIndices = random.shuffle(
    drafts.flatMap((draft, index) => (draft.stage === 'won' ? [index] : [])),
  )
  const nonWonIndices = random.shuffle(
    drafts.flatMap((draft, index) => (draft.stage !== 'won' ? [index] : [])),
  )
  const exhibitionIndices = [wonIndices[0], ...nonWonIndices.slice(0, 35)]
  exhibitionIndices.forEach((index) => {
    drafts[index].source = 'exhibition'
  })

  const remaining = random.shuffle(drafts.flatMap((draft, index) => (draft.source ? [] : [index])))
  const sourceSlots = random.shuffle<DealSource>([
    ...repeat<DealSource>('website', 42),
    ...repeat<DealSource>('referral', 35),
    ...repeat<DealSource>('outbound', 34),
    ...repeat<DealSource>('repeat', 30),
    ...repeat<DealSource>('partner', 23),
  ])
  remaining.forEach((index, cursor) => {
    drafts[index].source = sourceSlots[cursor]
  })
}

function stageSequence(outcome: OutcomeDraft): DealStage[] {
  const activeOrder: ActivePipelineStage[] = ['new', 'qualification', 'proposal', 'invoice']
  if (outcome.stage === 'won') return [...activeOrder, 'won']
  if (outcome.stage === 'lost') {
    const terminalIndex = activeOrder.indexOf(outcome.lostAtStage ?? 'new')
    return [...activeOrder.slice(0, terminalIndex + 1), 'lost']
  }
  return activeOrder.slice(0, activeOrder.indexOf(outcome.stage) + 1)
}

function makeTimeline(
  monthStart: Date,
  outcome: OutcomeDraft,
  random: SeededRandom,
  isCurrentMonth: boolean,
): {
  createdAt: string
  closedAt: string | null
  lastActivityAt: string
  stageEnteredAt: string
  stageHistory: DealStageEvent[]
} {
  const sequence = stageSequence(outcome)
  const terminal = outcome.stage === 'won' || outcome.stage === 'lost'
  const maxObservationDay = isCurrentMonth ? 24 : daysInMonth(monthStart)
  const latestCreationDay = Math.max(1, maxObservationDay - Math.max(1, sequence.length - 1) * 3)
  const createdDay = outcome.forceStale ? random.int(1, 3) : random.int(1, latestCreationDay)
  const enteredDays = [createdDay]
  for (let index = 1; index < sequence.length; index += 1) {
    enteredDays.push(Math.min(maxObservationDay, enteredDays[index - 1] + random.int(1, 3)))
  }
  const stageHistory = sequence.map((stage, index): DealStageEvent => ({
    stage,
    enteredAt: isoAtDay(monthStart, enteredDays[index], 9 + (index % 4)),
    exitedAt:
      index < sequence.length - 1
        ? isoAtDay(monthStart, enteredDays[index + 1], 9 + ((index + 1) % 4))
        : null,
  }))
  const lastEvent = stageHistory[stageHistory.length - 1]
  const closedAt = terminal ? lastEvent.enteredAt : null
  let lastActivityAt = closedAt ?? lastEvent.enteredAt
  if (!terminal && isCurrentMonth) {
    const activityDay = outcome.forceStale ? 9 + random.int(0, 7) : random.int(18, 24)
    const activityAt = isoAtDay(monthStart, activityDay, 14)
    lastActivityAt =
      new Date(activityAt).getTime() >= new Date(lastEvent.enteredAt).getTime()
        ? activityAt
        : lastEvent.enteredAt
  }
  return {
    createdAt: stageHistory[0].enteredAt,
    closedAt,
    lastActivityAt,
    stageEnteredAt: lastEvent.enteredAt,
    stageHistory,
  }
}

function normalizeAmounts(raw: readonly number[], targetTotal: number, rounding = 1_000): number[] {
  if (raw.length === 0) return []
  const rawTotal = raw.reduce((sum, value) => sum + value, 0)
  const normalized = raw.map((value) =>
    Math.max(rounding, Math.round(((value / rawTotal) * targetTotal) / rounding) * rounding),
  )
  normalized[normalized.length - 1] +=
    targetTotal - normalized.reduce((sum, value) => sum + value, 0)
  return normalized
}

function historicalRevenueTarget(monthIndex: number, month: number): number {
  const seasonal = [
    -700_000, -300_000, 200_000, 0, -100_000, 300_000, 0, -200_000, 200_000, 700_000, 900_000,
    400_000,
  ][month]
  return Math.round((13_200_000 + monthIndex * 100_000 + seasonal) / 10_000) * 10_000
}

function dealCountForMonth(monthIndex: number, month: number, random: SeededRandom): number {
  if (monthIndex >= 22) return 200
  const seasonal = [-32, -18, 8, 5, -7, 10, -10, -5, 12, 27, 31, -4][month]
  return Math.min(250, Math.max(150, 190 + seasonal + random.int(-7, 7)))
}

function makeMonthDeals(
  monthIndex: number,
  clients: readonly Client[],
  random: SeededRandom,
): { deals: Deal[]; plannedRevenue: number } {
  const monthStart = monthStartAt(monthIndex)
  const isCurrentMonth = monthIndex === DEMO_HISTORY_MONTHS - 1
  const isPreviousMonth = monthIndex === DEMO_HISTORY_MONTHS - 2
  const count = dealCountForMonth(monthIndex, monthStart.getUTCMonth(), random)
  const assignments = makeManagerAssignments(count, random, isCurrentMonth)
  const outcomes = isCurrentMonth
    ? currentOutcomesByManager(assignments, random)
    : assignHistoricalOutcomes(assignments, historicalOutcomes(count), random)
  const drafts: DealDraft[] = assignments.map((manager, index) => ({
    manager,
    ...outcomes[index],
  }))

  if (isCurrentMonth) assignCurrentSources(drafts, random)
  const sourceWeights = [0.24, 0.19, 0.2, 0.11, 0.15, 0.11]
  drafts.forEach((draft) => {
    draft.source ??= random.weighted(DEAL_SOURCES, sourceWeights)
  })

  const wonDrafts = drafts.filter((draft) => draft.stage === 'won')
  const currentWonOrder = isCurrentMonth
    ? ['mgr-ivanov', 'mgr-sokolova', 'mgr-volkova']
        .map((managerId) => wonDrafts.find((draft) => draft.manager.id === managerId))
        .filter((draft): draft is DealDraft => draft !== undefined)
        .concat(
          wonDrafts
            .filter(
              (draft) =>
                !['mgr-ivanov', 'mgr-sokolova', 'mgr-volkova'].some(
                  (managerId) =>
                    wonDrafts.find((candidate) => candidate.manager.id === managerId) === draft,
                ),
            )
            .sort(
              (left, right) =>
                (MANAGER_QUALITY[right.manager.id] ?? 0) -
                  (MANAGER_QUALITY[left.manager.id] ?? 0) ||
                left.manager.id.localeCompare(right.manager.id),
            ),
        )
    : wonDrafts
  const plannedRevenue = isCurrentMonth
    ? 13_560_000
    : isPreviousMonth
      ? 16_000_000
      : historicalRevenueTarget(monthIndex, monthStart.getUTCMonth())
  const wonAmounts = isCurrentMonth
    ? [1_627_200, 1_491_600, 1_491_600, ...repeat(426_000, wonDrafts.length - 4), 429_600]
    : normalizeAmounts(
        wonDrafts.map(() => 0.55 + random.next() * 1.15),
        plannedRevenue,
      )
  const wonAmountByDraft = new Map<DealDraft, number>()
  currentWonOrder.forEach((draft, index) => {
    wonAmountByDraft.set(draft, wonAmounts[index])
  })

  const currentWonClientByDraft = new Map<DealDraft, Client>()
  if (isCurrentMonth) {
    currentWonOrder.forEach((draft, index) => {
      currentWonClientByDraft.set(draft, clients[index])
    })
  }
  const activeStale = drafts.filter((draft) => draft.forceStale)
  const staleAmounts = [850_000, 730_000, 620_000, 590_000, 560_000, 510_000, 440_000, 400_000]
  const staleAmountByDraft = new Map<DealDraft, number>()
  activeStale.forEach((draft, index) => {
    staleAmountByDraft.set(draft, staleAmounts[index])
  })
  const largeLostDrafts = isCurrentMonth
    ? drafts
        .filter(
          (draft) =>
            draft.stage === 'lost' &&
            (draft.lostAtStage === 'proposal' || draft.lostAtStage === 'invoice'),
        )
        .slice(0, 3)
    : []
  const largeLostAmounts = [1_700_000, 1_350_000, 1_100_000]

  return {
    plannedRevenue,
    deals: drafts.map((draft, index): Deal => {
      const timeline = makeTimeline(monthStart, draft, random, isCurrentMonth)
      let client = currentWonClientByDraft.get(draft)
      if (!client) {
        const strategicBias = draft.stage === 'won' && random.next() < 0.28
        client = strategicBias
          ? clients[random.int(0, 4)]
          : clients[random.int(3, clients.length - 1)]
      }
      let amount = wonAmountByDraft.get(draft)
      if (amount === undefined) {
        const largeLostIndex = largeLostDrafts.indexOf(draft)
        amount =
          staleAmountByDraft.get(draft) ??
          (largeLostIndex >= 0
            ? largeLostAmounts[largeLostIndex]
            : Math.round((180_000 + random.next() * 720_000) / 5_000) * 5_000)
      }
      const probabilityByStage: Record<ActivePipelineStage, number> = {
        new: 0.1,
        qualification: 0.28,
        proposal: 0.5,
        invoice: 0.78,
      }
      const probability =
        draft.stage === 'won'
          ? 1
          : draft.stage === 'lost'
            ? 0
            : Math.min(
                0.95,
                Math.max(0.05, probabilityByStage[draft.stage] + (random.next() - 0.5) * 0.08),
              )
      const lossReason: LossReason | null =
        draft.stage === 'lost'
          ? random.weighted(LOSS_REASONS, [0.24, 0.16, 0.22, 0.18, 0.12, 0.08])
          : null
      return {
        id: `deal-${monthKey(monthStart).replace('-', '')}-${String(index + 1).padStart(3, '0')}`,
        ...timeline,
        clientId: client.id,
        clientName: client.name,
        managerId: draft.manager.id,
        managerName: draft.manager.name,
        stage: draft.stage,
        amount,
        probability,
        source: draft.source as DealSource,
        lossReason,
        lostAtStage: draft.lostAtStage,
        product: random.pick(PRODUCTS),
        region: client.region,
      }
    }),
  }
}

function createPlans(
  monthDeals: readonly { deals: Deal[]; plannedRevenue: number }[],
): SalesPlan[] {
  return monthDeals.flatMap((monthData, monthIndex) => {
    const period = monthKey(monthStartAt(monthIndex))
    const departmentAmount =
      monthIndex === DEMO_HISTORY_MONTHS - 1
        ? 18_250_000
        : Math.round((monthData.plannedRevenue * (monthIndex % 4 === 0 ? 1.06 : 1.03)) / 10_000) *
          10_000
    const managerPlans = MANAGERS.map((manager, managerIndex): SalesPlan => ({
      id: `plan-${period}-${manager.id}`,
      period,
      amount:
        managerIndex === MANAGERS.length - 1
          ? departmentAmount -
            MANAGERS.slice(0, -1).reduce(
              (sum, item) => sum + Math.round((departmentAmount * item.planWeight) / 1_000) * 1_000,
              0,
            )
          : Math.round((departmentAmount * manager.planWeight) / 1_000) * 1_000,
      currency: 'RUB',
      scope: 'manager',
      managerId: manager.id,
    }))
    return [
      {
        id: `plan-${period}-department`,
        period,
        amount: departmentAmount,
        currency: 'RUB' as const,
        scope: 'department' as const,
        managerId: null,
      },
      ...managerPlans,
    ]
  })
}

export function generateSyntheticDataset(seed = DEMO_SEED): SalesDataset {
  const random = new SeededRandom(seed)
  const clients = createClients()
  const monthly = Array.from({ length: DEMO_HISTORY_MONTHS }, (_, index) =>
    makeMonthDeals(index, clients, random),
  )
  const dataset: SalesDataset = {
    company: {
      id: 'vector-trade',
      name: '\u0412\u0435\u043a\u0442\u043e\u0440 \u0422\u0440\u0435\u0439\u0434',
      legalName:
        '\u041e\u041e\u041e «\u0412\u0435\u043a\u0442\u043e\u0440 \u0422\u0440\u0435\u0439\u0434»',
      business:
        '\u041e\u043f\u0442\u043e\u0432\u044b\u0435 \u043f\u043e\u0441\u0442\u0430\u0432\u043a\u0438 \u043f\u0440\u043e\u043c\u044b\u0448\u043b\u0435\u043d\u043d\u043e\u0433\u043e \u043e\u0431\u043e\u0440\u0443\u0434\u043e\u0432\u0430\u043d\u0438\u044f',
      currency: 'RUB',
      timezone: 'Europe/Moscow',
    },
    managers: MANAGERS.map((manager) => ({ ...manager })),
    clients,
    deals: monthly.flatMap((item) => item.deals),
    salesPlans: createPlans(monthly),
    metadata: {
      seed,
      generatedAt: DEMO_AS_OF,
      asOf: DEMO_AS_OF,
      historyStart: DEMO_HISTORY_START,
      historyEnd: '2026-09-01T00:00:00.000Z',
      historyMonths: DEMO_HISTORY_MONTHS,
      scenario: 'owner-dashboard-commercial-demo-v1',
    },
  }
  const validation = validateSyntheticDataset(dataset)
  if (!validation.valid) {
    throw new Error(`Synthetic dataset invariant failed: ${validation.errors.join('; ')}`)
  }
  return dataset
}

export interface SyntheticDatasetValidation {
  valid: boolean
  errors: string[]
  monthlyDealCounts: Record<string, number>
}

export function validateSyntheticDataset(dataset: SalesDataset): SyntheticDatasetValidation {
  const errors: string[] = []
  const monthlyDealCounts: Record<string, number> = {}
  const dealIds = new Set<string>()
  const managerIds = new Set(dataset.managers.map((manager) => manager.id))
  const clientIds = new Set(dataset.clients.map((client) => client.id))
  dataset.deals.forEach((deal) => {
    const period = deal.createdAt.slice(0, 7)
    monthlyDealCounts[period] = (monthlyDealCounts[period] ?? 0) + 1
    if (dealIds.has(deal.id)) errors.push(`${deal.id}: duplicate id`)
    dealIds.add(deal.id)
    if (!managerIds.has(deal.managerId)) {
      errors.push(`${deal.id}: unknown manager ${deal.managerId}`)
    }
    if (!clientIds.has(deal.clientId)) {
      errors.push(`${deal.id}: unknown client ${deal.clientId}`)
    }
    if (deal.amount < 0) errors.push(`${deal.id}: negative amount`)
    if (deal.probability < 0 || deal.probability > 1) {
      errors.push(`${deal.id}: probability outside 0..1`)
    }
    if (deal.stage === 'lost' && !deal.lossReason) {
      errors.push(`${deal.id}: lost without reason`)
    }
    if ((deal.stage === 'won' || deal.stage === 'lost') && !deal.closedAt) {
      errors.push(`${deal.id}: terminal deal without close date`)
    }
    if (deal.stage !== 'won' && deal.stage !== 'lost' && deal.closedAt !== null) {
      errors.push(`${deal.id}: active deal with close date`)
    }
    const history = deal.stageHistory ?? []
    if (history.length > 0) {
      if (history[0].stage !== 'new') {
        errors.push(`${deal.id}: history must begin with new`)
      }
      history.slice(1).forEach((event, index) => {
        if (new Date(event.enteredAt).getTime() < new Date(history[index].enteredAt).getTime()) {
          errors.push(`${deal.id}: non-chronological stage history`)
        }
      })
    }
  })
  if (dataset.managers.length !== 6) errors.push('Expected six managers')
  if (Object.keys(monthlyDealCounts).length !== DEMO_HISTORY_MONTHS) {
    errors.push(`Expected ${DEMO_HISTORY_MONTHS} calendar months`)
  }
  Object.entries(monthlyDealCounts).forEach(([period, count]) => {
    if (count < 150 || count > 250) {
      errors.push(`${period}: ${count} deals outside 150..250`)
    }
  })
  Object.keys(monthlyDealCounts).forEach((period) => {
    const departmentPlan = dataset.salesPlans.find(
      (plan) => plan.period === period && plan.scope === 'department',
    )
    const managerPlans = dataset.salesPlans.filter(
      (plan) => plan.period === period && plan.scope === 'manager',
    )
    if (!departmentPlan) errors.push(`${period}: missing department plan`)
    if (managerPlans.length !== dataset.managers.length) {
      errors.push(`${period}: missing manager plans`)
    }
    if (
      departmentPlan &&
      managerPlans.reduce((sum, plan) => sum + plan.amount, 0) !== departmentPlan.amount
    ) {
      errors.push(`${period}: manager plans do not reconcile`)
    }
  })
  return { valid: errors.length === 0, errors, monthlyDealCounts }
}

export const demoDataset = generateSyntheticDataset()
export const demoDeals = demoDataset.deals
export const demoManagers = demoDataset.managers
export const demoClients = demoDataset.clients
export const demoSalesPlans = demoDataset.salesPlans
