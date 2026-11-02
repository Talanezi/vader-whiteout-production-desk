// Current integrated Studio acceptance; requires the isolated loopback fixture stack.
const {spawnSync}=require('node:child_process');
function run(file,env={}){const r=spawnSync(process.execPath,['qa/m04/'+file+'.cjs'],{stdio:'inherit',env:{...process.env,...env}});if(r.status!==0)process.exit(r.status||1)}
for(const file of ['studio-engine','index','studio','studio-input','studio-import','studio-scene16','studio-surfaces','studio-revisions','studio-legacy','studio-recovery','studio-linking','studio-compact','linking','collaboration','security','reconnect','regression'])run(file);
for(const file of ['studio','studio-input','studio-import','studio-scene16','studio-surfaces','studio-compact'])run(file,{M04_BROWSER:'webkit'});
console.log('Current Studio acceptance passed. Actual headed native Chrome zoom remains separate: node qa/m04/zoom.cjs. Historical Konva/page-import proof scripts are retained but are not the primary Studio acceptance.');
