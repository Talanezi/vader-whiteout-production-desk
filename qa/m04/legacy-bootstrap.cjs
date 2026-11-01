// Existing entity schemas, only for the dedicated loopback QA database.
const path=require('node:path'),assert=require('node:assert/strict')
module.exports=async function(databaseUrl,runtime){
 const url=new URL(databaseUrl);assert.equal(url.hostname,'127.0.0.1');assert.equal(url.pathname,'/whiteout_m04')
 const {DataSource}=require(path.join(runtime,'server/node_modules/typeorm'))
 const {CallSheetDraftEntity}=require(path.join(runtime,'server-dist/callsheets/entities/callsheet-draft.entity'))
 const {RosterPersonEntity}=require(path.join(runtime,'server-dist/roster/entities/roster-person.entity'))
 const db=new DataSource({type:'postgres',url:databaseUrl,entities:[CallSheetDraftEntity,RosterPersonEntity],synchronize:false})
 await db.initialize()
 try{const [row]=await db.query("SELECT to_regclass('public.production_desk_callsheets') AS sheets,to_regclass('public.production_desk_roster_people') AS roster");if(!row.sheets||!row.roster)await db.synchronize(false)}finally{await db.destroy()}
}
