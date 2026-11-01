// Integrated M04 acceptance. Real sources, private local infrastructure; no production writes.
const {spawnSync}=require('node:child_process');
function run(file,env={}){const r=spawnSync(process.execPath,['qa/m04/'+file+'.cjs'],{stdio:'inherit',env:{...process.env,...env}});if(r.status!==0)process.exit(r.status||1)}
for(const file of ['integrated','journey','individual-panels','scene16-individual','crop-edit','from-shots','linking','source-contract','revisions','panel-delete','export','annotation-pdf','correction-visual','motion','layout','reconnect','security','regression'])run(file);
for(const file of ['individual-panels','scene16-individual','correction-visual','motion','export'])run(file,{M04_BROWSER:'webkit'});
console.log('M04 integrated browser, rendering, security and regression acceptance passed. Native Chrome zoom is a separate headed test: node qa/m04/zoom.cjs');
