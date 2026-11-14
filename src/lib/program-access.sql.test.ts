import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { serializePtpIndicator, type IndicatorDefinition } from "./assessment-methodology";

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
  for (const file of ["034_execution_consistency.sql", "035_assessment_report_scope.sql", "036_trial_spiritual_practice.sql", "037_trial_weekly_evaluation.sql", "038_trial_practice_history.sql"]) {
    await db.exec(readFileSync(new URL("../../supabase/migrations/" + file, import.meta.url), "utf8"));
  }
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

  it("locks other areas for a trial and prevents new entries after expiry", async () => {
    await asUser(users[0]);
    const { rows: journeys } = await db.query<{ id: string }>(
      "SELECT id FROM journeys WHERE user_id=auth.uid()",
    );
    await expect(
      db.query(
        "INSERT INTO action_plans(user_id,journey_id,title,area_category) VALUES(auth.uid(),$1,'Rencana kepemimpinan','Leadership Excellence')",
        [journeys[0].id],
      ),
    ).rejects.toThrow(/Uji coba hanya mencakup/);
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

  it("allows the spiritual self-guided flow and prevents area bypass through privileged RPCs", async () => {
    await asUser(users[4]);
    const { rows } = await db.query<{ id: string }>("SELECT id FROM journeys WHERE user_id=auth.uid()");
    const id = rows[0].id;
    await db.query("SELECT save_ptp_draft($1,$2::JSONB)", [id, JSON.stringify({
      selected_areas: ["Spiritual Growth"], targets: {},
    })]);
    await expect(db.query("SELECT save_ptp_draft($1,$2::JSONB)", [id, JSON.stringify({
      selected_areas: ["Leadership Excellence"], targets: {},
    })])).rejects.toThrow(/Uji coba hanya mencakup/);
    await expect(db.query("SELECT publish_ptp_draft($1,$2::JSONB)", [id, JSON.stringify({
      selected_areas: ["Spiritual Growth", "Relationship", "Leadership Excellence"], targets: {},
    })])).rejects.toThrow(/Uji coba hanya mencakup/);

    const definition = { key: "spiritual", type: "quantity", label: "Tilawah", active: true,
      baseline: 0, target: 14, direction: "higher_is_better", unit: "sesi", actual_source: "self_report" };
    await db.query("SELECT publish_ptp_draft($1,$2::JSONB)", [id, JSON.stringify({
      selected_areas: ["Spiritual Growth"], targets: {
        "Spiritual Growth": { mainTarget: "Menjaga tilawah", indicators: [definition] },
      },
    })]);
    await db.query("INSERT INTO action_plans(user_id,journey_id,title,area_category,frequency,quantity) VALUES(auth.uid(),$1,'Tilawah','Spiritual Growth','Harian',1)", [id]);
    await db.query("INSERT INTO baseline_assessments(user_id) VALUES(auth.uid()) ON CONFLICT(user_id) DO NOTHING");
    await db.exec("INSERT INTO baseline_answers(user_id,assessment_id,question_number,area,score) SELECT auth.uid(),id,1,'spiritual_growth',5 FROM baseline_assessments WHERE user_id=auth.uid()");
    await expect(db.exec("INSERT INTO baseline_answers(user_id,assessment_id,question_number,area,score) SELECT auth.uid(),id,10,'personal_development',5 FROM baseline_assessments WHERE user_id=auth.uid()"))
      .rejects.toThrow(/Uji coba hanya mencakup/);
    await db.query("INSERT INTO monthly_reviews(user_id,month_number,status,participant_note) VALUES(auth.uid(),1,'ON_TRACK','Latihan spiritual berjalan')");
    await expect(db.query("INSERT INTO monthly_reviews(user_id,month_number,status) VALUES(auth.uid(),2,'ON_TRACK')"))
      .rejects.toThrow();
    await db.exec("INSERT INTO ptp_indicator_actuals(indicator_id,participant_user_id,journey_id,month_number,actual_value) SELECT id,participant_user_id,journey_id,1,7 FROM ptp_indicators WHERE participant_user_id=auth.uid()");
    const assessment = await db.query<{ report: { period: { program_end_date: string }; metrics: { execution: { score: number }; outcome: { score: number }; engagement: { ptp: boolean } } } }>("SELECT get_participant_assessment(auth.uid()) report");
    expect(assessment.rows[0].report.metrics.engagement.ptp).toBe(true);
    expect(assessment.rows[0].report.metrics.execution.score).toBe(0);
    expect(assessment.rows[0].report.metrics.outcome.score).toBe(50);
    const gate = await db.query<{ practice: boolean; program: boolean }>("SELECT slj_feature_access(auth.uid(),'practice') practice, slj_feature_access(auth.uid(),'program') program");
    expect(gate.rows[0]).toEqual({ practice: true, program: false });

    await owner();
    await db.query("UPDATE slj_trial_enrollments SET starts_at=NOW()-INTERVAL '7 days',expires_at=NOW()+INTERVAL '7 days' WHERE user_id=$1", [users[4]]);
    await db.query("UPDATE profiles SET start_date=NOW()-INTERVAL '7 days',end_date=NOW()+INTERVAL '7 days' WHERE user_id=$1", [users[4]]);
    await asUser(users[4]);
    expect((await db.query<{ program_day: number }>("SELECT current_program_day(auth.uid()) AS program_day")).rows[0].program_day).toBe(8);
    await expect(db.exec("UPDATE monthly_reviews SET participant_note='Perubahan terlambat' WHERE user_id=auth.uid() AND month_number=1"))
      .rejects.toThrow(/pekan yang sedang berjalan/);
    await db.exec("INSERT INTO monthly_reviews(user_id,month_number,status,participant_note) VALUES(auth.uid(),2,'ON_TRACK','Evaluasi pekan kedua')");
    await db.exec("INSERT INTO ptp_indicator_actuals(indicator_id,participant_user_id,journey_id,month_number,actual_value) SELECT id,participant_user_id,journey_id,2,14 FROM ptp_indicators WHERE participant_user_id=auth.uid()");
    const weekly = await db.query<{ report: { metrics: { outcome: { score: number }; engagement: { checkpoint: { items: unknown[] } } } } }>("SELECT get_participant_assessment(auth.uid()) report");
    expect(weekly.rows[0].report.metrics.outcome.score).toBe(100);
    expect(weekly.rows[0].report.metrics.engagement.checkpoint.items).toHaveLength(2);

    await asUser(admin);
    const group = await db.query<{ report: { participants: { user_id: string }[] } }>("SELECT get_admin_group_impact() report");
    expect(group.rows[0].report.participants.some(row => row.user_id === users[4])).toBe(false);
  });

  it("preserves the two trial weeks and starts a separate 90-day program after enrollment", async () => {
    await asUser(users[4]);
    const id = (await db.query<{ id: string }>("SELECT id FROM journeys WHERE user_id=auth.uid()")).rows[0].id;
    await db.exec("UPDATE baseline_assessments SET completed=true,submitted_at=NOW() WHERE user_id=auth.uid()");
    await db.exec("INSERT INTO sahabat_safar_profiles(user_id,preferences,is_completed) VALUES(auth.uid(),'{\"trialGoal\":\"Tilawah rutin\"}',true)");
    const ids = (await db.query<{ id: string }>(`INSERT INTO habits(user_id,title,area_category,action_plan_id)
      SELECT auth.uid(),'Tilawah','Spiritual Growth',id FROM action_plans WHERE journey_id=$1 RETURNING id`, [id])).rows;
    await db.query("INSERT INTO habit_logs(user_id,habit_id,date,completed) VALUES(auth.uid(),$1,CURRENT_DATE::TEXT,true)", [ids[0].id]);

    // Enrolling after the free trial ends must preserve the same answers and weekly records.
    await owner();
    await db.query("UPDATE slj_trial_enrollments SET starts_at=NOW()-INTERVAL '15 days',expires_at=NOW()-INTERVAL '1 day' WHERE user_id=$1", [users[4]]);
    await db.query("UPDATE profiles SET start_date=NOW()-INTERVAL '15 days',end_date=NOW()-INTERVAL '1 day' WHERE user_id=$1", [users[4]]);
    await db.query("UPDATE journeys SET final_reflection='Catatan refleksi 14 hari' WHERE user_id=$1", [users[4]]);
    await asUser(users[4]);
    expect((await access()).active).toBe(false);
    const expired = (await db.query<{ result: unknown }>("SELECT get_slj_trial_result() AS result")).rows[0].result;
    expect(expired).toMatchObject({
      reviews: [{ month_number: 1, participant_note: "Latihan spiritual berjalan" }, { month_number: 2, participant_note: "Evaluasi pekan kedua" }],
      actuals: expect.arrayContaining([{ actual_value: 7, month_number: 1 }, { actual_value: 14, month_number: 2 }].map(value => expect.objectContaining(value))),
      reflection: "Catatan refleksi 14 hari",
    });
    await db.query("SELECT enroll_participant_by_access_code($1,$2)", ["Peserta Uji", "SLJ-UPGRADE"]);
    const archived = (await db.query<{ result: unknown }>("SELECT get_slj_trial_result() AS result")).rows[0].result;
    expect(archived).toEqual(expired);
    await expect(db.query("SELECT practice FROM slj_trial_practice_archives")).rejects.toThrow(/permission denied/);

    const current = await db.query<{ review_count: number; indicator_count: number; baseline: boolean; published_at: string | null; final_reflection: string | null }>(
      `SELECT
        (SELECT count(*)::INT FROM monthly_reviews WHERE user_id=auth.uid()) AS review_count,
        (SELECT count(*)::INT FROM ptp_indicators WHERE participant_user_id=auth.uid()) AS indicator_count,
        (SELECT completed FROM baseline_assessments WHERE user_id=auth.uid()) AS baseline,
        ptp_published_at AS published_at, final_reflection FROM journeys WHERE user_id=auth.uid()`,
    );
    expect(current.rows[0]).toEqual({ review_count: 0, indicator_count: 0, baseline: false, published_at: null, final_reflection: null });
    expect((await db.query("SELECT score FROM baseline_answers WHERE user_id=auth.uid()")).rows).toEqual([{ score: 5 }]);
    expect((await db.query("SELECT is_archived, action_plan_id FROM habits WHERE id=$1", [ids[0].id])).rows)
      .toEqual([{ is_archived: true, action_plan_id: null }]);
    expect((await db.query("SELECT completed FROM habit_logs WHERE habit_id=$1", [ids[0].id])).rows)
      .toEqual([{ completed: true }]);
    expect((await access()).kind).toBe("program");

    await db.query("SELECT enroll_participant_by_access_code($1,$2)", ["Peserta Uji", "SLJ-UPGRADE"]);
    expect((await db.query<{ result: unknown }>("SELECT get_slj_trial_result() AS result")).rows[0].result).toEqual(archived);
    await asUser(users[3]);
    expect((await db.query<{ result: unknown }>("SELECT get_slj_trial_result() AS result")).rows[0].result).toBeNull();
  });

  it("publishes quality rubrics and linked habits from the participant draft in both trial and full programs", async () => {
    await asUser(users[7]);
    await db.query("SELECT start_slj_spiritual_trial($1)", ["Peserta Kualitas"]);
    const journeyId = (await db.query<{ id: string }>("SELECT id FROM journeys WHERE user_id=auth.uid()")).rows[0].id;
    const rubric = { 1: "Belum konsisten", 2: "Mulai mencoba", 3: "Cukup konsisten", 4: "Konsisten", 5: "Sangat konsisten" };
    const quality: IndicatorDefinition = {
      key: "quality", type: "quality", label: "Kekhusyukan salat", active: true,
      baseline: 1, target: 5, direction: "higher_is_better", unit: "skor",
      qualityRubric: rubric, actualSource: "external",
    };
    const publish = (areas: string[], definition = quality) => db.query("SELECT publish_ptp_draft($1,$2::JSONB)", [
      journeyId, JSON.stringify({
        selected_areas: areas,
        targets: Object.fromEntries(areas.map(area => [area, {
          mainTarget: "Meningkatkan konsistensi latihan",
          indicators: [serializePtpIndicator(definition)],
        }])),
      }),
    ]);

    await publish(["Spiritual Growth"]);
    expect((await db.query("SELECT quality_rubric,actual_source FROM ptp_indicators WHERE journey_id=$1", [journeyId])).rows)
      .toEqual([{ quality_rubric: rubric, actual_source: "external" }]);
    await expect(publish(["Spiritual Growth"], { ...quality, qualityRubric: { 1: "Belum konsisten" } }))
      .rejects.toThrow(/ptp_indicators_quality_rubric_check/);
    expect((await db.query("SELECT quality_rubric FROM ptp_indicators WHERE journey_id=$1", [journeyId])).rows)
      .toEqual([{ quality_rubric: rubric }]);

    const plan = (await db.query<{ id: string }>("INSERT INTO action_plans(user_id,journey_id,title,area_category) VALUES(auth.uid(),$1,'Tilawah harian','Spiritual Growth') RETURNING id", [journeyId])).rows[0].id;
    await publish(["Spiritual Growth"], {
      ...quality, key: "quantity", type: "quantity", qualityRubric: undefined,
      label: "Sesi tilawah", baseline: 0, target: 14, unit: "sesi",
      actualSource: "action_plan", linkedActionPlanIds: [plan],
    });
    expect((await db.query("SELECT quality_rubric,actual_source FROM ptp_indicators WHERE journey_id=$1", [journeyId])).rows)
      .toEqual([{ quality_rubric: null, actual_source: "action_plan" }]);
    expect((await db.query("SELECT action_plan_id FROM ptp_indicator_action_plans WHERE indicator_id IN (SELECT id FROM ptp_indicators WHERE journey_id=$1)", [journeyId])).rows)
      .toEqual([{ action_plan_id: plan }]);

    await owner();
    await db.exec("INSERT INTO batches(company_name,name,access_code,status) VALUES('Organisasi Uji','Program Kualitas','SLJ-QUALITY','active')");
    await asUser(users[7]);
    await db.query("SELECT enroll_participant_by_access_code($1,$2)", ["Peserta Kualitas", "SLJ-QUALITY"]);
    await publish(["Spiritual Growth", "Personal Development", "Relationship"]);
    expect((await db.query("SELECT area,quality_rubric FROM ptp_indicators WHERE journey_id=$1 ORDER BY area", [journeyId])).rows)
      .toEqual(["Personal Development", "Relationship", "Spiritual Growth"].map(area => ({ area, quality_rubric: rubric })));
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
    for (const file of ["034_execution_consistency.sql", "035_assessment_report_scope.sql", "036_trial_spiritual_practice.sql", "037_trial_weekly_evaluation.sql", "038_trial_practice_history.sql"]) {
      await db.exec(readFileSync(new URL("../../supabase/migrations/" + file, import.meta.url), "utf8"));
    }
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
