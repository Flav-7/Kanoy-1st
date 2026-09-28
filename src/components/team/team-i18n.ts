import type { Language } from "@/lib/i18n/translations";
import type { Role } from "@/lib/calendar/types";
import type { TeamError } from "@/server/team";

type TeamCopy = {
  team: string;
  teamLink: string;
  backToCalendar: string;
  intro: string;
  newArea: string;
  areaName: string;
  areaNamePlaceholder: string;
  color: string;
  create: string;
  save: string;
  cancel: string;
  edit: string;
  members: string;
  roles: Record<Role, string>;
  roleHelp: Record<Role, string>;
  pending: string;
  copyInvite: string;
  copied: string;
  share: string;
  remove: string;
  confirmRemove: string;
  addPerson: string;
  email: string;
  name: string;
  nameHint: string;
  role: string;
  add: string;
  inviteReady: string;
  inviteHelp: string;
  noAreas: string;
  errors: Record<TeamError | "UNAUTHENTICATED" | "UNKNOWN", string>;
  notifications: {
    label: string;
    on: string;
    off: string;
    enable: string;
    disable: string;
    install: string;
    denied: string;
    unsupported: string;
    unconfigured: string;
  };
};

const PT: TeamCopy = {
  team: "Equipa",
  teamLink: "Equipa e áreas",
  backToCalendar: "Voltar ao calendário",
  intro:
    "Crie áreas (ex.: Websites, Redes sociais) e associe pessoas. Quem tem Leitura vê as atividades da sua área e é avisado quando há novas, mas não as pode alterar.",
  newArea: "Nova área",
  areaName: "Nome da área",
  areaNamePlaceholder: "Ex.: Redes sociais",
  color: "Cor",
  create: "Criar área",
  save: "Guardar",
  cancel: "Cancelar",
  edit: "Editar",
  members: "Pessoas",
  roles: { viewer: "Leitura", editor: "Edição", admin: "Admin" },
  roleHelp: {
    viewer: "Vê a área e recebe avisos; não altera nada.",
    editor: "Cria e altera atividades da área.",
    admin: "Tudo, incluindo gerir a área e as pessoas.",
  },
  pending: "Convite por aceitar",
  copyInvite: "Copiar link de convite",
  copied: "Copiado!",
  share: "Partilhar",
  remove: "Remover",
  confirmRemove: "Remover desta área?",
  addPerson: "Associar pessoa",
  email: "Email",
  name: "Nome",
  nameHint: "Só para pessoas novas",
  role: "Permissão",
  add: "Associar",
  inviteReady: "Conta criada. Envie este link à pessoa (válido 72 h, uso único):",
  inviteHelp: "Ao abrir o link, a pessoa escolhe a própria palavra-passe e entra no calendário.",
  noAreas: "Ainda não gere nenhuma área.",
  errors: {
    FORBIDDEN: "Não tem permissão para isto.",
    NOT_FOUND: "Esta área ou pessoa já não existe.",
    LAST_ADMIN: "Cada área precisa de pelo menos um admin.",
    INVALID_INPUT: "Verifique os campos (email válido; nome obrigatório para pessoas novas).",
    UNAUTHENTICATED: "A sua sessão terminou. Entre novamente.",
    UNKNOWN: "Algo correu mal. Tente outra vez.",
  },
  notifications: {
    label: "Notificações",
    on: "Notificações ativas neste dispositivo",
    off: "Ativar notificações",
    enable: "Ativar",
    disable: "Desativar",
    install:
      "No iPhone/iPad: toque em Partilhar → “Adicionar ao ecrã principal”, abra a app a partir daí e ative aqui.",
    denied:
      "As notificações estão bloqueadas para este site. Desbloqueie nas definições do browser/telemóvel.",
    unsupported: "Este browser não suporta notificações.",
    unconfigured: "As notificações ainda não estão configuradas no servidor.",
  },
};

const ES: TeamCopy = {
  ...PT,
  team: "Equipo",
  teamLink: "Equipo y áreas",
  backToCalendar: "Volver al calendario",
  intro:
    "Crea áreas (p. ej. Webs, Redes sociales) y asocia personas. Quien tiene Lectura ve las actividades de su área y recibe avisos, pero no puede cambiarlas.",
  newArea: "Nueva área",
  areaName: "Nombre del área",
  areaNamePlaceholder: "P. ej.: Redes sociales",
  create: "Crear área",
  save: "Guardar",
  cancel: "Cancelar",
  edit: "Editar",
  members: "Personas",
  roles: { viewer: "Lectura", editor: "Edición", admin: "Admin" },
  roleHelp: {
    viewer: "Ve el área y recibe avisos; no cambia nada.",
    editor: "Crea y cambia actividades del área.",
    admin: "Todo, incluido gestionar el área y las personas.",
  },
  pending: "Invitación pendiente",
  copyInvite: "Copiar enlace de invitación",
  copied: "¡Copiado!",
  share: "Compartir",
  remove: "Quitar",
  confirmRemove: "¿Quitar de esta área?",
  addPerson: "Asociar persona",
  name: "Nombre",
  nameHint: "Solo para personas nuevas",
  role: "Permiso",
  add: "Asociar",
  inviteReady: "Cuenta creada. Envía este enlace a la persona (válido 72 h, un solo uso):",
  inviteHelp: "Al abrirlo, la persona elige su contraseña y entra en el calendario.",
  noAreas: "Todavía no gestionas ninguna área.",
  errors: {
    FORBIDDEN: "No tienes permiso para esto.",
    NOT_FOUND: "Esta área o persona ya no existe.",
    LAST_ADMIN: "Cada área necesita al menos un admin.",
    INVALID_INPUT: "Revisa los campos (email válido; nombre obligatorio para personas nuevas).",
    UNAUTHENTICATED: "Tu sesión ha terminado. Vuelve a entrar.",
    UNKNOWN: "Algo ha salido mal. Inténtalo de nuevo.",
  },
  notifications: {
    label: "Notificaciones",
    on: "Notificaciones activas en este dispositivo",
    off: "Activar notificaciones",
    enable: "Activar",
    disable: "Desactivar",
    install:
      "En iPhone/iPad: toca Compartir → “Añadir a pantalla de inicio”, abre la app desde ahí y actívalas aquí.",
    denied: "Las notificaciones están bloqueadas para este sitio. Desbloquéalas en los ajustes.",
    unsupported: "Este navegador no admite notificaciones.",
    unconfigured: "Las notificaciones aún no están configuradas en el servidor.",
  },
};

const EN: TeamCopy = {
  ...PT,
  team: "Team",
  teamLink: "Team & areas",
  backToCalendar: "Back to calendar",
  intro:
    "Create areas (e.g. Websites, Social media) and add people. View-only people see their area's activities and get notified of new ones, but can't change them.",
  newArea: "New area",
  areaName: "Area name",
  areaNamePlaceholder: "e.g. Social media",
  color: "Colour",
  create: "Create area",
  save: "Save",
  cancel: "Cancel",
  edit: "Edit",
  members: "People",
  roles: { viewer: "View", editor: "Edit", admin: "Admin" },
  roleHelp: {
    viewer: "Sees the area and gets notified; can't change anything.",
    editor: "Creates and edits the area's activities.",
    admin: "Everything, including managing the area and its people.",
  },
  pending: "Invite not accepted yet",
  copyInvite: "Copy invite link",
  copied: "Copied!",
  share: "Share",
  remove: "Remove",
  confirmRemove: "Remove from this area?",
  addPerson: "Add person",
  name: "Name",
  nameHint: "Only for new people",
  role: "Permission",
  add: "Add",
  inviteReady: "Account created. Send this link to the person (valid 72 h, single use):",
  inviteHelp: "Opening it, they choose their own password and land in the calendar.",
  noAreas: "You don't manage any area yet.",
  errors: {
    FORBIDDEN: "You don't have permission for this.",
    NOT_FOUND: "This area or person no longer exists.",
    LAST_ADMIN: "Every area needs at least one admin.",
    INVALID_INPUT: "Check the fields (valid email; name required for new people).",
    UNAUTHENTICATED: "Your session has ended. Please sign in again.",
    UNKNOWN: "Something went wrong. Please try again.",
  },
  notifications: {
    label: "Notifications",
    on: "Notifications on for this device",
    off: "Turn on notifications",
    enable: "Turn on",
    disable: "Turn off",
    install:
      "On iPhone/iPad: tap Share → “Add to Home Screen”, open the app from there and turn them on here.",
    denied: "Notifications are blocked for this site. Unblock them in your browser/phone settings.",
    unsupported: "This browser doesn't support notifications.",
    unconfigured: "Notifications aren't set up on the server yet.",
  },
};

export const TEAM_COPY: Record<Language, TeamCopy> = { pt: PT, es: ES, en: EN };
