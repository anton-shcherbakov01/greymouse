import type { Deal } from '../data/types'
import { isInPeriod, round } from './date'
import type { ConcentrationEntry, ConcentrationResult, DatePeriod } from './types'

export function calculateConcentration(
  deals: readonly Deal[],
  period?: DatePeriod,
  topN = 5,
): ConcentrationResult {
  const byClient = new Map<string, { clientName: string; revenue: number }>()
  for (const deal of deals) {
    if (deal.stage !== 'won') continue
    if (period && (!deal.closedAt || !isInPeriod(deal.closedAt, period))) continue
    const current = byClient.get(deal.clientId) ?? {
      clientName: deal.clientName,
      revenue: 0,
    }
    current.revenue += deal.amount
    byClient.set(deal.clientId, current)
  }

  const totalRevenue = [...byClient.values()].reduce((sum, client) => sum + client.revenue, 0)
  let cumulativeShare = 0
  const entries: ConcentrationEntry[] = [...byClient.entries()]
    .sort(
      ([leftId, left], [rightId, right]) =>
        right.revenue - left.revenue || leftId.localeCompare(rightId),
    )
    .map(([clientId, client], index) => {
      const share = totalRevenue === 0 ? 0 : client.revenue / totalRevenue
      const shareBefore = cumulativeShare
      cumulativeShare += share
      return {
        clientId,
        clientName: client.clientName,
        revenue: client.revenue,
        share,
        rank: index + 1,
        cumulativeShare,
        // The client crossing a boundary remains in the preceding class.
        abcClass: shareBefore < 0.8 ? 'A' : shareBefore < 0.95 ? 'B' : 'C',
      }
    })

  const normalizedTopN = Math.max(0, Math.floor(topN))
  const topNRevenue = entries
    .slice(0, normalizedTopN)
    .reduce((sum, entry) => sum + entry.revenue, 0)
  const hhi = entries.reduce((sum, entry) => sum + entry.share ** 2, 0) * 10_000

  return {
    totalRevenue,
    uniqueClients: entries.length,
    topN: normalizedTopN,
    topNRevenue,
    topNShare: totalRevenue === 0 ? 0 : topNRevenue / totalRevenue,
    hhi: round(hhi, 2),
    entries,
  }
}
