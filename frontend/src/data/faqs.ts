/** Catálogo de preguntas frecuentes agrupado por tema para la página de ayuda. */
export type FAQCategory = 'Identificación' | 'Cuenta e historial' | 'Uso de la aplicación' | 'Privacidad y soporte';

export interface FAQItem {
  question: string;
  answer: string;
  category: FAQCategory;
}

export const FAQS: FAQItem[] = [
  {
    category: 'Identificación',
    question: '¿Cómo tomo una buena foto para identificar mi cultivo?',
    answer: 'Enfoca una sola planta u hoja, procura tener buena luz natural y evita el contraluz. Acércate lo suficiente para que se vean sus características, mantén la cámara estable y evita que otros objetos tapen la planta.',
  },
  {
    category: 'Identificación',
    question: '¿Por qué la aplicación no reconoce mi planta?',
    answer: 'Puede que la especie no esté entre las que reconoce el modelo o que la foto tenga poca luz, esté borrosa o muestre la planta desde muy lejos. Intenta tomar otra imagen y consulta la Biblioteca para ver las especies disponibles.',
  },
  {
    category: 'Identificación',
    question: '¿Cómo interpreto el resultado de la identificación?',
    answer: 'Revisa el nombre sugerido y la información asociada. La identificación automática es una orientación; contrasta el resultado con las características visibles de la planta y consulta a un profesional si necesitas tomar decisiones de manejo o tratamiento.',
  },
  {
    category: 'Identificación',
    question: '¿Puedo identificar una planta con una foto guardada?',
    answer: 'Sí. En la sección Identificar puedes seleccionar una imagen de tu dispositivo o tomar una foto con la cámara. Si el resultado no es claro, prueba con una imagen más nítida y bien iluminada.',
  },
  {
    category: 'Identificación',
    question: '¿Qué hago si la imagen no carga?',
    answer: 'Comprueba que el archivo sea una imagen compatible, que no esté dañado y que tu conexión a internet funcione. También puedes volver a tomar la foto o seleccionar otro archivo.',
  },
  {
    category: 'Cuenta e historial',
    question: '¿Necesito una cuenta para usar la aplicación?',
    answer: 'Puedes probar la identificación sin iniciar sesión. Para acceder a las funciones personales, como consultar tu historial guardado, inicia sesión o crea una cuenta.',
  },
  {
    category: 'Cuenta e historial',
    question: '¿Cómo inicio sesión con Google?',
    answer: 'Entra a Iniciar sesión y selecciona Continuar con Google. Si el botón no aparece o muestra un error, verifica tu conexión e inténtalo de nuevo; también puedes escribir a soporte desde esta página.',
  },
  {
    category: 'Cuenta e historial',
    question: '¿Dónde encuentro mis identificaciones anteriores?',
    answer: 'Inicia sesión con la misma cuenta que usaste al identificarlas y abre Mis identificaciones o Historial desde la navegación. Las consultas hechas sin sesión no se agregan al historial personal.',
  },
  {
    category: 'Cuenta e historial',
    question: '¿Cómo cambio o recupero mi contraseña?',
    answer: 'En la pantalla de inicio de sesión usa la opción “Olvidé mi contraseña” y sigue las instrucciones enviadas a tu correo. Si te registraste con Google, inicia sesión mediante Google.',
  },
  {
    category: 'Uso de la aplicación',
    question: '¿Qué puedo consultar en la Biblioteca?',
    answer: 'La Biblioteca reúne información de las plantas disponibles en la aplicación. Puedes explorarla y abrir la ficha de una especie para revisar sus detalles.',
  },
  {
    category: 'Uso de la aplicación',
    question: '¿La aplicación funciona sin internet?',
    answer: 'La identificación y otras funciones que consultan el servicio necesitan conexión a internet. Si la conexión se interrumpe, espera a recuperarla y vuelve a intentar la operación.',
  },
  {
    category: 'Uso de la aplicación',
    question: '¿La identificación reemplaza el diagnóstico de un agrónomo?',
    answer: 'No. El resultado es una ayuda informativa y puede equivocarse. Para decisiones sobre plagas, enfermedades o tratamientos, confirma el diagnóstico con un profesional agrícola.',
  },
  {
    category: 'Privacidad y soporte',
    question: '¿Mis datos se comparten con otras personas?',
    answer: 'Las identificaciones asociadas a tu cuenta se consultan desde tu sesión. Las consultas realizadas sin iniciar sesión no se guardan en tu historial personal. No compartas tu contraseña y cierra la sesión en dispositivos compartidos.',
  },
  {
    category: 'Privacidad y soporte',
    question: '¿Cómo escribo a soporte?',
    answer: 'En la página Soporte puedes redactar un mensaje con el asunto y la descripción del problema. Al enviarlo, se abrirá la aplicación de correo predeterminada para que revises y envíes el mensaje.',
  },
  {
    category: 'Privacidad y soporte',
    question: '¿Qué información incluyo al reportar un problema?',
    answer: 'Describe qué estabas intentando hacer, qué ocurrió y los pasos para reproducirlo. Si aparece un mensaje de error, cópialo. No incluyas contraseñas ni información sensible.',
  },
];

export const FAQ_CATEGORIES: FAQCategory[] = [
  'Identificación',
  'Cuenta e historial',
  'Uso de la aplicación',
  'Privacidad y soporte',
];
