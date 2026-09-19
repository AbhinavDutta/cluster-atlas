import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {clusters} from '../dist/data.js';
for(const path of ['index.html',...clusters.map(c=>'clusters/'+c.id+'/index.html')]){
 const html=await readFile(new URL('../dist/'+path,import.meta.url),'utf8');
 for(const key of ['og:title','og:description','og:image','og:url','twitter:card','twitter:image'])assert.equal((html.match(new RegExp('(?:property|name)="'+key+'"','g'))||[]).length,1,path+' '+key);
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1,path);
 assert.ok(html.includes('summary_large_image'));
 assert.ok(html.includes('rel="icon"'));
 assert.ok(html.includes('src="/logo.png"'));
}
const png=await readFile(new URL('../dist/social-preview.png',import.meta.url));
assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
console.log(`PASS homepage and ${clusters.length} cluster metadata, logo/favicon, 1200×630 preview.`);
