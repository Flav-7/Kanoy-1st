export type Language = "pt" | "es" | "en";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "pt", label: "PT", flag: "🇵🇹" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "en", label: "EN", flag: "🇬🇧" },
];

export const DEFAULT_LANGUAGE: Language = "pt";

type ServiceCopy = { title: string; text: string };
type StepCopy = { t: string; d: string };

export type Dictionary = {
  hero: { tagline: string; scrollHint: string };
  studio: { label: string; text: string };
  portal: { eyebrow: string; line: string };
  entrada: { scrollHint: string; requestPortfolio: string };
  nav: {
    services: string;
    about: string;
    problem: string;
    process: string;
    pricing: string;
    contact: string;
  };
  services: { eyebrow: string; title: string; items: ServiceCopy[] };
  process: { eyebrow: string; stepLabel: string; steps: StepCopy[] };
  about: { eyebrow: string; titleLine1: string; titleLine2: string; text: string };
  problem: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    items: ServiceCopy[];
    badges: { slow: string; mobile: string; design: string; conversions: string };
    scrollHint: string;
  };
  pricing: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    text: string;
    items: string[];
    included: string;
    needCustom: string;
    talkToUs: string;
    customNote: string;
  };
  contact: {
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    contactBtn: string;
    footerTagline: string;
    copyright: string;
    modal: {
      title: string;
      emailTitle: string;
      emailDesc: string;
      formTitle: string;
      formDesc: string;
      back: string;
      replyLanguageLabel: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      phoneLabel: string;
      phonePlaceholder: string;
      messageLabel: string;
      messagePlaceholder: string;
      submit: string;
      sending: string;
      successTitle: string;
      successText: string;
      errorText: string;
      retry: string;
      close: string;
    };
  };
};

export const translations: Record<Language, Dictionary> = {
  pt: {
    hero: {
      tagline: "Criamos experiências digitais que fazem marcas crescer",
      scrollHint: "Conhece o nosso trabalho",
    },
    studio: {
      label: "Portefólio",
      text: "Cada ecrã que passas é um projeto. Continua a mover-te.",
    },
    portal: {
      eyebrow: "A dobrar a realidade",
      line: "SOBRE A KANOY",
    },
    entrada: {
      scrollHint: "Desliza para entrar",
      requestPortfolio: "Pedir portefólio",
    },
    nav: {
      services: "Serviços",
      about: "Sobre",
      problem: "O problema",
      process: "Como trabalhamos",
      pricing: "Modelo",
      contact: "Contacto",
    },
    services: {
      eyebrow: "O que fazemos",
      title: "Serviços que fazem o teu negócio avançar.",
      items: [
        {
          title: "Websites à Medida",
          text: "Websites premium desenvolvidos especificamente para o teu negócio — sem templates.",
        },
        {
          title: "Sistemas Web",
          text: "Ferramentas e plataformas personalizadas que digitalizam a operação do teu negócio.",
        },
        {
          title: "Reservas Online",
          text: "Marcações, disponibilidade, notificações e gestão de clientes num único sistema.",
        },
        {
          title: "Alojamento & Manutenção",
          text: "Performance, segurança, atualizações e suporte contínuo.",
        },
        {
          title: "Automações",
          text: "Emails, notificações e workflows automáticos que eliminam tarefas repetitivas.",
        },
      ],
    },
    process: {
      eyebrow: "Como trabalhamos",
      stepLabel: "PASSO",
      steps: [
        {
          t: "Diz-nos o que precisas.",
          d: "Uma conversa breve sobre o teu negócio, os teus clientes e o que tem de acontecer online.",
        },
        {
          t: "Desenhamos a experiência.",
          d: "Direção, estrutura e movimento — pensados para a forma como as pessoas realmente usam o teu site.",
        },
        {
          t: "Construímos o website.",
          d: "Feito à mão, rápido, responsivo e preparado para ser editado e expandido depois.",
        },
        {
          t: "Integramos os sistemas.",
          d: "Reservas, marcações, calendários, automações — o que a operação precisar.",
        },
        { t: "Lançamos.", d: "Domínio, performance, tracking e um go-live controlado." },
        {
          t: "Mantemos e alojamos.",
          d: "Alojamento, atualizações, gestão técnica — o teu site mantém-se ativo e atual.",
        },
      ],
    },
    about: {
      eyebrow: "Sobre a KANOY",
      titleLine1: "NÃO CONSTRUÍMOS",
      titleLine2: "SÓ WEBSITES.",
      text: "A KANOY cria experiências digitais, websites e sistemas personalizados desenhados à volta da forma como um negócio realmente funciona. Cada projeto começa na realidade do cliente — as marcações, as agendas, os clientes, a pressão de uma operação real — e termina em algo que as pessoas recordam depois de fechar o separador.",
    },
    problem: {
      eyebrow: "O problema",
      titleLine1: "A maioria dos websites",
      titleLine2: "não está a cumprir o seu papel.",
      subtitle:
        "Problemas simples que afastam visitantes e limitam o crescimento do teu negócio.",
      items: [
        { title: "Lentos", text: "Visitantes desistem ao esperar demasiado." },
        { title: "Não adaptados a mobile", text: "Má experiência em telemóvel." },
        { title: "Design desatualizado", text: "Transmite pouco profissionalismo." },
        { title: "Falta de clareza", text: "Os visitantes não percebem o que fazes." },
        { title: "Não geram resultados", text: "Muitos visitantes, mas poucas conversões." },
        { title: "Difíceis de gerir", text: "Atualizações simples tornam-se complicadas." },
      ],
      badges: {
        slow: "Sites lentos",
        mobile: "Não adaptados a mobile",
        design: "Design desatualizado",
        conversions: "Poucas conversões",
      },
      scrollHint: "Scroll para explorar",
    },
    pricing: {
      eyebrow: "O modelo",
      titleLine1: "Criação do website",
      titleLine2: "+ gestão mensal",
      text: "A KANOY trabalha geralmente com uma fase de construção seguida de um serviço mensal. Sistemas personalizados e funcionalidades avançadas são orçamentados individualmente, consoante o que o projeto realmente precisa.",
      items: ["Alojamento", "Manutenção", "Atualizações", "Gestão técnica"],
      included: "incluído",
      needCustom: "Precisas de algo personalizado?",
      talkToUs: "Fala connosco",
      customNote:
        "Para projetos personalizados, contacta a KANOY para mais informações ou para pedir um portefólio de trabalhos anteriores.",
    },
    contact: {
      titleLine1: "VAMOS CONSTRUIR",
      titleLine2: "ALGO.",
      subtitle: "Diz-nos o que estás a pensar.",
      contactBtn: "Contactar a KANOY",
      footerTagline: "KANOY — Estúdio digital",
      copyright: "© 2026 KANOY. Todos os direitos reservados.",
      modal: {
        title: "Como preferes falar connosco?",
        emailTitle: "Enviar email direto",
        emailDesc: "Abre o teu email com tudo pronto — escreves e envias.",
        formTitle: "Preencher formulário",
        formDesc: "Diz-nos o que precisas, respondemos-te por email.",
        back: "Voltar",
        replyLanguageLabel: "Em que idioma preferes a resposta?",
        nameLabel: "Nome",
        namePlaceholder: "O teu nome",
        emailLabel: "Email",
        emailPlaceholder: "o-teu-email@exemplo.com",
        phoneLabel: "Telefone (opcional)",
        phonePlaceholder: "+351 900 000 000",
        messageLabel: "Mensagem",
        messagePlaceholder: "Conta-nos sobre o teu negócio e o que precisas.",
        submit: "Enviar mensagem",
        sending: "A enviar…",
        successTitle: "Mensagem enviada!",
        successText: "Obrigado. A KANOY vai responder-te em breve.",
        errorText: "Não foi possível enviar a mensagem. Tenta novamente ou usa o email direto.",
        retry: "Tentar novamente",
        close: "Fechar",
      },
    },
  },
  es: {
    hero: {
      tagline: "Creamos webs que hacen que la gente deje de hacer scroll.",
      scrollHint: "Desliza para entrar en el estudio",
    },
    studio: {
      label: "Portafolio",
      text: "Cada pantalla que pasas es un proyecto. Sigue moviéndote.",
    },
    portal: {
      eyebrow: "Doblando la realidad",
      line: "SOBRE KANOY",
    },
    entrada: {
      scrollHint: "Desliza para entrar",
      requestPortfolio: "Pedir portafolio",
    },
    nav: {
      services: "Servicios",
      about: "Sobre nosotros",
      problem: "El problema",
      process: "Cómo trabajamos",
      pricing: "El modelo",
      contact: "Contacto",
    },
    services: {
      eyebrow: "Lo que hacemos",
      title: "Servicios que hacen avanzar tu negocio.",
      items: [
        {
          title: "Webs a Medida",
          text: "Sitios web premium desarrollados específicamente para tu negocio — sin plantillas.",
        },
        {
          title: "Sistemas Web",
          text: "Herramientas y plataformas personalizadas que digitalizan la operación de tu negocio.",
        },
        {
          title: "Reservas Online",
          text: "Citas, disponibilidad, notificaciones y gestión de clientes en un único sistema.",
        },
        {
          title: "Alojamiento & Mantenimiento",
          text: "Rendimiento, seguridad, actualizaciones y soporte continuo.",
        },
        {
          title: "Automatizaciones",
          text: "Emails, notificaciones y workflows automáticos que eliminan tareas repetitivas.",
        },
      ],
    },
    process: {
      eyebrow: "Cómo trabajamos",
      stepLabel: "PASO",
      steps: [
        {
          t: "Cuéntanos lo que necesitas.",
          d: "Una conversación breve sobre tu negocio, tus clientes y lo que tiene que pasar online.",
        },
        {
          t: "Diseñamos la experiencia.",
          d: "Dirección, estructura y movimiento — pensados según cómo la gente usa realmente tu web.",
        },
        {
          t: "Construimos la web.",
          d: "Hecha a mano, rápida, responsive y preparada para editarse y ampliarse después.",
        },
        {
          t: "Integramos los sistemas.",
          d: "Reservas, citas, calendarios, automatizaciones — lo que la operación necesite.",
        },
        { t: "Lanzamos.", d: "Dominio, rendimiento, tracking y un lanzamiento controlado." },
        {
          t: "Mantenemos y alojamos.",
          d: "Alojamiento, actualizaciones, gestión técnica — tu web se mantiene activa y al día.",
        },
      ],
    },
    about: {
      eyebrow: "Sobre KANOY",
      titleLine1: "NO SOLO",
      titleLine2: "CONSTRUIMOS WEBS.",
      text: "KANOY crea experiencias digitales, webs y sistemas personalizados diseñados en torno a cómo funciona realmente un negocio. Cada proyecto empieza en la realidad del cliente — las reservas, las agendas, los clientes, la presión de una operación real — y termina siendo algo que la gente recuerda después de cerrar la pestaña.",
    },
    problem: {
      eyebrow: "El problema",
      titleLine1: "La mayoría de las webs",
      titleLine2: "no está cumpliendo su papel.",
      subtitle:
        "Problemas simples que alejan a los visitantes y limitan el crecimiento de tu negocio.",
      items: [
        { title: "Lentas", text: "Los visitantes se van al esperar demasiado." },
        { title: "No adaptadas a móvil", text: "Mala experiencia en el móvil." },
        { title: "Diseño desactualizado", text: "Transmite poco profesionalismo." },
        { title: "Falta de claridad", text: "Los visitantes no entienden qué haces." },
        { title: "No generan resultados", text: "Muchas visitas, pero pocas conversiones." },
        { title: "Difíciles de gestionar", text: "Actualizaciones simples se vuelven complicadas." },
      ],
      badges: {
        slow: "Webs lentas",
        mobile: "No adaptadas a móvil",
        design: "Diseño desactualizado",
        conversions: "Pocas conversiones",
      },
      scrollHint: "Desliza para explorar",
    },
    pricing: {
      eyebrow: "El modelo",
      titleLine1: "Creación de la web",
      titleLine2: "+ gestión mensual",
      text: "KANOY suele trabajar con una fase de construcción seguida de un servicio mensual. Los sistemas personalizados y las funcionalidades avanzadas se presupuestan individualmente, según lo que el proyecto realmente necesite.",
      items: ["Alojamiento", "Mantenimiento", "Actualizaciones", "Gestión técnica"],
      included: "incluido",
      needCustom: "¿Necesitas algo personalizado?",
      talkToUs: "Habla con nosotros",
      customNote:
        "Para proyectos personalizados, contacta con KANOY para más información o para pedir un portafolio de trabajos anteriores.",
    },
    contact: {
      titleLine1: "CONSTRUYAMOS",
      titleLine2: "ALGO.",
      subtitle: "Cuéntanos qué estás pensando.",
      contactBtn: "Contactar con KANOY",
      footerTagline: "KANOY — Estudio digital",
      copyright: "© 2026 KANOY. Todos los derechos reservados.",
      modal: {
        title: "¿Cómo prefieres hablar con nosotros?",
        emailTitle: "Enviar email directo",
        emailDesc: "Abre tu email con todo listo — escribes y envías.",
        formTitle: "Rellenar formulario",
        formDesc: "Cuéntanos qué necesitas, te respondemos por email.",
        back: "Volver",
        replyLanguageLabel: "¿En qué idioma prefieres la respuesta?",
        nameLabel: "Nombre",
        namePlaceholder: "Tu nombre",
        emailLabel: "Email",
        emailPlaceholder: "tu-email@ejemplo.com",
        phoneLabel: "Teléfono (opcional)",
        phonePlaceholder: "+34 600 000 000",
        messageLabel: "Mensaje",
        messagePlaceholder: "Cuéntanos sobre tu negocio y qué necesitas.",
        submit: "Enviar mensaje",
        sending: "Enviando…",
        successTitle: "¡Mensaje enviado!",
        successText: "Gracias. KANOY te responderá pronto.",
        errorText: "No se pudo enviar el mensaje. Inténtalo de nuevo o usa el email directo.",
        retry: "Intentar de nuevo",
        close: "Cerrar",
      },
    },
  },
  en: {
    hero: {
      tagline: "We build websites that make people stop scrolling.",
      scrollHint: "Scroll to enter the studio",
    },
    studio: {
      label: "Portfolio",
      text: "Every screen you pass is a project. Keep moving.",
    },
    portal: {
      eyebrow: "Bending reality",
      line: "ABOUT KANOY",
    },
    entrada: {
      scrollHint: "Scroll to enter",
      requestPortfolio: "Request portfolio",
    },
    nav: {
      services: "Services",
      about: "About",
      problem: "The problem",
      process: "How we work",
      pricing: "Pricing",
      contact: "Contact",
    },
    services: {
      eyebrow: "What we do",
      title: "Services that move your business forward.",
      items: [
        {
          title: "Custom Websites",
          text: "Premium websites developed specifically for your business — no templates.",
        },
        {
          title: "Web Systems",
          text: "Custom tools and platforms that digitize the way your business operates.",
        },
        {
          title: "Online Bookings",
          text: "Appointments, availability, notifications and customer management in one system.",
        },
        {
          title: "Hosting & Maintenance",
          text: "Performance, security, updates and ongoing support.",
        },
        {
          title: "Automations",
          text: "Emails, notifications and automatic workflows that remove repetitive tasks.",
        },
      ],
    },
    process: {
      eyebrow: "How we work",
      stepLabel: "STEP",
      steps: [
        {
          t: "Tell us what you need.",
          d: "A short conversation about your business, your clients and what has to happen online.",
        },
        {
          t: "We design the experience.",
          d: "Direction, structure and motion — designed around how people actually use your site.",
        },
        {
          t: "We build the website.",
          d: "Hand-built, fast, responsive and made to be edited and extended later.",
        },
        {
          t: "We integrate the systems.",
          d: "Reservations, bookings, calendars, automations — whatever the operation needs.",
        },
        { t: "We launch.", d: "Domain, performance, tracking and a controlled go-live." },
        {
          t: "We maintain and host it.",
          d: "Hosting, updates, technical management — your site stays alive and current.",
        },
      ],
    },
    about: {
      eyebrow: "About KANOY",
      titleLine1: "WE DON'T JUST",
      titleLine2: "BUILD WEBSITES.",
      text: "KANOY creates digital experiences, websites and custom systems designed around the way a business actually operates. Every project starts from the client's reality — the bookings, the calendars, the customers, the pressure of a real operation — and ends as something people remember after they close the tab.",
    },
    problem: {
      eyebrow: "The problem",
      titleLine1: "Most websites",
      titleLine2: "aren't doing their job.",
      subtitle: "Simple problems that drive visitors away and limit your business's growth.",
      items: [
        { title: "Slow", text: "Visitors give up waiting too long." },
        { title: "Not mobile-friendly", text: "Poor experience on phones." },
        { title: "Outdated design", text: "Comes across as unprofessional." },
        { title: "Lack of clarity", text: "Visitors don't understand what you do." },
        { title: "Don't generate results", text: "Lots of visitors, but few conversions." },
        { title: "Hard to manage", text: "Simple updates become complicated." },
      ],
      badges: {
        slow: "Slow sites",
        mobile: "Not mobile-friendly",
        design: "Outdated design",
        conversions: "Few conversions",
      },
      scrollHint: "Scroll to explore",
    },
    pricing: {
      eyebrow: "The model",
      titleLine1: "Website creation",
      titleLine2: "+ monthly management",
      text: "KANOY generally works with a build phase followed by a monthly service. Custom systems and advanced functionality are quoted individually, based on what the project really needs.",
      items: ["Hosting", "Maintenance", "Updates", "Technical management"],
      included: "included",
      needCustom: "Need something custom?",
      talkToUs: "Talk to us",
      customNote:
        "For custom projects, contact KANOY for more information or to request a portfolio of previous work.",
    },
    contact: {
      titleLine1: "LET'S BUILD",
      titleLine2: "SOMETHING.",
      subtitle: "Tell us what you're thinking.",
      contactBtn: "Contact KANOY",
      footerTagline: "KANOY — Digital studio",
      copyright: "© 2026 KANOY. All rights reserved.",
      modal: {
        title: "How would you like to reach us?",
        emailTitle: "Send a direct email",
        emailDesc: "Opens your email app with everything ready — just write and send.",
        formTitle: "Fill out a form",
        formDesc: "Tell us what you need and we'll get back to you by email.",
        back: "Back",
        replyLanguageLabel: "Which language would you like the reply in?",
        nameLabel: "Name",
        namePlaceholder: "Your name",
        emailLabel: "Email",
        emailPlaceholder: "your-email@example.com",
        phoneLabel: "Phone (optional)",
        phonePlaceholder: "+1 555 000 0000",
        messageLabel: "Message",
        messagePlaceholder: "Tell us about your business and what you need.",
        submit: "Send message",
        sending: "Sending…",
        successTitle: "Message sent!",
        successText: "Thanks. KANOY will get back to you soon.",
        errorText: "Couldn't send the message. Try again or use the direct email.",
        retry: "Try again",
        close: "Close",
      },
    },
  },
};
