import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiChevronDown, FiHelpCircle, FiMessageCircle, FiSearch } from 'react-icons/fi';
import { FAQS, FAQ_CATEGORIES, FAQCategory } from '../data/faqs';
import { useLanguage } from '../lib/languageStore';

/** Busca, filtra y despliega respuestas por tema del centro de ayuda. */
export const PreguntasFrecuentesPage: React.FC = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FAQCategory | 'Todas'>('Todas');
  // Aplica búsqueda y categoría sobre preguntas y respuestas.
  const filteredFAQs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    return FAQS.filter((faq) => {
      const matchesCategory = category === 'Todas' || faq.category === category;
      const matchesQuery = !normalizedQuery || `${faq.question} ${faq.answer} ${faq.category}`.toLocaleLowerCase('es').includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/soporte" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#536343] transition hover:text-[#283618] dark:text-[#d6dccd] dark:hover:text-[#e6b16c]">
        <FiArrowLeft aria-hidden="true" /> {t('Volver a soporte')}
      </Link>

      <section className="mb-7 rounded-3xl bg-[#283618] px-6 py-8 text-[#FEFAE0] shadow-sm sm:px-9 sm:py-10">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#e6b16c]">
            <FiHelpCircle className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#e6b16c]">{t('Centro de ayuda')}</p>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{t('Preguntas frecuentes')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#FEFAE0]/75 sm:text-base">
              {t('Encuentra respuestas sobre identificación de plantas, tu cuenta y el uso de AgroPlantas Colombia.')}
            </p>
          </div>
        </div>
        <label className="mt-6 flex items-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-3 text-gray-500 shadow-sm focus-within:ring-2 focus-within:ring-[#e6b16c]">
          <FiSearch className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="sr-only">{t('Buscar preguntas')}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('Busca por tema o palabra clave...')}
            className="w-full border-0 bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
          />
        </label>
      </section>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]" aria-label="Filtrar por categoría">
        {(['Todas', ...FAQ_CATEGORIES] as Array<FAQCategory | 'Todas'>).map((item) => {
          const selected = item === category;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={selected}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dda15e] ${
                selected
                  ? 'border-[#283618] bg-[#283618] text-white dark:border-[#dda15e] dark:bg-[#dda15e] dark:text-[#1d281d]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-[#dda15e] hover:text-[#283618] dark:border-[#43513b] dark:bg-[#24301f] dark:text-gray-200 dark:hover:text-[#e6b16c]'
              }`}
            >
              {t(item)}
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">{filteredFAQs.length} {t(filteredFAQs.length === 1 ? 'respuesta' : 'respuestas')}</h2>
        {query && <button type="button" onClick={() => setQuery('')} className="text-xs font-semibold text-[#536343] underline underline-offset-2 hover:text-[#283618] dark:text-[#e6b16c]">{t('Limpiar búsqueda')}</button>}
      </div>

      <div className="space-y-3">
        {filteredFAQs.map((faq) => (
          <details key={faq.question} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition open:border-[#dda15e]/60 dark:border-[#43513b] dark:bg-[#24301f]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left marker:hidden [&::-webkit-details-marker]:hidden">
              <span>
                <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#71805d] dark:text-[#e6b16c]">{t(faq.category)}</span>
                <span className="text-sm font-bold leading-6 text-gray-900 dark:text-gray-100">{t(faq.question)}</span>
              </span>
              <FiChevronDown className="h-5 w-5 shrink-0 text-[#71805d] transition-transform duration-200 group-open:rotate-180 dark:text-[#e6b16c]" aria-hidden="true" />
            </summary>
            <div className="border-t border-gray-100 px-5 py-4 text-sm leading-6 text-gray-600 dark:border-[#43513b] dark:text-gray-300">
              {t(faq.answer)}
            </div>
          </details>
        ))}
        {filteredFAQs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center dark:border-[#43513b] dark:bg-[#24301f]">
            <FiSearch className="mx-auto mb-3 h-6 w-6 text-gray-400" aria-hidden="true" />
            <p className="font-bold text-gray-800 dark:text-gray-100">{t('No encontramos preguntas con esos términos.')}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('Prueba con otra palabra o cambia la categoría.')}</p>
          </div>
        )}
      </div>

      <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#e5d8bd] bg-[#f6f0dd] p-5 sm:flex-row sm:items-center sm:justify-between dark:border-[#43513b] dark:bg-[#202b1d]">
        <div className="flex items-start gap-3">
          <FiMessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#71805d] dark:text-[#e6b16c]" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">{t('¿No encontraste lo que buscabas?')}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('Cuéntanos qué necesitas y el equipo de soporte te ayudará.')}</p>
          </div>
        </div>
        <Link to="/soporte" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#283618] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#3b4c2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dda15e] dark:bg-[#dda15e] dark:text-[#1d281d] dark:hover:bg-[#efc083]">
          {t('Ir a soporte')}
        </Link>
      </section>
    </div>
  );
};
