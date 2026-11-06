/** Tipos y valores de referencia de los planes comerciales mantenidos deshabilitados. */
export type PlanId = 'pro' | 'premium';
export type BillingCurrency = 'COP' | 'USD';

export const USD_COP_REFERENCE = 3228.26;
export const USD_REFERENCE_DATE = '2026-11-06';

export const PLANS: Record<PlanId, {
  name: string;
  priceCop: number;
  interval: 'month' | 'year';
  trialDays: number;
  description: string;
}> = {
  pro: {
    name: 'Pro',
    priceCop: 30000,
    interval: 'month',
    trialDays: 7,
    description: 'Plan mensual con prueba gratuita inicial.',
  },
  premium: {
    name: 'Premium',
    priceCop: 230000,
    interval: 'year',
    trialDays: 0,
    description: 'Plan anual para quienes prefieren un solo pago por año.',
  },
};

/** Presenta el precio en COP o su referencia aproximada en USD. */
export function formatPlanPrice(planId: PlanId, currency: BillingCurrency): string {
  const plan = PLANS[planId];
  if (currency === 'COP') {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(plan.priceCop);
  }
  const approximateUSD = plan.priceCop / USD_COP_REFERENCE;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(approximateUSD);
}
