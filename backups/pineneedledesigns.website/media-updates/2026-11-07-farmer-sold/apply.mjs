import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({path:'backend/.env',quiet:true});
const root='/tmp/pine-farmer-sold-20261107', manifest=JSON.parse(await fs.readFile(root+'/manifest.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const f of manifest.files){
 assert(!f.path.includes('..')&&!path.isAbsolute(f.path));
 assert.equal(hash(await fs.readFile(root+'/uploads/'+f.path)),f.sha256);
 const destination='backend/uploads/'+f.path;
 try{assert.equal(hash(await fs.readFile(destination)),f.sha256,'Existing destination differs: '+f.path);}catch(e){if(e.code!=='ENOENT')throw e;}
}
await mongoose.connect(process.env.MONGODB_URI,{autoIndex:false});
try{
 const db=mongoose.connection.db;
 const before=await db.collection('products').find({}).toArray();
 for(const item of manifest.products){
  const p=before.find(p=>String(p._id)===item.id);assert(p);assert.equal(p.name,item.name);
  for(const [key,expected] of Object.entries(item.expected)) assert.deepEqual(p[key]??[],expected,'Catalog changed: '+p.name+' '+key);
 }
 for(const f of manifest.files){
  const destination='backend/uploads/'+f.path;await fs.mkdir(path.dirname(destination),{recursive:true});
  await fs.copyFile(root+'/uploads/'+f.path,destination+'.recovery-tmp');
  await fs.rename(destination+'.recovery-tmp',destination);
 }
 for(const item of manifest.products){
  const original=before.find(p=>String(p._id)===item.id);
  const result=await db.collection('products').updateOne({_id:original._id,updatedAt:original.updatedAt,photos:original.photos,videos:original.videos},{$set:{...item.set,updatedAt:new Date()}});
  assert.equal(result.matchedCount,1,'Concurrent catalog change: '+item.name);
 }
 const after=await db.collection('products').find({}).toArray();
 assert.equal(after.length,before.length);
 for(const original of before){
  const actual=after.find(p=>String(p._id)===String(original._id)),item=manifest.products.find(p=>p.id===String(original._id));
  if(item){for(const [key,value]of Object.entries(item.set))assert.deepEqual(actual[key],value);for(const key of [...Object.keys(item.set),'updatedAt']){delete actual[key];delete original[key];}}
  assert.deepEqual(actual,original,'Unexpected product changes');
 }
 for(const f of manifest.files)assert.equal(hash(await fs.readFile('backend/uploads/'+f.path)),f.sha256);
 for(const f of manifest.files){const response=await fetch('http://127.0.0.1:3001/uploads/'+f.path);assert.equal(response.status,200);assert.equal(hash(Buffer.from(await response.arrayBuffer())),f.sha256);}
 console.log(JSON.stringify({verifiedFiles:manifest.files.length,productsUpdated:manifest.products.map(p=>p.name),otherProductsPreserved:before.length-manifest.products.length},null,2));
}finally{await mongoose.disconnect();}
