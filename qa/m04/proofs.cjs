const {chromium}=require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1100}});page.on('pageerror',e=>console.error('PAGE ERROR',e.message));
 await page.goto('http://127.0.0.1:5175/productiondesk/qa/m04/proof.html');
 const result=[];
 for(const [name,count]of [['Scene 09.pdf',3],['Scene16_Storyboard.pdf',2]]){
 await page.getByLabel('Production PDF').setInputFiles('/Users/thameralanezi/Downloads/'+name);
 for(let i=0;i<count;i++){
 await page.getByText(`Page ${i+1} of ${count}`,{exact:true}).waitFor();await page.getByRole('button',{name:'Suggest frames',exact:true}).click();
 const n=await page.getByLabel(/original label/).count();result.push({name,page:i+1,suggestions:n});
 await page.screenshot({path:`/tmp/m04/${name.startsWith('Scene 09')?'scene09':'scene16'}-crop-${i+1}.png`,fullPage:true});
 if(i<count-1)await page.getByRole('button',{name:'Next page',exact:true}).click();
 }
 }
 fs.writeFileSync('/tmp/m04/proof-results.json',JSON.stringify(result,null,2));console.log(result);
 await browser.close();}
main().catch(e=>{console.error(e);process.exit(1)});
