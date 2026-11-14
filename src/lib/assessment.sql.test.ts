import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const participant = "00000000-0000-4000-8000-000000000101";
const journey = "00000000-0000-4000-8000-000000000102";
const emptyParticipant = "00000000-0000-4000-8000-000000000103";
const admin = "00000000-0000-4000-8000-000000000104";

beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id UUID PRIMARY KEY, email TEXT, email_confirmed_at TIMESTAMPTZ,
      raw_user_meta_data JSONB DEFAULT '{}', raw_app_meta_data JSONB DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID; $$;
    CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$
      SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::JSONB; $$;
    CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$ SELECT current_user::TEXT; $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
  `);
  await db.exec(readFileSync(new URL("../db/supabase_schema.sql", import.meta.url), "utf8").replace(/^CREATE EXTENSION.*$/gim, ""));
  await db.exec(readFileSync(new URL("../../slj_schema_update.sql", import.meta.url), "utf8"));
  await db.exec(readFileSync(new URL("../db/rls.sql", import.meta.url), "utf8"));
  const migrations = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of readdirSync(migrations).filter(file => /^\d{3}_.*\.sql$/.test(file)
    && Number(file.slice(0, 3)) >= 5 && Number(file.slice(0, 3)) <= 37 && !file.includes("preflight")).sort()) {
    await db.exec(readFileSync(new URL(file, migrations), "utf8"));
  }
  await db.query("INSERT INTO auth.users(id,email,email_confirmed_at) VALUES ($1,'participant@example.invalid',NOW()),($2,'empty@example.invalid',NOW())", [participant, emptyParticipant]);
  await db.query("INSERT INTO auth.users(id,email,email_confirmed_at) VALUES ($1,'admin@example.invalid',NOW())", [admin]);
  await db.query("UPDATE profiles SET role='admin' WHERE user_id=$1", [admin]);
  await db.exec(`UPDATE profiles SET program_code='SLJ-AUDIT', timezone='Asia/Jakarta',
    start_date=((NOW() AT TIME ZONE 'Asia/Jakarta')::DATE-6)::TIMESTAMPTZ;
    INSERT INTO journeys(id,user_id,area_transformasi)
    VALUES ('${journey}','${participant}','["Spiritual Growth","Personal Development","Relationship"]');
    INSERT INTO journeys(user_id,area_transformasi)
    VALUES ('${emptyParticipant}','["Spiritual Growth","Personal Development","Relationship"]');
  `);
  // Independent contract: two habits (100% and 0%) in area A, one at 100% in B.
  // Quantity is not an implicit score weight: ((100+0)/2 + 100)/2 = 75%.
  await db.query(`INSERT INTO habits(user_id,title,frequency,quantity,area_category,effective_from)
    VALUES ($1,'Habit A','daily',1,'Spiritual Growth',(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE-6),
           ($1,'Habit B','daily',10,'Spiritual Growth',(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE-6),
           ($1,'Habit C','daily',1,'Personal Development',(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE-6),
           ($2,'Belum dicatat','daily',1,'Spiritual Growth',(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE-6)`, [participant, emptyParticipant]);
  await db.query(`INSERT INTO habit_logs(user_id,habit_id,date,activity_date,completed,completed_count)
    SELECT h.user_id,h.id,day::DATE::TEXT,day::DATE,true,1 FROM habits h
    CROSS JOIN generate_series((NOW() AT TIME ZONE 'Asia/Jakarta')::DATE-6,(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE,INTERVAL '1 day') day
    WHERE h.user_id=$1 AND h.title IN ('Habit A','Habit C')`, [participant]);
  await db.exec("INSERT INTO auth.users(id,email,email_confirmed_at) VALUES ('00000000-0000-4000-8000-000000000105','not-enrolled@example.invalid',NOW())");
}, 30000);
afterAll(() => db.close());

async function assessment(userId = participant) {
  await db.exec("RESET ROLE");
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [userId]);
  await db.exec("SET ROLE authenticated");
  const { rows } = await db.query<{ result: { metrics: {
    execution: { score: number | null; numerator: number; denominator: number; areas: { area: string; score: number | null }[] };
    engagement: { tracking: boolean; ptp: boolean };
    outcome: { score: number | null };
  } } }>("SELECT get_participant_assessment() result");
  return rows[0].result;
}

describe("participant assessment database contract", () => {
  it("averages habits within areas, then measured areas without quantity weighting", async () => {
    const result = await assessment();
    expect(result.metrics.execution.areas.find(row => row.area === "Spiritual Growth")?.score).toBe(50);
    expect(result.metrics.execution.score).toBe(75);
    expect(result.metrics.execution.numerator).toBe(14);
    expect(result.metrics.execution.denominator).toBe(84);
  });

  it("does not claim tracking activity from a schedule without any log", async () => {
    const result = await assessment(emptyParticipant);
    expect(result.metrics.engagement.tracking).toBe(false);
    expect(result.metrics.execution.score).toBe(0);
    expect(result.metrics.outcome.score).toBeNull();
  });

  it("keeps unrelated participants out of the assessment RPC", async () => {
    await assessment();
    await expect(db.query("SELECT get_participant_assessment($1)", [emptyParticipant])).rejects.toThrow(/ditolak/i);
  });

  it("shows the same scheduled-execution result in admin monitoring", async () => {
    await db.exec("RESET ROLE");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [admin]);
    await db.exec("SET ROLE authenticated");
    const { rows } = await db.query<{ user_id: string; habit_avg_percent: number | null }>("SELECT * FROM get_admin_monitoring()");
    expect(rows.find(row => row.user_id === participant)?.habit_avg_percent).toBe(75);
    expect(rows.find(row => row.user_id === emptyParticipant)?.habit_avg_percent).toBe(0);
  });

  it("can be reapplied without changing the participant results", async () => {
    await db.exec("RESET ROLE");
    await db.exec(readFileSync(new URL("../../supabase/migrations/034_execution_consistency.sql", import.meta.url), "utf8"));
    await db.exec(readFileSync(new URL("../../supabase/migrations/035_assessment_report_scope.sql", import.meta.url), "utf8"));
    await db.exec(readFileSync(new URL("../../supabase/migrations/036_trial_spiritual_practice.sql", import.meta.url), "utf8"));
    await db.exec(readFileSync(new URL("../../supabase/migrations/037_trial_weekly_evaluation.sql", import.meta.url), "utf8"));
    expect((await assessment()).metrics.execution.score).toBe(75);
  });

  it("keeps a new account without a program out of group-report denominators", async () => {
    await db.exec("RESET ROLE");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [admin]);
    await db.exec("SET ROLE authenticated");
    const { rows } = await db.query<{ result: { participants: { user_id: string }[] } }>("SELECT get_admin_group_impact() result");
    expect(rows[0].result.participants.map(row => row.user_id).sort()).toEqual([participant, emptyParticipant].sort());
  });
});
