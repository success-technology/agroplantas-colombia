import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink, FiInfo, FiShield } from 'react-icons/fi';

const privacyPolicyUrl = 'https://docs.google.com/document/d/1faG70ka6WdizoJzSQyy2DRVy-1G8zC-myIB8FCKK3ks/edit?usp=sharing';
const cookiesPolicyUrl = 'https://docs.google.com/document/d/1NHLL_odxoG5_B9Q5iqfcRWFxHZE72iTi6G5dBfxKHDI/edit?usp=sharing';

/** Enlace común para abrir una política alojada fuera de la aplicación. */
const PolicyLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#283618] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#385026] focus:outline-none focus:ring-2 focus:ring-[#DDA15E] dark:bg-[#DDA15E] dark:text-[#1d281d] dark:hover:bg-[#efc083]"
  >
    {children} <FiExternalLink aria-hidden="true" />
  </a>
);

/** Página pública que enlaza las políticas oficiales de privacidad y cookies. */
export const PrivacidadPage: React.FC = () => (
  <section className="min-h-[70vh] bg-[#FEFAE0] px-4 py-10 text-[#283618] dark:bg-[#182014] dark:text-[#f5f5e8] sm:px-8">
    <article className="mx-auto max-w-3xl rounded-2xl border border-[#283618]/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#202b1d] sm:p-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#385026] hover:underline dark:text-[#efc083]">
        <FiArrowLeft aria-hidden="true" /> Volver a AgroPlantas
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#8a5b20] dark:text-[#efc083]">AgroPlantas Colombia</p>
      <h1 className="mt-2 text-3xl font-bold">Privacidad y cookies</h1>
      <p className="mt-3 leading-7 text-gray-700 dark:text-gray-300">
        Lee los documentos oficiales de privacidad y uso de cookies de AgroPlantas Colombia. Se abrirán en Google Docs.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <section className="rounded-xl border border-[#283618]/15 p-5 dark:border-white/10">
          <FiShield className="text-2xl text-[#385026] dark:text-[#efc083]" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">Política de privacidad</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">Información sobre privacidad y tratamiento de datos personales.</p>
          <PolicyLink href={privacyPolicyUrl}>Leer política de privacidad</PolicyLink>
        </section>

        <section className="rounded-xl border border-[#283618]/15 p-5 dark:border-white/10">
          <FiInfo className="text-2xl text-[#385026] dark:text-[#efc083]" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">Política de cookies</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">Consulta la información sobre cookies y tecnologías similares.</p>
          <PolicyLink href={cookiesPolicyUrl}>Leer política de cookies</PolicyLink>
        </section>
      </div>

      <p className="mt-7 border-t border-gray-200 pt-5 text-sm text-gray-600 dark:border-[#43513b] dark:text-gray-300">
        Puedes volver a cambiar tu elección desde <button type="button" onClick={() => window.dispatchEvent(new Event('agroplantas:open-cookie-preferences'))} className="font-semibold underline underline-offset-2">Configurar cookies</button> en el pie de página.
      </p>
    </article>
  </section>
);
