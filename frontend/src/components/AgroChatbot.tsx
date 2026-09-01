import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiSend, FiX, FiLoader, FiMail, FiExternalLink } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

interface Message {
  from: 'user' | 'assistant';
  text: string;
}

const SUPPORT_EMAIL = 'soporte@agroplantascolombia.com';
const SUPPORT_WHATSAPP = '573001234567';
const QUICK_QUESTIONS = ['¿Cómo riego mi cultivo?', '¿Qué hago contra las plagas?', 'Necesito soporte'];

const answerQuestion = (question: string): string => {
  const normalized = question.toLowerCase();
  if (normalized.includes('riego') || normalized.includes('agua')) {
    return 'Riega temprano o al final de la tarde, directamente sobre el suelo. Comprueba la humedad antes de volver a regar y evita encharcamientos para proteger las raíces.';
  }
  if (normalized.includes('plaga') || normalized.includes('insect')) {
    return 'Revisa el envés de las hojas y actúa al detectar los primeros síntomas. Prioriza control integrado, retira las partes afectadas y usa productos autorizados siguiendo siempre la etiqueta.';
  }
  if (normalized.includes('foto') || normalized.includes('cámara') || normalized.includes('camara')) {
    return 'Toma la foto con buena luz, enfoca la hoja o zona afectada, evita fondos muy cargados y acerca la cámara sin cortar la planta. Puedes alternar entre cámara frontal y trasera.';
  }
  if (normalized.includes('enfermedad') || normalized.includes('mancha') || normalized.includes('hoja')) {
    return 'Aísla la planta si es posible, revisa hojas y tallos, y evita mojar el follaje. Sube una foto nítida a Identificar planta; el resultado es una orientación y los casos graves deben confirmarse con un técnico.';
  }
  if (normalized.includes('fertiliz') || normalized.includes('abono')) {
    return 'Fertiliza según la etapa del cultivo y, si puedes, con base en un análisis de suelo. El compost mejora la estructura del terreno; evita excederte con nitrógeno porque produce crecimiento débil.';
  }
  if (normalized.includes('soporte') || normalized.includes('ayuda') || normalized.includes('contact') || normalized.includes('ticket')) {
    return 'Claro. Puedes crear un ticket desde el formulario de soporte o contactarnos directamente por correo y WhatsApp. Te dejo las opciones aquí abajo.';
  }
  return 'Puedo orientarte sobre riego, fertilización, plagas, enfermedades y cómo tomar fotos para el diagnóstico. Cuéntame qué cultivo tienes y qué síntomas observas.';
};

export const AgroChatbot: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { from: 'assistant', text: 'Hola, soy tu asistente de campo. ¿Qué ocurre con tu cultivo?' },
  ]);
  const [thinking, setThinking] = useState(false);
  const [ticketReference, setTicketReference] = useState<string | null>(null);

  const sendMessage = (text = input) => {
    const question = text.trim();
    if (!question || thinking) return;
    setInput('');
    setMessages((current) => [...current, { from: 'user', text: question }]);
    if (/soporte|ayuda|contact|ticket/i.test(question)) {
      setTicketReference(`AP-${Date.now().toString().slice(-6)}`);
    }
    setThinking(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { from: 'assistant', text: answerQuestion(question) }]);
      setThinking(false);
    }, 350);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[90] sm:right-6">
      {open && (
        <section className="mb-3 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-2xl bg-white dark:bg-[#24301f] shadow-2xl border border-gray-200 dark:border-white/10">
          <header className="flex items-center justify-between bg-[#283618] px-4 py-3 text-white">
            <div>
              <h2 className="font-semibold text-sm">Asistente AgroPlantas</h2>
              <p className="text-xs text-[#FEFAE0]/75">Orientación rápida para tu cultivo</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar chatbot">
              <FiX className="w-5 h-5" />
            </button>
          </header>
          <div className="max-h-80 space-y-3 overflow-y-auto p-3" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm ${message.from === 'user' ? 'bg-[#DDA15E] text-white rounded-br-sm' : 'bg-gray-100 dark:bg-[#303d2a] text-gray-700 dark:text-gray-200 rounded-bl-sm'}`}>
                  {message.text}
                </p>
              </div>
            ))}
            {thinking && <FiLoader className="w-4 h-4 animate-spin text-[#DDA15E]" aria-label="Preparando respuesta" />}
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 pb-3">
            {QUICK_QUESTIONS.map((question) => (
              <button key={question} type="button" onClick={() => sendMessage(question)} className="shrink-0 rounded-full border border-[#DDA15E]/50 px-3 py-1.5 text-xs text-[#283618] dark:text-[#DDA15E] hover:bg-[#DDA15E]/10">
                {question}
              </button>
            ))}
          </div>
          {ticketReference && (
            <div className="mx-3 mb-3 rounded-xl border border-[#DDA15E]/40 bg-[#FEFAE0] p-3 dark:bg-[#303d2a]">
              <p className="text-xs font-semibold text-[#283618] dark:text-[#DDA15E]">Soporte disponible</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Referencia: {ticketReference}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => navigate('/soporte', { state: { ticketReference } })} className="flex flex-col items-center gap-1 rounded-lg bg-[#283618] px-2 py-2 text-[11px] text-white hover:bg-[#1e290f]">
                  <FiExternalLink className="h-4 w-4" />
                  Crear ticket
                </button>
                <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Ticket ${ticketReference}`)}`} className="flex flex-col items-center gap-1 rounded-lg border border-[#283618]/20 px-2 py-2 text-[11px] text-[#283618] dark:border-[#DDA15E]/40 dark:text-[#DDA15E]">
                  <FiMail className="h-4 w-4" />
                  Correo
                </a>
                <a href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hola, necesito soporte. Referencia ${ticketReference}`)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 rounded-lg border border-green-600/30 px-2 py-2 text-[11px] text-green-700 dark:text-green-400">
                  <FaWhatsapp className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
              <p className="mt-2 break-all text-[10px] text-gray-500 dark:text-gray-400">{SUPPORT_EMAIL} · +57 300 123 4567</p>
            </div>
          )}
          <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="flex gap-2 border-t border-gray-100 dark:border-white/10 p-3">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe tu consulta..." className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DDA15E]/50 dark:border-gray-600 dark:bg-[#182014] dark:text-white" aria-label="Consulta para el asistente" />
            <button type="submit" disabled={!input.trim() || thinking} aria-label="Enviar consulta" className="rounded-lg bg-[#DDA15E] px-3 text-white disabled:opacity-40"><FiSend /></button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#DDA15E] text-white shadow-lg transition-transform hover:scale-105">
        <FiMessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
};