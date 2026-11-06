import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiLock } from 'react-icons/fi';
import { BillingCurrency, formatPlanPrice, PLANS, PlanId, USD_COP_REFERENCE } from '../data/plans';
import { useLanguage } from '../lib/languageStore';

/** Resume plan y moneda; esta vista no procesa pagos ni datos de tarjeta. */
export const PagoPage: React.FC = () => {
  const { planId: routePlanId } = useParams<{ planId: string }>();
  const location = useLocation();
  const initialCurrency = (location.state as { currency?: BillingCurrency } | null)?.currency;
  const [currency, setCurrency] = useState<BillingCurrency>(initialCurrency === 'USD' ? 'USD' : 'COP');
  const { t } = useLanguage();
  const planId: PlanId = routePlanId === 'premium' ? 'premium' : 'pro';
  const plan = PLANS[planId];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to="/planes" className="inline-flex items-center gap-2 text-sm font-semibold text-[#536343] hover:text-[#283618] dark:text-[#e6b16c]"><FiArrowLeft /> {t('Volver a planes')}</Link>
      <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#43513b] dark:bg-[#24301f] sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#283618] text-[#e6b16c]"><FiLock /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#71805d] dark:text-[#e6b16c]">Revisión</p>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{t('Revisa tu plan')}</h1>
          </div>
        </div>

        <div className="mt-7 rounded-2xl bg-[#f6f3e9] p-5 dark:bg-[#1b271b]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('Plan seleccionado')}</p>
              <h2 className="mt-1 text-xl font-extrabold text-gray-900 dark:text-gray-100">{plan.name}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t(plan.interval === 'month' ? 'Cobro mensual' : 'Cobro anual')}</p>
            </div>
            <select aria-label="Moneda" value={currency} onChange={(event) => setCurrency(event.target.value as BillingCurrency)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold dark:border-[#43513b] dark:bg-[#24301f] dark:text-gray-100">
              <option value="COP">COP</option><option value="USD">USD</option>
            </select>
          </div>
          <div className="mt-5 border-t border-gray-200 pt-4 dark:border-[#43513b]">
            <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{formatPlanPrice(planId, currency)}<span className="ml-2 text-sm font-semibold text-gray-500">/{plan.interval === 'month' ? (currency === 'COP' ? 'mes' : 'month') : (currency === 'COP' ? 'año' : 'year')}</span></p>
            <p className="mt-1 text-xs text-gray-500">{currency === 'COP' ? `Referencia aproximada: ${formatPlanPrice(planId, 'USD')} USD` : `${formatPlanPrice(planId, 'COP')} COP. Referencia TRM: ${USD_COP_REFERENCE.toLocaleString('es-CO')} COP/USD.`}</p>
          </div>
        </div>

        {plan.trialDays > 0 && (
          <div className="mt-4 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-100">
            <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p><strong>{plan.trialDays} días de prueba.</strong> {t('El primer cobro de')} {formatPlanPrice(planId, currency)} se programaría al finalizar la prueba, una vez se habilite el pago.</p>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-bold">{t('Los pagos todavía no están habilitados')}</p>
          <p className="mt-1">{t('Aquí queda preparada la revisión del plan y la moneda. No ingreses datos de tarjeta: falta conectar y validar una pasarela de pago segura.')}</p>
        </div>

        <button type="button" disabled className="mt-6 min-h-12 w-full cursor-not-allowed rounded-xl bg-gray-200 px-4 text-sm font-bold text-gray-500 dark:bg-[#303d2a] dark:text-gray-400">{t('Continuar al pago (próximamente)')}</button>
        <p className="mt-3 text-center text-xs text-gray-500">{t('No se realizará ningún cobro desde esta página.')}</p>
      </div>
    </div>
  );
};
