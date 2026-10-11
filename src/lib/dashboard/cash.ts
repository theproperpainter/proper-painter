import 'server-only'
import { readRanges } from '@/lib/google-sheets/client'

export interface AvailableCash {
  /** Sum of the FNB checking account balances that were readable. */
  availableCash: number
  /** The "as of" date Plaid last wrote into Transactions Log (e.g. "10/10/2026"). */
  asOfDate: string | null
  /** Current Sherwin-Williams revolving balance (already computed by the live sheet). */
  swBalanceOwed: number
  /**
   * Account labels that couldn't be read (Plaid wrote "N/A", or the row was
   * blank/unparseable). availableCash is a sum of only the OTHER accounts when
   * this is non-empty — never silently treat a missing account as $0.
   */
  missingAccounts: string[]
}

/** "$3,349.38" or "3349.38" -> 3349.38. Returns null for blank/unparseable values (e.g. "N/A"). */
function parseMoney(value: unknown): number | null {
  if (typeof value === 'number') return value
  const cleaned = String(value ?? '').replace(/[$,\s]/g, '')
  if (!cleaned) return null
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

export async function getAvailableCash(): Promise<AvailableCash> {
  const data = await readRanges([
    "'Transactions Log'!A3:C4", // the two FNB balance rows Plaid writes
    "'SW Credit Account'!A2:F2", // the summary row with the live Balance Owed figure
  ])

  const balanceRows = data["'Transactions Log'!A3:C4"] ?? []
  let total = 0
  let asOfDate: string | null = null
  const missingAccounts: string[] = []
  for (const row of balanceRows) {
    const amount = parseMoney(row[1])
    if (amount !== null) {
      total += amount
    } else {
      missingAccounts.push(String(row[0] ?? 'an account').trim() || 'an account')
    }
    const asOf = String(row[2] ?? '').match(/as of (.+)/i)
    if (asOf) asOfDate = asOf[1]
  }

  const swRow = data["'SW Credit Account'!A2:F2"]?.[0] ?? []
  // "Balance Owed:" label and its value could shift columns if the sheet is ever
  // re-laid-out — search for the label instead of hardcoding column F.
  const labelIdx = swRow.findIndex((cell) => String(cell).trim().toLowerCase() === 'balance owed:')
  const swBalanceOwed = labelIdx !== -1 ? (parseMoney(swRow[labelIdx + 1]) ?? 0) : 0

  return { availableCash: total, asOfDate, swBalanceOwed, missingAccounts }
}
