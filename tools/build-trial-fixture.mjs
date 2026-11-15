import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const root = process.cwd();
const require = createRequire(import.meta.url);
const testRequire = createRequire(require.resolve("vitest/package.json"));
const { build } = await import(pathToFileURL(testRequire.resolve("vite")).href);
const dir = path.join(root, "tmp/trial-ui-fixture");
await fs.mkdir(dir, { recursive: true });
const write = (name, body) => fs.writeFile(path.join(dir, name), body);
await write("index.html", '<!doctype html><html lang="id"><head><title>SLJ isolated component verification</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="./fixture.tsx"></script></body></html>');
await write("link.tsx", 'import React from "react";export default function Link({prefetch,replace,scroll,...props}){return <a {...props}/>;}');
await write("navigation.ts", 'const router={push:(url)=>location.assign(url),replace:(url)=>location.replace(url),refresh:()=>{}};export const useRouter=()=>router;export const usePathname=()=>location.pathname;export const useParams=()=>({id:location.pathname.split("/")[3]});');
await write("pwa.ts", 'const result={updateBadge:count=>window.dispatchEvent(new CustomEvent("slj:unread",{detail:count})),canInstall:false,isInstalled:false,isIos:false};export const usePwaInstall=()=>result;');
await write("supabase.ts", [
  'const id="00000000-0000-4000-8000-000000000010";',
  'const trial={kind:"trial",active:true,starts_at:new Date(Date.now()-2*86400000).toISOString(),expires_at:new Date(Date.now()+12*86400000).toISOString(),days:14,user_id:id,full_name:"Peserta Uji",timezone:"Asia/Riyadh",location:"Makkah"};',
  'const scenario=new URLSearchParams(location.search).get("scenario");',
  'let access=JSON.parse(sessionStorage.getItem("access")||"null")||({...trial,...(scenario==="expired"?{active:false,expires_at:new Date(Date.now()-86400000).toISOString()}:scenario==="none"?{kind:"none",active:false}: {})});',
  'const db=JSON.parse(sessionStorage.getItem("db")||"null")||{profiles:[{user_id:id,full_name:"Peserta Uji",program_code:"SLJ-TRIAL-14",timezone:"Asia/Riyadh",timezone_mode:"MANUAL",role:"participant",start_date:trial.starts_at,end_date:trial.expires_at,location:"Makkah"}],journeys:[{id:"journey",user_id:id,status:"ACTIVE",area_transformasi:["Spiritual Growth"]}],settings:[{user_id:id,preferred_prayer_city:"Makkah"}],notifications:[],prayer_logs:[],quran_logs:[],hadith_logs:[],journals:[]};',
  'if((scenario==="program"||scenario==="program-empty")&&!sessionStorage.getItem("programSeeded")){sessionStorage.setItem("programSeeded","true");access={...trial,kind:"program",days:90};const start=new Date(Date.now()-31*86400000).toISOString();db.profiles[0]={...db.profiles[0],program_code:"SLJ-DEMO",start_date:start,created_at:start,timezone_mode:"MANUAL"};const areas=["Spiritual Growth","Personal Development","Relationship"];db.journeys[0]={...db.journeys[0],created_at:start,start_date:start,area_transformasi:areas,ptp_status:"EDITABLE",muhasabah:"Saya ingin menjalani hari dengan lebih terarah.",niat:"Menjaga kebiasaan dan membangun relasi.",main_target:JSON.stringify(Object.fromEntries(areas.map(area=>[area,{mainTarget:"Menjaga kebiasaan yang konsisten",indicators:[]}])))};db.habits=scenario==="program-empty"?[]:areas.map((area,i)=>({id:"habit-"+i,user_id:id,title:["Refleksi pagi","Menyusun prioritas","Menghubungi keluarga"][i],frequency:"daily",frequency_kind:"daily",quantity:1,target:1,area_category:area,effective_from:start.slice(0,10)}));db.action_plans=[];db.baseline_assessments=[];db.sahabat_safar_profiles=[];db.monthly_reviews=[];db.ptp_indicators=[];db.habit_logs=[];sessionStorage.setItem("access",JSON.stringify(access));sessionStorage.setItem("db",JSON.stringify(db));}',
  'const coachRoute=location.pathname.startsWith("/coach");const viewerRole=coachRoute?(new URLSearchParams(location.search).get("as")==="admin"?"admin":"coach"):(location.pathname.startsWith("/admin")?"admin":"participant");',
  'const coachedParticipant={user_id:"coached-participant",full_name:"Peserta Bimbingan Uji",company_name:"Organisasi Uji",batch_name:"Angkatan Uji",journey_status:"ACTIVE",journey_id:"coached-journey",muhasabah:"Mengenali kebiasaan yang ingin diubah.",niat:"Mendengarkan dengan lebih baik.",main_target:"Memperbaiki komunikasi tim."};',
  'if(coachRoute){db.profiles[0]={...db.profiles[0],role:viewerRole,full_name:"Coach Uji"};db.monthly_reviews=[{user_id:coachedParticipant.user_id,month_number:1,status:"ON_TRACK",participant_note:"Sudah mencoba sesi refleksi rutin.",coach_note:"Lanjutkan pencatatan pendek.",first_submitted_at:"2026-10-15T12:00:00Z"}];}',
  'const coachAssessment=()=>JSON.parse(sessionStorage.getItem("coachAssessment")||"null");',
  'function assessment(){return {participant:coachedParticipant,baseline:{completed:true,score:40,areas:[{area:"Spiritual Growth",score:40}]},period:{start_date:"2026-10-01",timezone:"Asia/Jakarta"},metrics:{outcome:{score:60,areas:[{area:"Spiritual Growth",score:60,active_indicators:1,measured_indicators:1}]},execution:{score:75,areas:[{area:"Spiritual Growth",score:75}]},coach_assessment:coachAssessment()}};}',
  'function saveAssessment(args){if(viewerRole!=="coach"||window.__failSave)return {data:null,error:{message:"Synthetic save failure"}};const score=Math.round(args.p_scores.reduce((total,item)=>total+item.score/5*item.weight,0));const row={coach_score:score,validated_outcome:Math.round(score*.4+60*.6),validation_status:args.p_validation_status,evidence_note:args.p_evidence_note,rubric_scores:args.p_scores.map(item=>({rubric_key:item.key,score:item.score}))};sessionStorage.setItem("coachAssessment",JSON.stringify(row));return {data:row,error:null};}',
  'function persist(){sessionStorage.setItem("db",JSON.stringify(db));sessionStorage.setItem("access",JSON.stringify(access));}',
  'class Query{constructor(table){this.table=table;this.op="read";this.filters=[];this.one=false;}select(){return this;}eq(k,v){this.filters.push([k,v]);return this;}ilike(k,v){this.filters.push([k,v]);return this;}neq(){return this;}lte(){return this;}not(){return this;}is(){return this;}contains(){return this;}or(){return this;}order(){return this;}limit(){return this;}range(){return this;}in(){return this;}gte(){return this;}maybeSingle(){this.one=true;return this;}single(){this.one=true;return this;}update(v){this.op="update";this.value=v;return this;}insert(v){this.op="insert";this.value=v;return this;}upsert(v,options){this.op="upsert";this.value=v;this.conflict=options?.onConflict?.split(",");return this;}delete(){this.op="delete";return this;}then(resolve,reject){return this.run().then(resolve,reject);}async run(){await new Promise(r=>setTimeout(r,window.__sljReadDelay??40));if(this.op!=="read"&&window.__failSave)return{data:null,error:{message:"Synthetic connection failure"}};let rows=db[this.table]||[];const matches=r=>this.filters.every(([k,v])=>r[k]===v);let selected=rows.filter(matches);if(this.op==="insert"||this.op==="upsert"){selected=(Array.isArray(this.value)?this.value:[this.value]).map((v,i)=>({...v,...(this.table==="habit_logs"?{is_canonical_occurrence:true}:{}),id:v.id||"row-"+Date.now()+"-"+i,created_at:new Date().toISOString()}));if(this.op==="upsert"){rows=rows.filter(old=>!selected.some(row=>(this.conflict||["user_id","date","prayer_name"]).every(key=>old[key]===row[key])));}rows.push(...selected);}if(this.op==="delete")rows=rows.filter(r=>!matches(r));if(this.op==="update")for(const row of selected)Object.assign(row,this.value);if(this.op!=="read"){db[this.table]=rows;persist();}return{data:this.one?selected[0]||null:selected,error:null,count:selected.length};}}',
  'const settings=()=>JSON.parse(sessionStorage.getItem("trialSettings")||"null")||{enabled:true,signup_until:null};',
  'const trialEvents=JSON.parse(sessionStorage.getItem("trialAccessEvents")||"[]");',
  'function workspace({p_search="",p_status="all",p_limit=20,p_offset=0}={}){',
  '  const active={user_id:id,full_name:access.full_name,starts_at:access.starts_at,expires_at:access.expires_at,status:access.trial_status||"active",trial_day:3,active_days:2,last_activity_at:new Date().toISOString(),week_1_submitted:true,week_2_submitted:false};',
  '  const expired={...active,user_id:"expired",full_name:"Peserta yang masa trialnya berakhir",starts_at:new Date(Date.now()-18*86400000).toISOString(),expires_at:new Date(Date.now()-4*86400000).toISOString(),status:"expired",trial_day:14};',
  '  const people=[active,expired,...Array.from({length:21},(_,index)=>({...expired,user_id:"past-"+index,full_name:"Peserta Contoh "+String(index+1).padStart(2,"0"),starts_at:new Date(Date.now()-(19+index)*86400000).toISOString(),expires_at:new Date(Date.now()-(5+index)*86400000).toISOString(),status:index%5===0?"program":"expired"}))];',
  '  const filtered=people.filter(person=>(p_status==="all"||person.status===p_status)&&person.full_name.toLowerCase().includes(p_search.trim().toLowerCase()));',
  '  const counts=Object.fromEntries(["all","active","paused","expired","program"].map(status=>[status,status==="all"?people.length:people.filter(person=>person.status===status).length]));',
  '  return {settings:settings(),counts,filtered_total:filtered.length,participants:filtered.slice(p_offset,p_offset+p_limit)};',
  '}',
  'function setTrialPause(args){',
  '  access={...access,active:!args.p_paused,trial_status:args.p_paused?"paused":"active"};',
  '  trialEvents.unshift({id:String(trialEvents.length),user_id:args.p_user_id,actor_name:"Admin Uji",paused:args.p_paused,reason:args.p_reason,created_at:new Date().toISOString()});',
  '  sessionStorage.setItem("trialAccessEvents",JSON.stringify(trialEvents));',
  '  persist();',
  '  return {data:null,error:null};',
  '}',
  'const client={auth:{getUser:async()=>({data:{user:{id,email:"peserta@example.invalid",user_metadata:{full_name:"Peserta Uji"},app_metadata:{role:viewerRole}}}}),signOut:async()=>{}},from:table=>new Query(table),rpc:async(name,args)=>{if(name==="save_ptp_draft"||name==="publish_ptp_draft"){if(name==="save_ptp_draft"&&window.__draftHold){window.__draftStarted=true;await window.__draftHold;}if(window.__failSave)return{data:null,error:{message:"Synthetic save failure"}};const journey=db.journeys.find(row=>row.id===args.p_journey_id);if(name==="save_ptp_draft")journey.ptp_draft=args.p_draft;else{journey.area_transformasi=args.p_draft.selected_areas;journey.main_target=JSON.stringify(args.p_draft.targets);journey.ptp_published_at=new Date().toISOString();journey.ptp_draft=null;db.ptp_indicators=Object.entries(args.p_draft.targets).flatMap(([area,target])=>target.indicators.map(item=>({...item,id:item.key,user_id:id,participant_user_id:id,journey_id:journey.id,area,indicator_key:item.key,indicator_type:item.type,baseline_value:item.baseline,target_value:item.target,actual_source:item.actual_source||"self_report"})));}persist();return{data:{published:name==="publish_ptp_draft"},error:null};}if(name==="get_coach_participants")return{data:[{...coachedParticipant,participant_user_id:coachedParticipant.user_id,days_inactive:15}],error:null};if(name==="get_participant_assessment")return{data:assessment(),error:null};if(name==="save_coach_assessment")return saveAssessment(args);if(name==="get_admin_group_impact")return{data:{methodology_version:"1.0",participants:[]},error:null};if(name==="slj_access_status")return{data:access,error:null};if(name==="get_slj_trial_result")return{data:{reviews:db.monthly_reviews||[],indicators:db.ptp_indicators||[],actuals:db.ptp_indicator_actuals||[],reflection:db.journeys[0].final_reflection||null},error:null};if(name==="slj_trial_offer")return{data:{enabled:settings().enabled,days:14},error:null};if(name==="start_slj_spiritual_trial"){access={...trial,full_name:args.p_full_name,location:args.p_city,timezone:args.p_timezone,starts_at:new Date().toISOString(),expires_at:new Date(Date.now()+14*86400000).toISOString()};persist();return{data:access,error:null};}if(name==="enroll_participant_by_access_code"){access.kind="program";persist();return{data:{},error:null};}if(name==="admin_set_slj_trial_offer"){sessionStorage.setItem("trialSettings",JSON.stringify({enabled:args.p_enabled,signup_until:args.p_signup_until}));return{data:{settings:settings()},error:null};}if(name==="admin_slj_trial_workspace")return{data:workspace(args),error:null};if(name==="admin_slj_trial_access_history")return{data:trialEvents.filter(event=>event.user_id===args.p_user_id),error:null};if(name==="admin_slj_set_trial_pause")return setTrialPause(args);return{data:[],error:null};}};',
  'export const createClient=()=>client;',
].join("\n"));
await write("fixture.tsx", [
  'import React from "react";import{createRoot}from"react-dom/client";',
  'import Trial from "@/app/trial/page";import TrialResult from "@/app/trial/result/page";import Onboarding from "@/app/onboarding/page";import Guide from "@/app/panduan/page";import TrialAdmin from "@/app/admin/trials/page";import AdminLayout from "@/app/admin/layout";import LandingPage from "@/app/page";import Journal from "@/app/journal/page";import {PricingSection}from"@/components/landing/PricingSection";',
  'import Dashboard from "@/app/dashboard/page";import Monitoring from "@/app/monitoring/page";import Profile from "@/app/profile/page";import Settings from "@/app/settings/page";import Journey from "@/app/journey/page";import Baseline from "@/app/baseline/page";import Initial from "@/app/initial-process/page";import Notifications from "@/app/notifications/page";import AdminHome from "@/app/admin/page";import AdminMonitoring from "@/app/admin/monitoring/page";import AdminParticipants from "@/app/admin/participants/page";import AdminReport from "@/app/admin/report/page";import AdminCompanies from "@/app/admin/companies/page";import AdminBatches from "@/app/admin/batches/page";import AdminCoaches from "@/app/admin/coaches/page";',
  'import CoachHome from "@/app/coach/page";import CoachDetail from "@/app/coach/participants/[id]/page";import CoachHistory from "@/app/coach/participants/[id]/history/page";',
  'const p=location.pathname;const AdminPage=({"/admin":AdminHome,"/admin/monitoring":AdminMonitoring,"/admin/participants":AdminParticipants,"/admin/report":AdminReport,"/admin/companies":AdminCompanies,"/admin/batches":AdminBatches,"/admin/coaches":AdminCoaches})[p]||TrialAdmin;const View=p==="/trial/result"?TrialResult:p.startsWith("/admin")?()=> <AdminLayout><AdminPage/></AdminLayout>:p==="/onboarding"?Onboarding:p==="/panduan"?Guide:p==="/journal"?Journal:p==="/pricing"?PricingSection:p==="/dashboard"?Dashboard:p==="/monitoring"?Monitoring:p==="/profile"?Profile:p==="/settings"?Settings:p==="/journey"?Journey:p==="/baseline"?Baseline:p==="/initial-process"?Initial:p==="/notifications"?Notifications:p==="/coach"?CoachHome:p.startsWith("/coach/participants/")?(p.endsWith("/history")?CoachHistory:CoachDetail):p==="/"?LandingPage:Trial;',
  'createRoot(document.getElementById("root")).render(<View/>);',
].join("\n"));
const dist = path.join(dir, "dist");
await build({
  root: dir, configFile: false, publicDir: false, logLevel: "error",
  plugins: [{
    name: "actual-components-with-isolated-provider", enforce: "pre",
    resolveId(source) {
      if (source === "@/lib/supabase/client") return path.join(dir, "supabase.ts");
      if (source === "@/components/pwa/PwaProvider") return path.join(dir, "pwa.ts");
    },
    transform(code, id) {
      if (id.endsWith(".tsx")) return { code: ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText, map: null };
    },
  }],
  resolve: { alias: [
    { find: "@/lib/supabase/client", replacement: path.join(dir, "supabase.ts") },
    { find: "@/components/pwa/PwaProvider", replacement: path.join(dir, "pwa.ts") },
    { find: "next/link", replacement: path.join(dir, "link.tsx") },
    { find: "next/navigation", replacement: path.join(dir, "navigation.ts") },
    { find: "@", replacement: path.join(root, "src") },
  ] },
  build: { outDir: dist, emptyOutDir: true, minify: false },
});
execFileSync(process.execPath, [require.resolve("tailwindcss/lib/cli.js"), "-i", path.join(root, "src/app/globals.css"), "-o", path.join(dist, "fixture.css"), "--minify"], { cwd: root, stdio: "pipe" });
let css = await fs.readFile(path.join(dist, "fixture.css"), "utf8");
css += '\n@font-face{font-family:"FixtureJakarta";src:url("/PlusJakartaSans-Variable.ttf")}body{--font-jakarta-sans:FixtureJakarta;font-family:FixtureJakarta,sans-serif;}';
await fs.writeFile(path.join(dist, "fixture.css"), css);
for (const [source, target] of [["BinaJourney_logo.webp","BinaJourney_logo.webp"],["fonts/plus-jakarta-sans/PlusJakartaSans-Variable.ttf","PlusJakartaSans-Variable.ttf"]]) await fs.copyFile(path.join(root, "public", source), path.join(dist, target));
console.log("Built isolated UI fixture with actual SLJ components:", dist);
