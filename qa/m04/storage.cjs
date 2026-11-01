// Private S3-compatible fixture; no cloud credentials or production records.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const runtime='/tmp/m032/runtime';
process.env.NODE_PATH=runtime+'/server/node_modules';require('node:module').Module._initPaths();
async function main(){
 const root='/tmp/m04/private-s3';fs.mkdirSync(root,{recursive:true});
 const S3rver=require('/tmp/m04/fixture/node_modules/s3rver');const s3=new S3rver({address:'127.0.0.1',port:4569,directory:root,silent:false,configureBuckets:[{name:'storyboards-local'}]});s3.middleware.unshift(async(ctx,next)=>{if(!ctx.get('authorization')){ctx.status=403;return}await next()});console.log("Starting fixture");await s3.run();console.log("Fixture ready");
 Object.assign(process.env,{STORYBOARD_S3_ENDPOINT:'http://127.0.0.1:4569',STORYBOARD_S3_BUCKET:'storyboards-local',STORYBOARD_S3_ACCESS_KEY:'S3RVER',STORYBOARD_S3_SECRET_KEY:'S3RVER',STORYBOARD_S3_REGION:'us-east-1'});
 const {StoryboardStorage}=require(runtime+'/server-dist/storyboards/storage');const storage=new StoryboardStorage();
 try {console.log("Checking private bucket");await storage.health();console.log("Bucket checked");for(const file of ['Scene 09.pdf','Scene16_Storyboard.pdf']){const bytes=fs.readFileSync(path.join('/Users/thameralanezi/Downloads',file));await storage.put('fixtures/'+file,bytes,'application/pdf');const restored=await storage.get('fixtures/'+file);assert.deepEqual(restored,bytes);const denied=await fetch('http://127.0.0.1:4569/storyboards-local/fixtures/'+encodeURIComponent(file));console.log("Unsigned GET",denied.status);await denied.arrayBuffer();assert.equal(denied.status,403);console.log(file+': byte-exact private round trip; unsigned GET denied ('+bytes.length+' bytes)');}}
 finally{s3.httpServer?.closeAllConnections();await s3.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
