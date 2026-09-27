import { enGB, es, pt, type Locale } from "date-fns/locale";
import type { Language } from "@/lib/i18n/translations";
import type { Category, EventStatus, Frequency, MutationError, Role } from "@/lib/calendar/types";
import type { View } from "@/lib/calendar/dates";

/** Calendar copy lives here rather than in the site-wide dictionary: it's only loaded on /calendario. */
type CalendarCopy = {
  title: string;
  backToSite: string;
  newEvent: string;
  today: string;
  previous: string;
  next: string;
  views: Record<View, string>;
  viewLabel: string;
  filters: string;
  calendars: string;
  people: string;
  categories: string;
  all: string;
  categoryNames: Record<Category, string>;
  statusNames: Record<EventStatus, string>;
  roleNames: Record<Role, string>;
  allDay: string;
  more: (n: number) => string;
  participantsCount: (n: number) => string;
  eventsCount: (n: number) => string;
  loading: string;
  loadError: string;
  retry: string;
  noEvents: string;
  noEventsHint: string;
  noCalendars: string;
  signInTitle: string;
  signInText: string;
  signIn: string;
  details: {
    participants: string;
    noParticipants: string;
    description: string;
    calendar: string;
    createdBy: string;
    timezone: string;
    repeats: string;
    edit: string;
    cancelEvent: string;
    restoreEvent: string;
    delete: string;
    close: string;
    readOnly: string;
  };
  form: {
    newTitle: string;
    editTitle: string;
    title: string;
    titlePlaceholder: string;
    titleRequired: string;
    description: string;
    date: string;
    startDate: string;
    endDate: string;
    start: string;
    end: string;
    allDay: string;
    calendar: string;
    category: string;
    noCategory: string;
    participants: string;
    status: string;
    repeat: string;
    noRepeat: string;
    frequencies: Record<Frequency, string>;
    every: string;
    until: string;
    untilHint: string;
    seriesNote: string;
    save: string;
    saving: string;
    cancel: string;
    reloadLatest: string;
  };
  confirmDelete: {
    title: string;
    text: string;
    occurrenceOnly: string;
    wholeSeries: string;
    confirm: string;
    cancel: string;
  };
  errors: Record<MutationError | "NETWORK" | "UNKNOWN", string>;
  /** Conflict in the details panel, which has already refreshed to the latest version. */
  conflictRefreshed: string;
  saved: string;
  deleted: string;
};

const PT: CalendarCopy = {
  title: "Calendário da equipa",
  backToSite: "Voltar ao site",
  newEvent: "Novo evento",
  today: "Hoje",
  previous: "Anterior",
  next: "Seguinte",
  views: { month: "Mês", week: "Semana", day: "Dia", agenda: "Agenda" },
  viewLabel: "Vista",
  filters: "Filtros",
  calendars: "Áreas",
  people: "Pessoas",
  categories: "Tipos de atividade",
  all: "Todos",
  categoryNames: {
    proposal_meeting: "Reunião · Proposta",
    production_meeting: "Reunião · Elaboração",
    closing_meeting: "Reunião · Finalização",
    photo_visit: "Visita · Fotos",
    other: "Outro",
  },
  statusNames: { confirmed: "Confirmado", tentative: "Provisório", cancelled: "Cancelado" },
  roleNames: { viewer: "Leitura", editor: "Edição", admin: "Admin" },
  allDay: "Dia inteiro",
  more: (n) => `+${n} mais`,
  participantsCount: (n) => `${n} participante${n === 1 ? "" : "s"}`,
  eventsCount: (n) => `${n} evento${n === 1 ? "" : "s"}`,
  loading: "A carregar…",
  loadError: "Não foi possível carregar o calendário.",
  retry: "Tentar novamente",
  noEvents: "Sem eventos neste período.",
  noEventsHint: "Use “Novo evento” para marcar alguma coisa.",
  noCalendars: "Ainda não tem acesso a nenhum calendário. Peça a um admin para o adicionar.",
  signInTitle: "Área reservada",
  signInText: "Entre com a sua conta da equipa para ver o calendário.",
  signIn: "Entrar",
  details: {
    participants: "Participantes",
    noParticipants: "Sem participantes",
    description: "Notas",
    calendar: "Área",
    createdBy: "Criado por",
    timezone: "Fuso horário",
    repeats: "Repete",
    edit: "Editar",
    cancelEvent: "Cancelar evento",
    restoreEvent: "Repor evento",
    delete: "Eliminar",
    close: "Fechar",
    readOnly: "Só tem permissão de leitura neste calendário.",
  },
  form: {
    newTitle: "Novo evento",
    editTitle: "Editar evento",
    title: "Título",
    titlePlaceholder: "Ex.: Reunião com cliente",
    titleRequired: "Dê um título ao evento.",
    description: "Notas",
    date: "Data",
    startDate: "Início",
    endDate: "Fim",
    start: "Início",
    end: "Fim",
    allDay: "Dia inteiro",
    calendar: "Área",
    category: "Tipo",
    noCategory: "Sem tipo",
    participants: "Quem participa",
    status: "Estado",
    repeat: "Repetir",
    noRepeat: "Não repete",
    frequencies: {
      DAILY: "Diariamente",
      WEEKLY: "Semanalmente",
      MONTHLY: "Mensalmente",
      YEARLY: "Anualmente",
    },
    every: "A cada",
    until: "Até",
    untilHint: "Vazio = sem fim",
    seriesNote: "As alterações aplicam-se a toda a série.",
    save: "Guardar",
    saving: "A guardar…",
    cancel: "Cancelar",
    reloadLatest: "Carregar versão mais recente",
  },
  confirmDelete: {
    title: "Eliminar evento?",
    text: "Esta ação não pode ser desfeita.",
    occurrenceOnly: "Só esta ocorrência",
    wholeSeries: "Toda a série",
    confirm: "Eliminar",
    cancel: "Voltar",
  },
  errors: {
    UNAUTHENTICATED: "A sua sessão terminou. Entre novamente.",
    FORBIDDEN: "Não tem permissão para esta ação neste calendário.",
    NOT_FOUND: "Este evento já não existe (pode ter sido eliminado por outra pessoa).",
    CONFLICT:
      "Outra pessoa alterou este evento entretanto. Carregue a versão mais recente antes de guardar.",
    INVALID_EVENT_DURATION: "O fim tem de ser depois do início.",
    INVALID_PARTICIPANTS: "Há participantes que não têm acesso a este calendário.",
    INVALID_INPUT: "Verifique os campos do formulário.",
    NETWORK: "Sem ligação ao servidor. Verifique a internet e tente outra vez.",
    UNKNOWN: "Algo correu mal. Tente outra vez.",
  },
  conflictRefreshed:
    "Outra pessoa alterou este evento entretanto. Os dados foram atualizados: confirme e tente de novo.",
  saved: "Evento guardado.",
  deleted: "Evento eliminado.",
};

const ES: CalendarCopy = {
  ...PT,
  title: "Calendario del equipo",
  backToSite: "Volver al sitio",
  newEvent: "Nuevo evento",
  today: "Hoy",
  previous: "Anterior",
  next: "Siguiente",
  views: { month: "Mes", week: "Semana", day: "Día", agenda: "Agenda" },
  filters: "Filtros",
  calendars: "Calendarios",
  people: "Personas",
  categories: "Tipos de actividad",
  all: "Todos",
  categoryNames: {
    proposal_meeting: "Reunión · Propuesta",
    production_meeting: "Reunión · Elaboración",
    closing_meeting: "Reunión · Cierre",
    photo_visit: "Visita · Fotos",
    other: "Otro",
  },
  statusNames: { confirmed: "Confirmado", tentative: "Provisional", cancelled: "Cancelado" },
  roleNames: { viewer: "Lectura", editor: "Edición", admin: "Admin" },
  allDay: "Todo el día",
  more: (n) => `+${n} más`,
  participantsCount: (n) => `${n} participante${n === 1 ? "" : "s"}`,
  loading: "Cargando…",
  loadError: "No se ha podido cargar el calendario.",
  retry: "Reintentar",
  noEvents: "No hay eventos en este periodo.",
  noEventsHint: "Usa “Nuevo evento” para crear uno.",
  noCalendars: "Todavía no tienes acceso a ningún calendario. Pide a un admin que te añada.",
  signInTitle: "Área reservada",
  signInText: "Entra con tu cuenta del equipo para ver el calendario.",
  signIn: "Entrar",
  details: {
    participants: "Participantes",
    noParticipants: "Sin participantes",
    description: "Notas",
    calendar: "Calendario",
    createdBy: "Creado por",
    timezone: "Zona horaria",
    repeats: "Se repite",
    edit: "Editar",
    cancelEvent: "Cancelar evento",
    restoreEvent: "Restaurar evento",
    delete: "Eliminar",
    close: "Cerrar",
    readOnly: "Solo tienes permiso de lectura en este calendario.",
  },
  form: {
    newTitle: "Nuevo evento",
    editTitle: "Editar evento",
    title: "Título",
    titlePlaceholder: "Ej.: Reunión con cliente",
    titleRequired: "Pon un título al evento.",
    description: "Notas",
    date: "Fecha",
    startDate: "Inicio",
    endDate: "Fin",
    start: "Inicio",
    end: "Fin",
    allDay: "Todo el día",
    calendar: "Calendario",
    category: "Tipo",
    noCategory: "Sin tipo",
    participants: "Participantes",
    status: "Estado",
    repeat: "Repetir",
    noRepeat: "No se repite",
    frequencies: {
      DAILY: "Cada día",
      WEEKLY: "Cada semana",
      MONTHLY: "Cada mes",
      YEARLY: "Cada año",
    },
    every: "Cada",
    until: "Hasta",
    untilHint: "Vacío = sin fin",
    seriesNote: "Los cambios se aplican a toda la serie.",
    save: "Guardar",
    saving: "Guardando…",
    cancel: "Cancelar",
    reloadLatest: "Cargar la versión más reciente",
  },
  confirmDelete: {
    title: "¿Eliminar evento?",
    text: "Esta acción no se puede deshacer.",
    occurrenceOnly: "Solo esta vez",
    wholeSeries: "Toda la serie",
    confirm: "Eliminar",
    cancel: "Volver",
  },
  errors: {
    UNAUTHENTICATED: "Tu sesión ha terminado. Vuelve a entrar.",
    FORBIDDEN: "No tienes permiso para esta acción en este calendario.",
    NOT_FOUND: "Este evento ya no existe (puede que otra persona lo haya eliminado).",
    CONFLICT:
      "Otra persona ha modificado este evento. Carga la versión más reciente antes de guardar.",
    INVALID_EVENT_DURATION: "El fin tiene que ser posterior al inicio.",
    INVALID_PARTICIPANTS: "Algunos participantes no tienen acceso a este calendario.",
    INVALID_INPUT: "Revisa los campos del formulario.",
    NETWORK: "Sin conexión con el servidor. Comprueba internet e inténtalo de nuevo.",
    UNKNOWN: "Algo ha salido mal. Inténtalo de nuevo.",
  },
  conflictRefreshed:
    "Otra persona ha modificado este evento. Los datos se han actualizado: revísalos e inténtalo de nuevo.",
  saved: "Evento guardado.",
  deleted: "Evento eliminado.",
};

const EN: CalendarCopy = {
  ...PT,
  title: "Team calendar",
  backToSite: "Back to site",
  newEvent: "New event",
  today: "Today",
  previous: "Previous",
  next: "Next",
  views: { month: "Month", week: "Week", day: "Day", agenda: "Agenda" },
  viewLabel: "View",
  filters: "Filters",
  calendars: "Calendars",
  people: "People",
  categories: "Activity types",
  all: "All",
  categoryNames: {
    proposal_meeting: "Meeting · Proposal",
    production_meeting: "Meeting · Production",
    closing_meeting: "Meeting · Wrap-up",
    photo_visit: "Visit · Photos",
    other: "Other",
  },
  statusNames: { confirmed: "Confirmed", tentative: "Tentative", cancelled: "Cancelled" },
  roleNames: { viewer: "View", editor: "Edit", admin: "Admin" },
  allDay: "All day",
  more: (n) => `+${n} more`,
  participantsCount: (n) => `${n} participant${n === 1 ? "" : "s"}`,
  eventsCount: (n) => `${n} event${n === 1 ? "" : "s"}`,
  loading: "Loading…",
  loadError: "The calendar couldn't be loaded.",
  retry: "Try again",
  noEvents: "No events in this period.",
  noEventsHint: "Use “New event” to add one.",
  noCalendars: "You don't have access to any calendar yet. Ask an admin to add you.",
  signInTitle: "Team area",
  signInText: "Sign in with your team account to see the calendar.",
  signIn: "Sign in",
  details: {
    participants: "Participants",
    noParticipants: "No participants",
    description: "Notes",
    calendar: "Calendar",
    createdBy: "Created by",
    timezone: "Time zone",
    repeats: "Repeats",
    edit: "Edit",
    cancelEvent: "Cancel event",
    restoreEvent: "Restore event",
    delete: "Delete",
    close: "Close",
    readOnly: "You can only view this calendar.",
  },
  form: {
    newTitle: "New event",
    editTitle: "Edit event",
    title: "Title",
    titlePlaceholder: "e.g. Client meeting",
    titleRequired: "Give the event a title.",
    description: "Notes",
    date: "Date",
    startDate: "Starts",
    endDate: "Ends",
    start: "Start",
    end: "End",
    allDay: "All day",
    calendar: "Calendar",
    category: "Type",
    noCategory: "No type",
    participants: "Participants",
    status: "Status",
    repeat: "Repeat",
    noRepeat: "Does not repeat",
    frequencies: { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly" },
    every: "Every",
    until: "Until",
    untilHint: "Empty = forever",
    seriesNote: "Changes apply to the whole series.",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    reloadLatest: "Load latest version",
  },
  confirmDelete: {
    title: "Delete event?",
    text: "This can't be undone.",
    occurrenceOnly: "This occurrence",
    wholeSeries: "Whole series",
    confirm: "Delete",
    cancel: "Back",
  },
  errors: {
    UNAUTHENTICATED: "Your session has ended. Please sign in again.",
    FORBIDDEN: "You don't have permission to do that in this calendar.",
    NOT_FOUND: "This event no longer exists (someone may have deleted it).",
    CONFLICT: "Someone else changed this event meanwhile. Load the latest version before saving.",
    INVALID_EVENT_DURATION: "The end has to be after the start.",
    INVALID_PARTICIPANTS: "Some participants don't have access to this calendar.",
    INVALID_INPUT: "Check the form fields.",
    NETWORK: "Can't reach the server. Check your connection and try again.",
    UNKNOWN: "Something went wrong. Please try again.",
  },
  conflictRefreshed:
    "Someone else changed this event meanwhile. It has been refreshed: check it and try again.",
  saved: "Event saved.",
  deleted: "Event deleted.",
};

export const CALENDAR_COPY: Record<Language, CalendarCopy> = { pt: PT, es: ES, en: EN };
export const DATE_LOCALES: Record<Language, Locale> = { pt, es, en: enGB };
