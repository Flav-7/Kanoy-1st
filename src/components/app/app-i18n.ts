import type { Language } from "@/lib/i18n/translations";

type AppCopy = {
  login: { welcome: string; text: string; email: string; submit: string; continueToSite: string };
  greeting: { morning: string; afternoon: string; evening: string };
  enterCode: string;
  enterPassword: string;
  unlockWithBiometrics: Record<"faceId" | "biometrics", string>;
  enter: string;
  recoverCode: string;
  useCode: string;
  password: string;
  wrongCode: (left: number) => string;
  signedOutTooMany: string;
  wrongPassword: string;
  rateLimited: string;
  biometricsFailed: string;
  notYou: (name: string) => string;
  signOut: string;
  delete: string;
  digit: (d: number) => string;
  setup: {
    createTitle: string;
    createText: string;
    confirmTitle: string;
    mismatch: string;
    tooSimple: string;
    biometricsTitle: Record<"faceId" | "biometrics", string>;
    biometricsText: string;
    enableBiometrics: string;
    notNow: string;
    skipCode: string;
    done: string;
  };
  menu: { site: string; calendar: string; account: string; signOut: string };
  account: {
    title: string;
    profile: string;
    name: string;
    jobTitle: string;
    jobTitleHint: string;
    save: string;
    saved: string;
    security: string;
    securityText: string;
    method: string;
    methods: { pin: string; passkey: Record<"faceId" | "biometrics", string>; password: string };
    changeCode: string;
    createCode: string;
    newCode: string;
    codeSaved: string;
    devices: string;
    noDevices: string;
    addThisDevice: Record<"faceId" | "biometrics", string>;
    deviceAdded: string;
    remove: string;
    lastUsed: string;
    never: string;
    notSupported: string;
    needsCode: string;
    needsDevice: string;
    notifications: string;
    error: string;
  };
};

const PT: AppCopy = {
  login: {
    welcome: "Bem-vindo à KANOY",
    text: "Entre com a sua conta da equipa.",
    email: "Email",
    submit: "Entrar",
    continueToSite: "Continuar para o site",
  },
  greeting: { morning: "Bom dia", afternoon: "Boa tarde", evening: "Boa noite" },
  enterCode: "Introduza o seu código KANOY",
  enterPassword: "Introduza a sua palavra-passe",
  unlockWithBiometrics: { faceId: "Entrar com Face ID", biometrics: "Entrar com biometria" },
  enter: "Entrar",
  recoverCode: "Recuperar código",
  useCode: "Usar código",
  password: "Palavra-passe",
  wrongCode: (n) => `Código errado. ${n === 1 ? "Resta 1 tentativa" : `Restam ${n} tentativas`}.`,
  signedOutTooMany: "Demasiadas tentativas. Por segurança, entre novamente com a palavra-passe.",
  wrongPassword: "Palavra-passe errada.",
  rateLimited: "Demasiadas tentativas. Aguarde 15 minutos.",
  biometricsFailed: "Não foi possível confirmar. Tente de novo ou use o código.",
  notYou: (name) => `Não é ${name}?`,
  signOut: "Terminar sessão",
  delete: "Apagar",
  digit: (d) => String(d),
  setup: {
    createTitle: "Crie o seu código",
    createText: "6 dígitos para abrir a app sem escrever a palavra-passe.",
    confirmTitle: "Confirme o código",
    mismatch: "Os códigos não coincidem. Tente de novo.",
    tooSimple: "Código demasiado fácil (ex.: 123456, 000000). Escolha outro.",
    biometricsTitle: { faceId: "Ativar Face ID?", biometrics: "Ativar biometria?" },
    biometricsText: "Abra a app só com o olhar ou o dedo. O código continua a funcionar.",
    enableBiometrics: "Ativar",
    notNow: "Agora não",
    skipCode: "Prefiro usar a palavra-passe",
    done: "Pronto",
  },
  menu: {
    site: "Ver site",
    calendar: "Calendário",
    account: "Minha conta",
    signOut: "Terminar sessão",
  },
  account: {
    title: "Minha conta",
    profile: "Perfil",
    name: "Nome",
    jobTitle: "Função na empresa",
    jobTitleHint: "Aparece no calendário em vez do nome.",
    save: "Guardar",
    saved: "Guardado.",
    security: "Entrada na app",
    securityText:
      "Na app instalada no telemóvel/tablet, é pedido ao abrir e sempre que volta depois de 5 minutos fora. No browser do computador entra-se com a palavra-passe.",
    method: "Como quer entrar",
    methods: {
      pin: "Código",
      passkey: { faceId: "Face ID", biometrics: "Biometria" },
      password: "Palavra-passe",
    },
    changeCode: "Mudar código",
    createCode: "Criar código",
    newCode: "Novo código (6 dígitos)",
    codeSaved: "Código guardado.",
    devices: "Dispositivos com Face ID / biometria",
    noDevices: "Nenhum dispositivo ainda.",
    addThisDevice: {
      faceId: "Ativar Face ID neste dispositivo",
      biometrics: "Ativar biometria neste dispositivo",
    },
    deviceAdded: "Dispositivo adicionado.",
    remove: "Remover",
    lastUsed: "Último uso",
    never: "nunca",
    notSupported: "Este dispositivo não suporta Face ID/biometria para sites.",
    needsCode: "Crie primeiro um código.",
    needsDevice: "Ative primeiro Face ID/biometria num dispositivo.",
    notifications: "Notificações",
    error: "Algo correu mal. Tente outra vez.",
  },
};

const ES: AppCopy = {
  ...PT,
  login: {
    welcome: "Bienvenido a KANOY",
    text: "Entra con tu cuenta del equipo.",
    email: "Email",
    submit: "Entrar",
    continueToSite: "Continuar al sitio",
  },
  greeting: { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches" },
  enterCode: "Introduce tu código KANOY",
  enterPassword: "Introduce tu contraseña",
  unlockWithBiometrics: { faceId: "Entrar con Face ID", biometrics: "Entrar con biometría" },
  recoverCode: "Recuperar código",
  useCode: "Usar código",
  password: "Contraseña",
  wrongCode: (n) => `Código incorrecto. ${n === 1 ? "Queda 1 intento" : `Quedan ${n} intentos`}.`,
  signedOutTooMany: "Demasiados intentos. Por seguridad, vuelve a entrar con la contraseña.",
  wrongPassword: "Contraseña incorrecta.",
  rateLimited: "Demasiados intentos. Espera 15 minutos.",
  biometricsFailed: "No se ha podido confirmar. Inténtalo de nuevo o usa el código.",
  notYou: (name) => `¿No eres ${name}?`,
  signOut: "Cerrar sesión",
  delete: "Borrar",
  setup: {
    createTitle: "Crea tu código",
    createText: "6 dígitos para abrir la app sin escribir la contraseña.",
    confirmTitle: "Confirma el código",
    mismatch: "Los códigos no coinciden. Inténtalo de nuevo.",
    tooSimple: "Código demasiado fácil (p. ej. 123456, 000000). Elige otro.",
    biometricsTitle: { faceId: "¿Activar Face ID?", biometrics: "¿Activar biometría?" },
    biometricsText: "Abre la app solo con la mirada o el dedo. El código sigue funcionando.",
    enableBiometrics: "Activar",
    notNow: "Ahora no",
    skipCode: "Prefiero usar la contraseña",
    done: "Listo",
  },
  menu: {
    site: "Ver sitio",
    calendar: "Calendario",
    account: "Mi cuenta",
    signOut: "Cerrar sesión",
  },
  account: {
    ...PT.account,
    title: "Mi cuenta",
    profile: "Perfil",
    name: "Nombre",
    jobTitle: "Función en la empresa",
    jobTitleHint: "Aparece en el calendario en lugar del nombre.",
    saved: "Guardado.",
    security: "Acceso a la app",
    securityText:
      "En la app instalada en el móvil/tablet se pide al abrirla y cada vez que vuelves tras 5 minutos fuera. En el navegador del ordenador se entra con la contraseña.",
    method: "Cómo quieres entrar",
    methods: {
      pin: "Código",
      passkey: { faceId: "Face ID", biometrics: "Biometría" },
      password: "Contraseña",
    },
    changeCode: "Cambiar código",
    createCode: "Crear código",
    newCode: "Nuevo código (6 dígitos)",
    codeSaved: "Código guardado.",
    devices: "Dispositivos con Face ID / biometría",
    noDevices: "Ningún dispositivo todavía.",
    addThisDevice: {
      faceId: "Activar Face ID en este dispositivo",
      biometrics: "Activar biometría en este dispositivo",
    },
    deviceAdded: "Dispositivo añadido.",
    remove: "Quitar",
    lastUsed: "Último uso",
    never: "nunca",
    notSupported: "Este dispositivo no admite Face ID/biometría para sitios web.",
    needsCode: "Crea primero un código.",
    needsDevice: "Activa primero Face ID/biometría en un dispositivo.",
    notifications: "Notificaciones",
    error: "Algo ha salido mal. Inténtalo de nuevo.",
  },
};

const EN: AppCopy = {
  ...PT,
  login: {
    welcome: "Welcome to KANOY",
    text: "Sign in with your team account.",
    email: "Email",
    submit: "Sign in",
    continueToSite: "Continue to the site",
  },
  greeting: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
  enterCode: "Enter your KANOY code",
  enterPassword: "Enter your password",
  unlockWithBiometrics: { faceId: "Unlock with Face ID", biometrics: "Unlock with biometrics" },
  enter: "Unlock",
  recoverCode: "Forgot code",
  useCode: "Use code",
  password: "Password",
  wrongCode: (n) => `Wrong code. ${n === 1 ? "1 try left" : `${n} tries left`}.`,
  signedOutTooMany: "Too many tries. For security, sign in again with your password.",
  wrongPassword: "Wrong password.",
  rateLimited: "Too many tries. Wait 15 minutes.",
  biometricsFailed: "Couldn't confirm it's you. Try again or use your code.",
  notYou: (name) => `Not ${name}?`,
  signOut: "Sign out",
  delete: "Delete",
  setup: {
    createTitle: "Create your code",
    createText: "6 digits to open the app without typing your password.",
    confirmTitle: "Confirm your code",
    mismatch: "The codes don't match. Try again.",
    tooSimple: "Too easy to guess (e.g. 123456, 000000). Pick another.",
    biometricsTitle: { faceId: "Turn on Face ID?", biometrics: "Turn on biometrics?" },
    biometricsText: "Open the app with just a glance or a finger. Your code keeps working.",
    enableBiometrics: "Turn on",
    notNow: "Not now",
    skipCode: "I'd rather use my password",
    done: "Done",
  },
  menu: { site: "View site", calendar: "Calendar", account: "My account", signOut: "Sign out" },
  account: {
    ...PT.account,
    title: "My account",
    profile: "Profile",
    name: "Name",
    jobTitle: "Job title",
    jobTitleHint: "Shown in the calendar instead of your name.",
    save: "Save",
    saved: "Saved.",
    security: "Opening the app",
    securityText:
      "In the app installed on a phone/tablet, it's asked when the app opens and whenever you come back after 5 minutes away. In a computer's browser you sign in with your password.",
    method: "How you unlock",
    methods: {
      pin: "Code",
      passkey: { faceId: "Face ID", biometrics: "Biometrics" },
      password: "Password",
    },
    changeCode: "Change code",
    createCode: "Create code",
    newCode: "New code (6 digits)",
    codeSaved: "Code saved.",
    devices: "Devices with Face ID / biometrics",
    noDevices: "No devices yet.",
    addThisDevice: {
      faceId: "Turn on Face ID on this device",
      biometrics: "Turn on biometrics on this device",
    },
    deviceAdded: "Device added.",
    remove: "Remove",
    lastUsed: "Last used",
    never: "never",
    notSupported: "This device doesn't support Face ID/biometrics for websites.",
    needsCode: "Create a code first.",
    needsDevice: "Turn on Face ID/biometrics on a device first.",
    notifications: "Notifications",
    error: "Something went wrong. Please try again.",
  },
};

export const APP_COPY: Record<Language, AppCopy> = { pt: PT, es: ES, en: EN };
