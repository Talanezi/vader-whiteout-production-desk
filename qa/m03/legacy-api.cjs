const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const runtime=process.env.M03_RUNTIME||'/tmp/whiteout-m03-research',state=JSON.parse(fs.readFileSync(path.join(runtime,'local-state.json')))
async function request(route,method='GET',body){const r=await fetch(state.api+route,{method,headers:{Authorization:'Bearer '+state.tokens['101'],'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});assert.ok(r.ok,await r.clone().text());return r.json()}
async function main(){
 await require('./legacy-bootstrap.cjs')(state.databaseUrl,runtime)
 const sheet=await request('/callsheets','POST',{title:'Local M03 regression',productionDate:'2026-11-03'})
 const saved=await request('/callsheets/'+sheet.id,'PUT',{title:'Local M03 regression saved',productionDate:'2026-11-04'})
 assert.equal(saved.productionDate,'2026-11-04');const copy=await request('/callsheets/'+sheet.id+'/duplicate','POST');assert.notEqual(copy.id,sheet.id);assert.match(copy.title,/Copy/)
 assert.ok((await request('/callsheets')).items.some(s=>s.id===sheet.id))
 const person=await request('/roster','POST',{name:'Local QA person',category:'crew',notes:'Regression fixture'})
 const edited=await request('/roster/'+person.id,'PUT',{active:false,roleOrDepartment:'Camera'});assert.equal(edited.active,false);assert.equal(edited.roleOrDepartment,'Camera')
 assert.ok((await request('/roster')).items.some(p=>p.id===person.id))
 await request('/roster/'+person.id,'DELETE');await request('/callsheets/'+copy.id,'DELETE');await request('/callsheets/'+sheet.id,'DELETE')
 const report={pass:true,name:'Existing call-sheet create/list/manual-save/duplicate/delete and roster CRUD use the unchanged authenticated Nest services with real local PostgreSQL. Only records created by this test were deleted. No PDF rendering or email delivery requested.'}
 fs.writeFileSync('client/qa/m03/artifacts/legacy-api.json',JSON.stringify(report,null,2)+'\n');console.log('PASS',report.name)
}
main().catch(e=>{console.error(e);process.exitCode=1})
