/** Bounded ZIP32 store writer. PDFs are already compressed; no second archive runtime. */
const table=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
function crc(bytes:Buffer){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
export function zipFiles(files:{name:string;bytes:Buffer}[]){
 if(!files.length||files.length>40||files.reduce((n,f)=>n+f.bytes.length,0)>32*1024*1024)throw Error('Choose fewer departments for this pack (32 MB maximum).');
 const chunks:Buffer[]=[],directory:Buffer[]=[];let offset=0;
 for(const f of files){const name=Buffer.from(f.name),sum=crc(f.bytes),h=Buffer.alloc(30),d=Buffer.alloc(46);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(0x21,12);h.writeUInt32LE(sum,14);h.writeUInt32LE(f.bytes.length,18);h.writeUInt32LE(f.bytes.length,22);h.writeUInt16LE(name.length,26);d.writeUInt32LE(0x02014b50);d.writeUInt16LE(20,4);d.writeUInt16LE(20,6);d.writeUInt16LE(0x800,8);d.writeUInt16LE(0x21,14);d.writeUInt32LE(sum,16);d.writeUInt32LE(f.bytes.length,20);d.writeUInt32LE(f.bytes.length,24);d.writeUInt16LE(name.length,28);d.writeUInt32LE(offset,42);chunks.push(h,name,f.bytes);directory.push(d,name);offset+=h.length+name.length+f.bytes.length;}
 const central=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...chunks,central,end]);
}
export const safeFilename=(s:string)=>s.normalize('NFKC').replace(/[\x00-\x1f<>:"/\\|?*]+/g,'-').replace(/\.+$/,'').trim().slice(0,80)||'Schedule';
