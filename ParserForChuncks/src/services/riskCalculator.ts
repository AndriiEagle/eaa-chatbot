import crypto from 'crypto';

/**
 * Минималистичный «калькулятор рисков» штрафов за недоступность.
 * НЕ юридически точен; предназначен для быстрой прикидки.
 */
export interface RiskInput {
  annualRevenueEUR: number;   // годовой оборот в €
  euUserShare: number;        // доля пользователей из ЕС (0-1)
  accessibilityScore: number; // текущая оценка доступности (0-100)
}

export interface RiskOutput {
  riskScore: number;          // 0-100
  expectedFineEUR: number;    // ориентировочный штраф
  id: string;                 // идентификатор расчёта
}

export function calculateRisk({ annualRevenueEUR, euUserShare, accessibilityScore }: RiskInput): RiskOutput {
  // Нормализация значений
  const revenueFactor = Math.log10(Math.max(annualRevenueEUR, 1)); // 0-∞ ➜ 0-6
  const exposure = Math.min(Math.max(euUserShare, 0), 1);          // 0-1
  const compliance = Math.min(Math.max(accessibilityScore, 0), 100) / 100; // 0-1

  // Чем выше оборот и EU-share и чем ниже compliance — тем выше риск
  const rawRisk = (revenueFactor / 6) * 0.4 + exposure * 0.4 + (1 - compliance) * 0.2;
  const riskScore = Math.round(rawRisk * 100);

  // Штраф: до 4 % от оборота (упрощённо)
  const expectedFineEUR = Math.round(annualRevenueEUR * riskScore / 100 * 0.04);

  return {
    riskScore,
    expectedFineEUR,
    id: crypto.randomUUID()
  };
} 