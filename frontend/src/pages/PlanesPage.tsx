import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiShield } from 'react-icons/fi';
import { BillingCurrency, formatPlanPrice, PLANS, PlanId, USD_COP_REFERENCE, USD_REFERENCE_DATE } from '../data/plans';
import { useLanguage } from '../lib/languageStore';

/** Muestra planes informativos; el acceso se mantiene detrás de la bandera comercial. */
export const PlanesPage: React.FC = () => {
  const [currency, setCurrency] = useState<BillingCurrency>('COP');
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#71805d] dark:text-[#e6b16c]">AgroPlantas Colombia</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl">{t('Elige tu plan')}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{t('Compara las opciones de suscripción. El cupo y los beneficios definitivos aparecerán antes de activar cualquier pago.')}</p>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2" aria-label="Moneda de referencia">
        {(['COP', 'USD'] as BillingCurrency[]).map((option) => (
          <button key={option} type="button" onClick={() => setCurrency(option)} aria-pressed={currency === option}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${currency === option ? 'bg-[#283618] text-white dark:bg-[#dda15e] dark:text-[#1d281d]' : 'border border-gray-200 bg-white text-gray-600 dark:border-[#43513b] dark:bg-[#24301f] dark:text-gray-300'}`}>
            {option}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-gray-500 dark:text-gray-400">{t('Los precios en USD son aproximados; referencia TRM')} {USD_COP_REFERENCE.toLocaleString('es-CO')} {t('COP/USD del')} {USD_REFERENCE_DATE}. {t('El cobro final dependerá de la tasa y la pasarela.')}</p>

      <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
        {(Object.keys(PLANS) as PlanId[]).map((planId) => {
          const plan = PLANS[planId];
          const isPro = planId === 'pro';
          return (
            <article key={planId} className={`relative rounded-3xl border bg-white p-6 shadow-sm dark:bg-[#24301f] sm:p-8 ${isPro ? 'border-[#dda15e] ring-2 ring-[#dda15e]/20' : 'border-gray-200 dark:border-[#43513b]'}`}>
              {isPro && <span className="absolute -top-3 left-6 rounded-full bg-[#dda15e] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#1d281d]">{t('Prueba de 7 días')}</span>}
              <p className="text-sm font-bold text-[#71805d] dark:text-[#e6b16c]">{plan.name}</p>
              <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-gray-100">{formatPlanPrice(planId, currency)}<span className="ml-1 text-sm font-semibold text-gray-500">/{plan.interval === 'month' ? (currency === 'COP' ? 'mes' : 'month') : (currency === 'COP' ? 'año' : 'year')}</span></h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t(plan.description)}</p>
              <p className="mt-1 text-xs text-gray-500">{currency === 'COP' ? `≈ ${formatPlanPrice(planId, 'USD')} USD` : `${formatPlanPrice(planId, 'COP')} COP`}</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                <li className="flex gap-2"><FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {t(plan.interval === 'month' ? 'Suscripción mensual' : 'Suscripción anual')}</li>
                {plan.trialDays > 0 && <li className="flex gap-2"><FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {plan.trialDays} días de prueba antes del primer cobro</li>}
                <li className="flex gap-2"><FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {t('Puedes revisar las condiciones antes de pagar')}</li>
              </ul>
              <button type="button" onClick={() => navigate(`/pago/${planId}`, { state: { currency } })}
                className={`mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition ${isPro ? 'bg-[#dda15e] text-[#1d281d] hover:bg-[#efc083]' : 'bg-[#283618] text-white hover:bg-[#3b4c2c] dark:bg-[#dda15e] dark:text-[#1d281d]'}`}>
                {t('Revisar plan')} <FiArrowRight aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </div>

      <div className="mx-auto mt-6 flex max-w-4xl gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        <FiShield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>{t('La pasarela de pagos aún no está configurada. Esta página permite revisar la selección; no solicita tarjetas ni realiza cobros. Volverás a la aplicación al cerrar este aviso.')}</p>
      </div>
      <p className="mt-5 text-center text-sm text-gray-500"><Link to="/identificar" className="font-semibold text-[#536343] underline underline-offset-2 dark:text-[#e6b16c]">{t('Volver a la aplicación')}</Link></p>
    </div>
  );
};
