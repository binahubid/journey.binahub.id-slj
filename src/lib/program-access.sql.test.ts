import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const admin = "00000000-0000-4000-8000-000000000001";
const users = Array.from(
  { length: 8 },
  (_, i) => "00000000-0000-4000-8000-" + String(i + 10).padStart(12, "0"),
);

async function asUser(id: string) {
  await db.exec("RESET ROLE");
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec("SET ROLE authenticated");
}

async function owner() {
  await db.exec("RESET ROLE");
  await db.query("SELECT set_config('request.jwt.claim.sub', '', false)");
}

async function access() {
  const { rows } = await db.query<{
    result: {
      kind: string;
      active: boolean;
      starts_at: string;
      expires_at: string;
    };
  }>("SELECT public.slj_access_status() result");
  return rows[0].result;
}

beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (
      id UUID PRIMARY KEY, email TEXT, email_confirmed_at TIMESTAMPTZ,
      raw_user_meta_data JSONB DEFAULT '{}', raw_app_meta_data JSONB DEFAULT '{}'
    );
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
    $$;
    CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$
      SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::JSONB;
    $$;
    CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$ SELECT current_user::TEXT; $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
  `);
  const schema = readFileSync(
    new URL("../db/supabase_schema.sql", import.meta.url),
    "utf8",
  ).replace(/^CREATE EXTENSION.*$/gim, "");
  await db.exec(schema);
  await db.exec(
    readFileSync(
      new URL("../../slj_schema_update.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(new URL("../db/rls.sql", import.meta.url), "utf8"),
  );
  const migrations = new URL("../../supabase/migrations/", import.meta.url);
  // src/db/rls.sql is the consolidated baseline for the original RLS migrations (001–004).
  for (const file of readdirSync(migrations)
    .filter(
      (file) =>
        /^\d{3}_.*\.sql$/.test(file) &&
        Number(file.slice(0, 3)) >= 5 &&
        Number(file.slice(0, 3)) <= 32 &&
        !file.includes("preflight"),
    )
    .sort()) {
    try {
      await db.exec(readFileSync(new URL(file, migrations), "utf8"));
    } catch (cause) {
      throw new Error(`Migration ${file} failed`, { cause });
    }
  }
  for (const id of [admin, ...users]) {
    await db.query(
      "INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,NOW())",
      [id, id + "@example.invalid"],
    );
  }
  await db.query("UPDATE public.profiles SET role='admin' WHERE user_id=$1", [
    admin,
  ]);
  await db.exec(
    readFileSync(
      new URL(
        "../../supabase/migrations/033_spiritual_trial_access.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}, 20000);
afterAll(() => db.close());

describe("spiritual trial database", () => {
  it("activates once, keeps retries idempotent, and expires after fourteen complete days", async () => {
    await asUser(users[0]);
    await db.query("SELECT start_slj_spiritual_trial($1)", ["Rina Peserta"]);
    const first = await access();
    await db.query("SELECT start_slj_spiritual_trial($1)", ["Rina Peserta"]);
    expect(await access()).toEqual(first);
    expect(first.kind).toBe("trial");
    expect(first.active).toBe(true);
    expect(Date.parse(first.expires_at) - Date.parse(first.starts_at)).toBe(
      14 * 86400000,
    );
  });

  it("keeps an enrolled full-program participant on the existing program", async () => {
    await owner();
    await db.query(
      "UPDATE public.profiles SET program_code='SLJ-EXISTING' WHERE user_id=$1",
      [users[1]],
    );
    await asUser(users[1]);
    await db.query("SELECT start_slj_spiritual_trial($1)", ["Peserta Program"]);
    expect((await access()).kind).toBe("program");
    const { rows } = await db.query(
      "SELECT * FROM slj_trial_enrollments WHERE user_id=auth.uid()",
    );
    expect(rows).toHaveLength(0);
  });

  it("requires verified email before consuming a trial", async () => {
    await owner();
    await db.query(
      "UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1",
      [users[2]],
    );
    await asUser(users[2]);
    await expect(
      db.query("SELECT start_slj_spiritual_trial($1)", ["Peserta Baru"]),
    ).rejects.toThrow(/Verifikasi email/);
    expect((await access()).kind).toBe("none");
  });

  it("pauses new registrations while an existing trial retains its original end date", async () => {
    await asUser(admin);
    await db.query("SELECT admin_set_slj_trial_offer(false)");
    await asUser(users[3]);
    await expect(
      db.query("SELECT start_slj_spiritual_trial($1)", ["Peserta Berikutnya"]),
    ).rejects.toThrow(/sedang ditutup/);
    await asUser(users[0]);
    expect((await access()).active).toBe(true);
    await db.query("SELECT start_slj_spiritual_trial($1)", ["Rina Peserta"]);
    await asUser(admin);
    await db.query("SELECT admin_set_slj_trial_offer(true)");
  });

  it("persists prayer activity and keeps it isolated to its participant", async () => {
    await asUser(users[0]);
    await db.exec(
      "INSERT INTO prayer_logs(user_id,date,prayer_name,is_completed) VALUES(auth.uid(),CURRENT_DATE,'subuh',true)",
    );
    const own = await db.query("SELECT prayer_name FROM prayer_logs");
    expect(own.rows).toEqual([{ prayer_name: "subuh" }]);
    await asUser(users[4]);
    await db.query("SELECT start_slj_spiritual_trial($1)", ["Peserta Lain"]);
    expect(
      (await db.query("SELECT prayer_name FROM prayer_logs")).rows,
    ).toHaveLength(0);
  });

  it("locks full-program planning for a trial and prevents new entries after expiry", async () => {
    await asUser(users[0]);
    const { rows: journeys } = await db.query<{ id: string }>(
      "SELECT id FROM journeys WHERE user_id=auth.uid()",
    );
    await expect(
      db.query(
        "INSERT INTO action_plans(user_id,journey_id,title) VALUES(auth.uid(),$1,'Rencana kepemimpinan')",
        [journeys[0].id],
      ),
    ).rejects.toThrow(/Fitur ini memerlukan/);
    await owner();
    await db.query(
      "UPDATE slj_trial_enrollments SET starts_at=NOW()-INTERVAL '15 days',expires_at=NOW()-INTERVAL '1 day' WHERE user_id=$1",
      [users[0]],
    );
    await asUser(users[0]);
    expect((await access()).active).toBe(false);
    await expect(
      db.exec(
        "INSERT INTO prayer_logs(user_id,date,prayer_name,is_completed) VALUES(auth.uid(),CURRENT_DATE,'isya',true)",
      ),
    ).rejects.toThrow(/Fitur ini memerlukan/);
    await owner();
    const retained = await db.query(
      "SELECT prayer_name FROM prayer_logs WHERE user_id=$1",
      [users[0]],
    );
    expect(retained.rows).toEqual([{ prayer_name: "subuh" }]);
  });

  it("exposes trial administration to admins and provides accurate participant counts", async () => {
    await asUser(users[4]);
    await expect(db.query("SELECT admin_slj_trial_overview()")).rejects.toThrow(
      /Akses admin/,
    );
    await asUser(admin);
    const { rows } = await db.query<{
      result: { total: number; active: number; participants: unknown[] };
    }>("SELECT admin_slj_trial_overview() result");
    expect(rows[0].result).toMatchObject({ total: 2, active: 1 });
    expect(rows[0].result.participants).toHaveLength(2);
  });

  it("stops expired trial reminders and prevents trial checkpoints", async () => {
    await owner();
    await db.query(
      "INSERT INTO notifications(user_id,title,message,category,dedupe_key,action_url) VALUES($1,'Jurnal','Refleksi','reminder','journal:test','/journal')",
      [users[0]],
    );
    expect(
      (
        await db.query("SELECT id FROM notifications WHERE user_id=$1", [
          users[0],
        ])
      ).rows,
    ).toHaveLength(0);
    await db.query(
      "INSERT INTO notifications(user_id,title,message,category,dedupe_key,action_url) VALUES($1,'Checkpoint','Evaluasi','checkpoint','checkpoint:test','/monitoring')",
      [users[4]],
    );
    expect(
      (
        await db.query("SELECT id FROM notifications WHERE user_id=$1", [
          users[4],
        ])
      ).rows,
    ).toHaveLength(0);
    await db.query(
      "INSERT INTO notifications(user_id,title,message,category,dedupe_key,action_url) VALUES($1,'Tilawah','Baca','reminder','quran:test','/dashboard')",
      [users[4]],
    );
    expect(
      (
        await db.query(
          "SELECT action_url FROM notifications WHERE user_id=$1",
          [users[4]],
        )
      ).rows,
    ).toEqual([{ action_url: "/trial" }]);
  });

  it("upgrades by a valid program code without shortening the full program or losing trial history", async () => {
    await owner();
    await db.exec(
      "INSERT INTO batches(company_name,name,access_code,status) VALUES('Organisasi Uji','Program Penuh','SLJ-UPGRADE','active')",
    );
    await asUser(users[0]);
    await db.query("SELECT enroll_participant_by_access_code($1,$2)", [
      "Rina Peserta",
      "SLJ-UPGRADE",
    ]);
    const result = await access();
    expect(result.kind).toBe("program");
    expect(result.active).toBe(true);
    expect(Math.abs(Date.parse(result.starts_at) - Date.now())).toBeLessThan(
      10_000,
    );
    const { rows: journeys } = await db.query<{ id: string }>(
      "SELECT id FROM journeys WHERE user_id=auth.uid()",
    );
    await db.query(
      "INSERT INTO action_plans(user_id,journey_id,title) VALUES(auth.uid(),$1,'Rencana baru')",
      [journeys[0].id],
    );
    expect(
      (
        await db.query(
          "SELECT prayer_name FROM prayer_logs WHERE user_id=auth.uid()",
        )
      ).rows,
    ).toEqual([{ prayer_name: "subuh" }]);
    expect(
      (
        await db.query(
          "SELECT user_id FROM slj_trial_enrollments WHERE user_id=auth.uid()",
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          "SELECT id FROM notifications WHERE user_id=auth.uid() AND category='welcome'",
        )
      ).rows,
    ).toHaveLength(1);
  });

  it("rejects public calls that could create notifications for somebody else", async () => {
    await asUser(users[4]);
    await expect(
      db.query("SELECT create_welcome_notification($1)", [users[1]]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.query(
        "UPDATE profiles SET program_code='BYPASS' WHERE user_id=auth.uid()",
      ),
    ).rejects.toThrow(/hanya dapat dilakukan oleh admin/);
    await expect(
      db.query(
        "INSERT INTO slj_trial_enrollments(user_id,starts_at,expires_at) VALUES(auth.uid(),NOW(),NOW()+INTERVAL '14 days')",
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("enforces the program gate inside existing privileged RPCs as well as direct table writes", async () => {
    await asUser(users[4]);
    await expect(
      db.query("SELECT get_participant_assessment(auth.uid())"),
    ).rejects.toThrow(/Assessment tersedia dalam program/);
    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM journeys WHERE user_id=auth.uid()",
    );
    await expect(
      db.query("SELECT save_ptp_draft($1,'{}'::JSONB)", [rows[0].id]),
    ).rejects.toThrow(/Uji coba mencakup/);
  });

  it("can safely be reapplied without resetting registration settings or trial dates", async () => {
    await asUser(admin);
    await db.query("SELECT admin_set_slj_trial_offer(false)");
    await owner();
    const before = (
      await db.query("SELECT * FROM slj_trial_enrollments ORDER BY user_id")
    ).rows;
    await db.exec(
      readFileSync(
        new URL(
          "../../supabase/migrations/033_spiritual_trial_access.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect(
      (await db.query("SELECT * FROM slj_trial_enrollments ORDER BY user_id"))
        .rows,
    ).toEqual(before);
    await asUser(admin);
    const { rows } = await db.query<{
      result: { settings: { enabled: boolean } };
    }>("SELECT admin_slj_trial_overview() result");
    expect(rows[0].result.settings.enabled).toBe(false);
  });
});
