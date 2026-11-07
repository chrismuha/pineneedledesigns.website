import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({path:'backend/.env',quiet:true});
const root='/tmp/pine-wild-card-photo-20261107',manifest=JSON.parse(await fs.readFile(root+'/manifest.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const f of manifest.files){
 assert(!f.path.includes('..')&&!path.isAbsolute(f.path));
 assert.equal(hash(await fs.readFile(root+'/uploads/'+f.path)),f.sha256);
 try{assert.equal(hash(await fs.readFile('backend/uploads/'+f.path)),f.sha256);}catch(e){if(e.code!=='ENOENT')throw e;}
}
await mongoose.connect(process.env.MONGODB_URI,{autoIndex:false});
try{
 const db=mongoose.connection.db,before={};
 for(const kind of ['products','collections','subcollections','storesettings'])before[kind]=await db.collection(kind).find({}).toArray();
 for(const item of manifest.changes){
  assert(['products','collections'].includes(item.kind));
  const record=before[item.kind].find(p=>String(p._id)===item.id);assert(record);assert.equal(record.name,item.name);
  for(const [key,value]of Object.entries(item.expected))assert.deepEqual(record[key],value,'Concurrent edit: '+item.name+' '+key);
 }
 for(const f of manifest.files){
  const destination='backend/uploads/'+f.path;await fs.mkdir(path.dirname(destination),{recursive:true});
  await fs.copyFile(root+'/uploads/'+f.path,destination+'.recovery-tmp');await fs.rename(destination+'.recovery-tmp',destination);
 }
 for(const item of manifest.changes){
  const record=before[item.kind].find(p=>String(p._id)===item.id);
  const result=await db.collection(item.kind).updateOne({_id:record._id,updatedAt:record.updatedAt,...item.expected},{$set:{...item.set,updatedAt:new Date()}});
  assert.equal(result.matchedCount,1,'Concurrent edit: '+item.name);
 }
 for(const kind of Object.keys(before)){
  const after=await db.collection(kind).find({}).toArray();assert.equal(after.length,before[kind].length);
  for(const record of before[kind]){
   const actual=after.find(p=>String(p._id)===String(record._id)),item=manifest.changes.find(p=>p.kind===kind&&p.id===String(record._id));
   if(item){for(const [key,value]of Object.entries(item.set))assert.deepEqual(actual[key],value);for(const key of [...Object.keys(item.set),'updatedAt']){delete actual[key];delete record[key];}}
   assert.deepEqual(actual,record,'Unexpected change in '+kind);
  }
 }
 for(const f of manifest.files){assert.equal(hash(await fs.readFile('backend/uploads/'+f.path)),f.sha256);const response=await fetch('http://127.0.0.1:3001/uploads/'+f.path);assert.equal(response.status,200);assert.equal(hash(Buffer.from(await response.arrayBuffer())),f.sha256);}
 console.log('Wild Card photo and Shirts fallback updated; all other product, collection, subcollection and store-setting values verified unchanged.');
}finally{await mongoose.disconnect();}
