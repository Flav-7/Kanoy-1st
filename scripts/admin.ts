/**
 * Team accounts and calendars from the command line (day to day, areas and
 * people are managed on the site's /equipa page; this is for bootstrap and
 * password resets).
 *
 *   npm run admin -- migrate
 *   npm run admin -- add-user --email ana@kanoy.pt --name "Ana" [--calendar Geral] [--role editor]
 *   npm run admin -- reset-password --email ana@kanoy.pt
 *   npm run admin -- add-calendar --name Marketing --color violet --owner ana@kanoy.pt
 *   npm run admin -- add-member --email bruno@kanoy.pt --calendar Marketing --role viewer
 *   npm run admin -- list
 *   npm run admin -- error-viewer --email ana@kanoy.pt [--off]   (the "Erros" page)
 *
 * Runs against DATABASE_URL (the Neon database), read from .env.vercel.local
 * (`npx vercel env pull .env.vercel.local`) — deliberately not .env.local, which
 * the dev server would load and so point local testing at production data.
 * With --local it uses the dev server's embedded database in .data/pglite
 * instead (stop `npm run dev` first).
 * add-user / reset-password print a one-time link (valid 72 h) where the
 * person sets their own password — passwords never pass through here.
 */
import { parseArgs } from "node:util";
import { migrate, neonDb, type Db } from "../src/server/db";
import { createPasswordToken } from "../src/server/auth";
import {
  createCalendar,
  createUser,
  findCalendarByName,
  findUserByEmail,
  setMember,
} from "../src/server/admin";
import { setErrorViewer } from "../src/server/errors";
import { CALENDAR_COLORS, ROLES, type CalendarColor, type Role } from "../src/lib/calendar/types";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    email: { type: "string" },
    name: { type: "string" },
    calendar: { type: "string" },
    role: { type: "string" },
    color: { type: "string" },
    owner: { type: "string" },
    local: { type: "boolean", default: false },
    off: { type: "boolean", default: false },
  },
});

function need(value: string | undefined, flag: string): string {
  if (!value) throw new Error(`Missing --${flag}`);
  return value;
}

function asRole(value: string | undefined, fallback: Role): Role {
  const role = (value ?? fallback) as Role;
  if (!ROLES.includes(role)) throw new Error(`--role must be one of: ${ROLES.join(", ")}`);
  return role;
}

async function openDb(): Promise<{ db: Db; siteUrl: string; close: () => Promise<void> }> {
  if (values.local) {
    const { createPgliteDb } = await import("../src/server/pglite-db");
    const db = await createPgliteDb(".data/pglite");
    return { db, siteUrl: "http://localhost:8080", close: () => db.close() };
  }
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is not set (or pass --local for the dev database).");
  return {
    db: neonDb(url),
    siteUrl: process.env["SITE_URL"] ?? "https://kanoy.pt",
    close: async () => {},
  };
}

async function main() {
  const [command] = positionals;
  const { db, siteUrl, close } = await openDb();
  const link = async (userId: string) =>
    `${siteUrl}/definir-password?token=${await createPasswordToken(db, userId)}`;

  try {
    switch (command) {
      case "migrate": {
        const applied = await migrate(db);
        console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Already up to date.");
        break;
      }

      case "add-user": {
        const email = need(values.email, "email");
        const existing = await findUserByEmail(db, email);
        const userId =
          existing?.id ?? (await createUser(db, { email, name: need(values.name, "name") })).id;
        const calendarName = values.calendar ?? "Geral";
        const calendar = await findCalendarByName(db, calendarName);
        if (calendar) {
          await setMember(db, calendar.id, userId, asRole(values.role, "editor"));
          console.log(`${email} → ${calendarName} (${asRole(values.role, "editor")})`);
        } else {
          await createCalendar(db, { name: calendarName, color: "cyan", ownerId: userId });
          console.log(`Created calendar "${calendarName}" with ${email} as admin.`);
        }
        console.log(
          `\nSet-password link for ${email} (valid 72 h, single use):\n${await link(userId)}\n`,
        );
        break;
      }

      case "reset-password": {
        const email = need(values.email, "email");
        const user = await findUserByEmail(db, email);
        if (!user) throw new Error(`No user ${email}`);
        console.log(
          `\nSet-password link for ${email} (valid 72 h, single use):\n${await link(user.id)}\n`,
        );
        break;
      }

      case "add-calendar": {
        const color = (values.color ?? "cyan") as CalendarColor;
        if (!CALENDAR_COLORS.includes(color))
          throw new Error(`--color must be one of: ${CALENDAR_COLORS.join(", ")}`);
        const owner = await findUserByEmail(db, need(values.owner, "owner"));
        if (!owner) throw new Error(`No user ${values.owner}`);
        await createCalendar(db, { name: need(values.name, "name"), color, ownerId: owner.id });
        console.log(`Created calendar "${values.name}" (${color}), admin: ${values.owner}`);
        break;
      }

      case "add-member": {
        const user = await findUserByEmail(db, need(values.email, "email"));
        const calendar = await findCalendarByName(db, need(values.calendar, "calendar"));
        if (!user) throw new Error(`No user ${values.email}`);
        if (!calendar) throw new Error(`No calendar ${values.calendar}`);
        const role = asRole(values.role, "editor");
        await setMember(db, calendar.id, user.id, role);
        console.log(`${values.email} → ${values.calendar} (${role})`);
        break;
      }

      case "list": {
        const rows = await db.query<{
          calendar: string;
          email: string;
          name: string;
          role: string;
        }>(
          `select c.name as calendar, u.email, u.name, m.role
             from calendar_members m
             join calendars c on c.id = m.calendar_id
             join users u on u.id = m.user_id
            order by c.name, m.role, u.name`,
        );
        console.table(rows);
        const loose = await db.query<{ email: string }>(
          "select email from users u where not exists (select 1 from calendar_members m where m.user_id = u.id)",
        );
        if (loose.length)
          console.log("Users without any calendar:", loose.map((u) => u.email).join(", "));
        break;
      }

      case "error-viewer": {
        const email = need(values.email, "email");
        if (!(await setErrorViewer(db, email, !values.off))) throw new Error(`No user ${email}`);
        console.log(`${email}: ${values.off ? "no longer sees" : "now sees"} the Erros page`);
        break;
      }

      default:
        console.log(
          "Commands: migrate | add-user | reset-password | add-calendar | add-member | list | error-viewer",
        );
        process.exitCode = 1;
    }
  } finally {
    await close();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
