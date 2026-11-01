const {chromium}=require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),assert=require('node:assert/strict');
async function main(){const browser=await chromium.launch({headless:true});try{const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5175/productiondesk/qa/m04/proof.html');await page.getByLabel('Production PDF').setInputFiles('/Users/thameralanezi/Downloads/Scene 09.pdf');await page.getByText('Page 1 of 3',{exact:true}).waitFor();await page.getByRole('button',{name:'Suggest frames',exact:true}).click();await page.getByRole('button',{name:'Annotate first crop',exact:true}).click();
const canvas=page.locator('.sb-canvas');await canvas.scrollIntoViewIfNeeded();await page.waitForTimeout(500);const box=await canvas.boundingBox();
async function stroke(tool,points){await page.getByRole('button',{name:tool,exact:true}).click();await page.mouse.move(box.x+points[0][0],box.y+points[0][1]);await page.mouse.down();for(const p of points.slice(1))await page.mouse.move(box.x+p[0],box.y+p[1],{steps:8});await page.mouse.up();}
await stroke('Pen',[[500,180],[530,160],[560,170],[590,200],[630,180]]);await stroke('Arrow',[[500,280],[700,240]]);
await page.getByRole('button',{name:'Text',exact:true}).click();await page.mouse.click(box.x+500,box.y+350);await page.getByLabel('Annotation text').fill('VADER → entrée');await page.getByRole('button',{name:'Apply',exact:true}).click();
const objects=()=>page.getByTestId('objects').textContent().then(JSON.parse);assert.equal((await objects()).length,3);assert.equal((await objects())[2].text,'VADER → entrée');
await page.locator('.sb-annotation-tools').getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-testid=objects]').textContent).length===2);await page.locator('.sb-annotation-tools').getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-testid=objects]').textContent).length===3);
await page.getByRole('button',{name:'Select',exact:true}).click();
// Select arrow and move its midpoint using actual pointer input, not a model mutation.
const arrowPoint=await page.evaluate(()=>{const a=window.m04Stage.find('Arrow')[0],p=a.points();return a.getAbsoluteTransform().point({x:p[2],y:p[3]})});
await page.mouse.click(box.x+arrowPoint.x,box.y+arrowPoint.y);
await page.waitForFunction(()=>window.m04Stage.find('Circle').length===3);
await page.mouse.move(box.x+arrowPoint.x,box.y+arrowPoint.y);await page.mouse.down();await page.mouse.move(box.x+arrowPoint.x,box.y+arrowPoint.y-55,{steps:12});await page.mouse.up();

await page.waitForFunction(()=>{const a=JSON.parse(document.querySelector('[data-testid=objects]').textContent).find(a=>a.type==='arrow');return Math.abs(a.points[1][1]-(a.points[0][1]+a.points[2][1])/2)>.02});
await page.screenshot({path:'/tmp/m04/annotation-proof.png',fullPage:true});
const exported=await page.evaluate(()=>{const stage=window.m04Stage,art=stage.findOne('.artwork'),group=art.getParent().clone({x:0,y:0,scaleX:1,scaleY:1});group.find('Transformer').forEach(n=>n.destroy());group.find('Circle').forEach(n=>n.destroy());const output=group.toDataURL({x:0,y:0,width:1000,height:art.height(),pixelRatio:3});group.destroy();return output});require('node:fs').writeFileSync('/tmp/m04/annotation-high-resolution.png',Buffer.from(exported.split(',')[1],'base64'));
const before=await objects();await page.locator('.sb-annotation-tools').getByRole('button',{name:'Zoom in',exact:true}).click();await page.getByRole('button',{name:'Fit',exact:true}).click();assert.deepEqual(await objects(),before);await page.getByLabel('Show annotations',{exact:true}).uncheck();assert.deepEqual(await objects(),before);await page.reload();await page.getByTestId('objects').waitFor();assert.deepEqual(await objects(),before);assert.deepEqual(errors,[]);console.log('Pen, arrow, Unicode text, undo/redo, zoom/Fit, hide, Yjs reload preserved; no page errors.');
}finally{await browser.close()}}
main().catch(e=>{console.error(e);process.exitCode=1});
