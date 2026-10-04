import assert from "node:assert/strict";
const svc = await import("./src/features/ai/ai.service.js");
const jpeg = Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0]), Buffer.alloc(50)]);
const cats = [{id:"c1",slug:"gropi",name:"Gropi"},{id:"c2",slug:"gunoi",name:"Gunoi"}];
const good = {isAppropriate:true,showsUrbanIssue:true,isRealPhoto:true,imageQuality:"GOOD",matchesSelectedCategory:true,textIsAppropriate:true,textIsMeaningful:true,textDescribesUrbanIssue:true,textMatchesPhoto:true,suggestedCategorySlug:null,severity:"HIGH",containsFaces:false,containsLicensePlates:false,confidence:0.9,summary:"O groapă adâncă."};
const calls=[]; let plan={};
globalThis.fetch = async (url, opts) => {
  calls.push(url);
  const host = new URL(url).host;
  const handler = plan[host];
  if (!handler) throw new Error("unexpected host "+host);
  return handler(opts);
};
const ok = (b)=>({ok:true,status:200,json:async()=>b,text:async()=>JSON.stringify(b)});
const fail = (st)=>({ok:false,status:st,text:async()=>"err",json:async()=>({})});
const clear=()=>{for(const k of ["GEMINI_API_KEY","GROQ_API_KEY","OPENROUTER_API_KEY","ANTHROPIC_API_KEY","AI_PROVIDER"]) delete process.env[k]; calls.length=0;};

// 0. fara chei => SKIPPED
clear(); assert.equal(svc.isAiEnabled(), false);
let r = await svc.analyzeReportPhotos({images:[{buffer:jpeg}],categories:cats});
assert.equal(r.verdict,"SKIPPED"); console.log("0 fara cheie -> SKIPPED OK");

// 0a. verificarea locală respinge titlurile și descrierile aleatorii chiar fără AI
for (const [title, description] of [
  ["tgrfsead", ""], ["jyhftdg", "yftgd"], ["gsgefa", ""], ["dada", "gfd"], ["random app", ""],
]) {
  assert.equal(svc.localTextCheck(title, description).rejected, true, `${title} / ${description}`);
  r = await svc.analyzeReportPhotos({ title, description, categories: cats });
  assert.equal(r.verdict, "REJECTED", `${title} / ${description}`);
}
assert.equal(svc.localTextCheck("Groapă pe strada principală", "Asfaltul este deteriorat lângă stație.").rejected, false);
console.log("0a texte aleatorii respinse local; raport valid acceptat OK");

// 1. gemini
clear(); process.env.GEMINI_API_KEY="k"; plan={"generativelanguage.googleapis.com":(o)=>{
  const b=JSON.parse(o.body); assert.equal(o.headers["x-goog-api-key"],"k");
  assert.ok(b.contents[0].parts[0].inline_data.data);
  return ok({candidates:[{content:{parts:[{text:JSON.stringify(good)}]}}]});}};
r = await svc.analyzeReportPhotos({images:[{buffer:jpeg}],categories:cats,selectedCategoryId:"c1"});
assert.equal(r.verdict,"VERIFIED"); assert.equal(r.provider,"gemini"); assert.equal(r.analysis.severity,"HIGH");
console.log("1 gemini OK", svc.getAiStatus());

// 1a. Gemini analizeaza textul si fara fotografii
clear(); process.env.GEMINI_API_KEY="k"; plan={"generativelanguage.googleapis.com":(o)=>{
  const b=JSON.parse(o.body);
  assert.equal(b.contents[0].parts.length,1);
  assert.match(b.contents[0].parts[0].text,/nu sunt atașate fotografii/i);
  return ok({candidates:[{content:{parts:[{text:JSON.stringify(good)}]}}]});}};
r = await svc.analyzeReportPhotos({images:[],title:"Groapă pe strada principală",description:"Asfaltul este deteriorat lângă stație.",categories:cats});
assert.equal(r.verdict,"VERIFIED"); assert.equal(r.provider,"gemini");
plan["generativelanguage.googleapis.com"]=(o)=>ok({candidates:[{content:{parts:[{text:JSON.stringify({...good,textIsMeaningful:false,textDescribesUrbanIssue:false,confidence:0.95})}]}}]});
r = await svc.analyzeReportPhotos({images:[],title:"tgrfsead",description:"",categories:cats});
assert.equal(r.verdict,"REJECTED");
console.log("1a analiza textului fara fotografii OK");

// 2. fallback gemini 429 -> groq
clear(); process.env.GEMINI_API_KEY="k"; process.env.GROQ_API_KEY="g"; plan={
 "generativelanguage.googleapis.com":()=>fail(429),
 "api.groq.com":(o)=>{assert.equal(JSON.parse(o.body).messages[0].content[0].type,"image_url"); return ok({choices:[{message:{content:"```json\n"+JSON.stringify(good)+"\n```"}}]});}};
r = await svc.analyzeReportPhotos({images:[{buffer:jpeg}],categories:cats,selectedCategoryId:"c1"});
assert.equal(r.provider,"groq"); assert.deepEqual(calls.map(u=>new URL(u).host),["generativelanguage.googleapis.com","api.groq.com"]);
console.log("2 fallback 429 gemini -> groq OK");

// 3. openrouter + anthropic
clear(); process.env.OPENROUTER_API_KEY="o"; plan={"openrouter.ai":()=>ok({choices:[{message:{content:JSON.stringify(good)}}]})};
r = await svc.analyzeReportPhotos({images:[{buffer:jpeg}],categories:cats}); assert.equal(r.provider,"openrouter");
clear(); process.env.ANTHROPIC_API_KEY="a"; plan={"api.anthropic.com":()=>ok({content:[{type:"text",text:JSON.stringify(good)}]})};
r = await svc.analyzeReportPhotos({images:[{buffer:jpeg}],categories:cats}); assert.equal(r.provider,"anthropic");
console.log("3 openrouter + anthropic OK");

// 4. toti eșuează => SKIPPED, nu arunca
clear(); process.env.GEMINI_API_KEY="k"; plan={"generativelanguage.googleapis.com":()=>fail(500)};
r = await svc.analyzeReportPhotos({images:[{buffer:jpeg}],categories:cats}); assert.equal(r.verdict,"SKIPPED");
console.log("4 provider cazut -> SKIPPED (nu blocheaza) OK");

// 5. respingere continut nepotrivit / poza fara legatura
clear(); process.env.GEMINI_API_KEY="k";
plan={"generativelanguage.googleapis.com":()=>ok({candidates:[{content:{parts:[{text:JSON.stringify({...good,showsUrbanIssue:false,confidence:0.95})}]}}]})};
r = await svc.analyzeReportPhotos({images:[{buffer:jpeg}],categories:cats}); assert.equal(r.verdict,"REJECTED");
plan={"generativelanguage.googleapis.com":()=>ok({candidates:[{content:{parts:[{text:JSON.stringify({...good,isAppropriate:false})}]}}]})};
r = await svc.analyzeReportPhotos({images:[{buffer:jpeg}],categories:cats}); assert.equal(r.verdict,"REJECTED");
plan={"generativelanguage.googleapis.com":()=>ok({candidates:[{content:{parts:[{text:JSON.stringify({...good,suggestedCategorySlug:"gunoi",matchesSelectedCategory:false})}]}}]})};
r = await svc.analyzeReportPhotos({images:[{buffer:jpeg}],categories:cats,selectedCategoryId:"c1"});
assert.equal(r.verdict,"FLAGGED"); assert.equal(r.suggestedCategoryId,"c2");
console.log("5 REJECTED / FLAGGED + categorie sugerata OK");

// 6. avatar
clear(); process.env.GEMINI_API_KEY="k";
plan={"generativelanguage.googleapis.com":()=>ok({candidates:[{content:{parts:[{text:'{"isAppropriate":false,"confidence":0.9}'}]}}]})};
assert.equal((await svc.moderateAvatar(jpeg)).allowed,false);
plan={"generativelanguage.googleapis.com":()=>fail(500)};
assert.equal((await svc.moderateAvatar(jpeg)).allowed,true);
console.log("6 avatar moderation OK");
