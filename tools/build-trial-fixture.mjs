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
await write("index.html", '<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="./fixture.tsx"></script></body></html>');
await write("link.tsx", 'import React from "react";export default function Link({prefetch,replace,scroll,...props}){return <a {...props}/>;}');
await write("navigation.ts", 'const router={push:(url)=>location.assign(url),replace:(url)=>location.replace(url),refresh:()=>{}};export const useRouter=()=>router;export const usePathname=()=>location.pathname;');
await write("pwa.ts", 'const result={updateBadge:()=>{},canInstall:false,isInstalled:false,isIos:false};export const usePwaInstall=()=>result;');
await write("supabase.ts", [
  'const id="00000000-0000-4000-8000-000000000010";',
  'const trial={kind:"trial",active:true,starts_at:new Date(Date.now()-2*86400000).toISOString(),expires_at:new Date(Date.now()+12*86400000).toISOString(),days:14,user_id:id,full_name:"Peserta Uji",timezone:"Asia/Riyadh",location:"Makkah"};',
  'const scenario=new URLSearchParams(location.search).get("scenario");',
  'let access=JSON.parse(sessionStorage.getItem("access")||"null")||({...trial,...(scenario==="expired"?{active:false,expires_at:new Date(Date.now()-86400000).toISOString()}:scenario==="none"?{kind:"none",active:false}: {})});',
  'const db=JSON.parse(sessionStorage.getItem("db")||"null")||{profiles:[{user_id:id,full_name:"Peserta Uji",program_code:"SLJ-TRIAL-14",timezone:"Asia/Riyadh",timezone_mode:"MANUAL",role:"participant",start_date:trial.starts_at,end_date:trial.expires_at,location:"Makkah"}],journeys:[{id:"journey",user_id:id,status:"ACTIVE",area_transformasi:["Spiritual Growth"]}],settings:[{user_id:id,preferred_prayer_city:"Makkah"}],notifications:[],prayer_logs:[],quran_logs:[],hadith_logs:[],journals:[]};',
  'function persist(){sessionStorage.setItem("db",JSON.stringify(db));sessionStorage.setItem("access",JSON.stringify(access));}',
  'class Query{constructor(table){this.table=table;this.op="read";this.filters=[];this.one=false;}select(){return this;}eq(k,v){this.filters.push([k,v]);return this;}ilike(k,v){this.filters.push([k,v]);return this;}order(){return this;}limit(){return this;}range(){return this;}in(){return this;}gte(){return this;}maybeSingle(){this.one=true;return this;}single(){this.one=true;return this;}update(v){this.op="update";this.value=v;return this;}insert(v){this.op="insert";this.value=v;return this;}upsert(v){this.op="upsert";this.value=v;return this;}delete(){this.op="delete";return this;}then(resolve,reject){return this.run().then(resolve,reject);}async run(){await new Promise(r=>setTimeout(r,40));if(this.op!=="read"&&window.__failSave)return{data:null,error:{message:"Synthetic connection failure"}};let rows=db[this.table]||[];const matches=r=>this.filters.every(([k,v])=>r[k]===v);let selected=rows.filter(matches);if(this.op==="insert"||this.op==="upsert"){selected=(Array.isArray(this.value)?this.value:[this.value]).map((v,i)=>({...v,id:v.id||"row-"+Date.now()+"-"+i,created_at:new Date().toISOString()}));if(this.op==="upsert"){rows=rows.filter(old=>!selected.some(row=>old.user_id===row.user_id&&old.date===row.date&&old.prayer_name===row.prayer_name));}rows.push(...selected);}if(this.op==="delete")rows=rows.filter(r=>!matches(r));if(this.op==="update")for(const row of selected)Object.assign(row,this.value);if(this.op!=="read"){db[this.table]=rows;persist();}return{data:this.one?selected[0]||null:selected,error:null,count:selected.length};}}',
  'const settings=()=>JSON.parse(sessionStorage.getItem("trialSettings")||"null")||{enabled:true,signup_until:null};',
  'function overview(){return{settings:settings(),total:2,active:1,participants:[{user_id:id,full_name:"Peserta Uji",starts_at:trial.starts_at,expires_at:trial.expires_at,status:"active"},{user_id:"expired",full_name:"Peserta yang masa trialnya berakhir",starts_at:new Date(Date.now()-18*86400000).toISOString(),expires_at:new Date(Date.now()-4*86400000).toISOString(),status:"expired"}]};}',
  'const client={auth:{getUser:async()=>({data:{user:{id,email:"peserta@example.invalid",user_metadata:{full_name:"Peserta Uji"},app_metadata:{role:location.pathname.startsWith("/admin")?"admin":"participant"}}}}),signOut:async()=>{}},from:table=>new Query(table),rpc:async(name,args)=>{if(name==="slj_access_status")return{data:access,error:null};if(name==="slj_trial_offer")return{data:{enabled:settings().enabled,days:14},error:null};if(name==="start_slj_spiritual_trial"){access={...trial,full_name:args.p_full_name,location:args.p_city,timezone:args.p_timezone,starts_at:new Date().toISOString(),expires_at:new Date(Date.now()+14*86400000).toISOString()};persist();return{data:access,error:null};}if(name==="enroll_participant_by_access_code"){access.kind="program";persist();return{data:{},error:null};}if(name==="admin_set_slj_trial_offer"){sessionStorage.setItem("trialSettings",JSON.stringify({enabled:args.p_enabled,signup_until:args.p_signup_until}));return{data:overview(),error:null};}if(name==="admin_slj_trial_overview")return{data:overview(),error:null};return{data:[],error:null};}};',
  'export const createClient=()=>client;',
].join("\n"));
await write("fixture.tsx", [
  'import React from "react";import{createRoot}from"react-dom/client";',
  'import Trial from "@/app/trial/page";import Onboarding from "@/app/onboarding/page";import Guide from "@/app/panduan/page";import TrialAdmin from "@/app/admin/trials/page";import AdminLayout from "@/app/admin/layout";import LandingPage from "@/app/page";import Journal from "@/app/journal/page";import {PricingSection}from"@/components/landing/PricingSection";',
  'const p=location.pathname;const View=p.startsWith("/admin")?()=> <AdminLayout><TrialAdmin/></AdminLayout>:p==="/onboarding"?Onboarding:p==="/panduan"?Guide:p==="/journal"?Journal:p==="/pricing"?PricingSection:p==="/dashboard"?()=> <h1>Program penuh</h1>:p==="/"?LandingPage:Trial;',
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
