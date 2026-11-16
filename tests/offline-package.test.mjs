import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { createOfflineZip, inspectOfflineZip, buildOfflinePackage, verifyOfflinePackage, offlineCrc32, OFFLINE_ENTRY_NAME } from '../tools/build-offline-package.mjs';

test('ZIP CRC32 matches published IEEE check values and handles empty bytes',()=>{
  assert.equal(offlineCrc32(Buffer.from('123456789')),0xcbf43926);
  assert.equal(offlineCrc32(Buffer.alloc(0)),0);
});

test('offline ZIP has one fixed UTF-8 HTML entry, consistent directory, exact bytes and deterministic output',()=>{
  const input=Buffer.from('<!doctype html><meta charset="utf-8"><title>Ordre de Cendre — Vérification 🔥</title>\n<script>const original="'+('ABCdef0123456789'.repeat(2000))+'";</script>\n','utf8');
  const before=Buffer.from(input), first=createOfflineZip(input), second=createOfflineZip(input), zip=first.bytes;
  assert.deepEqual(zip,second.bytes); assert.deepEqual(input,before,'Packaging cannot modify source bytes');
  assert.ok(zip.length<input.length,'Fixture is actually compressed');
  assert.equal(zip.readUInt32LE(0),0x04034b50);
  assert.equal(zip.readUInt16LE(6),0x0800,'UTF-8 flag');
  assert.equal(zip.readUInt16LE(8),8,'Raw Deflate');
  assert.equal(zip.readUInt16LE(10),0); assert.equal(zip.readUInt16LE(12),0x0021,'Fixed 1980-01-01');
  const nameLength=zip.readUInt16LE(26), extraLength=zip.readUInt16LE(28), start=30+nameLength+extraLength;
  assert.equal(zip.subarray(30,30+nameLength).toString('utf8'),OFFLINE_ENTRY_NAME);
  assert.equal(extraLength,0); assert.equal(zip.readUInt32LE(14),first.crc32);
  assert.equal(zip.readUInt32LE(22),input.length); assert.equal(zip.readUInt32LE(18),first.compressedBytes);
  assert.deepEqual(inflateRawSync(zip.subarray(start,start+first.compressedBytes)),input);
  const end=zip.length-22;assert.equal(zip.readUInt32LE(end),0x06054b50);
  assert.equal(zip.readUInt16LE(end+4),0);assert.equal(zip.readUInt16LE(end+6),0);
  assert.equal(zip.readUInt16LE(end+8),1);assert.equal(zip.readUInt16LE(end+10),1);assert.equal(zip.readUInt16LE(end+20),0);
  const central=zip.readUInt32LE(end+16), centralSize=zip.readUInt32LE(end+12);
  assert.equal(central,start+first.compressedBytes);assert.equal(central+centralSize,end);
  assert.equal(zip.readUInt32LE(central),0x02014b50);
  assert.equal(zip.readUInt16LE(central+8),0x0800);assert.equal(zip.readUInt16LE(central+10),8);
  assert.equal(zip.readUInt16LE(central+12),0);assert.equal(zip.readUInt16LE(central+14),0x0021);
  assert.equal(zip.readUInt32LE(central+16),first.crc32);assert.equal(zip.readUInt32LE(central+20),first.compressedBytes);assert.equal(zip.readUInt32LE(central+24),input.length);
  assert.equal(zip.readUInt16LE(central+28),nameLength);assert.equal(zip.readUInt16LE(central+30),0);assert.equal(zip.readUInt16LE(central+32),0);
  assert.equal(zip.readUInt32LE(central+42),0);assert.equal(zip.subarray(central+46,central+46+nameLength).toString('utf8'),OFFLINE_ENTRY_NAME);
});

test('offline ZIP supports zero-byte input without fabricating additional files',()=>{
  const archive=createOfflineZip(Buffer.alloc(0)), zip=archive.bytes;
  const start=30+zip.readUInt16LE(26);assert.deepEqual(inflateRawSync(zip.subarray(start,start+archive.compressedBytes)),Buffer.alloc(0));
  assert.equal(archive.crc32,0);assert.equal(zip.readUInt16LE(zip.length-12),1);
  assert.throws(()=>createOfflineZip('text'),/must be bytes/);
});

test('offline verification rejects damaged, truncated, renamed and mismatched ZIP headers',()=>{
  const input=Buffer.from('Un journal conservé ne disparaît pas avec sa source.\n'.repeat(400));
  const zip=createOfflineZip(input).bytes;
  assert.deepEqual(inspectOfflineZip(zip).bytes,input);
  assert.deepEqual(inspectOfflineZip(createOfflineZip(Buffer.alloc(0)).bytes).bytes,Buffer.alloc(0));
  assert.throws(()=>inspectOfflineZip('text'),/must be bytes/);
  assert.throws(()=>inspectOfflineZip(zip.subarray(0,20)),/truncated/);
  assert.throws(()=>inspectOfflineZip(zip.subarray(0,zip.length-1)),/Invalid offline ZIP/);
  const renamed=Buffer.from(zip); renamed[30]=0x58;
  assert.throws(()=>inspectOfflineZip(renamed),/entry name/);
  const mismatched=Buffer.from(zip), central=mismatched.readUInt32LE(mismatched.length-6);
  mismatched.writeUInt32LE(0,central+16);
  assert.throws(()=>inspectOfflineZip(mismatched),/CRC agreement/);
  const wrongCrc=Buffer.from(zip); wrongCrc.writeUInt32LE(0,14); wrongCrc.writeUInt32LE(0,central+16);
  assert.throws(()=>inspectOfflineZip(wrongCrc),/entry CRC32/);
  const wrongBounds=Buffer.from(zip); wrongBounds.writeUInt32LE(0xffffffff,zip.length-6);
  assert.throws(()=>inspectOfflineZip(wrongBounds),/bounds/);
  const trailing=Buffer.concat([zip,Buffer.from('unrecorded bytes')]);
  assert.throws(()=>inspectOfflineZip(trailing),/end-of-directory/);
});

function packageFixture(t) {
  const root=mkdtempSync(join(tmpdir(),'imperium-offline-package-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  mkdirSync(join(root,'dist'));
  writeFileSync(join(root,'package.json'),JSON.stringify({name:'imperium-march-test',version:'0.15.7'}));
  writeFileSync(join(root,'dist',OFFLINE_ENTRY_NAME),'<!doctype html><meta charset="utf-8"><title>Vérification 🔥</title>\n');
  return root;
}

test('release package records source identity, keeps exact bytes and verifies manifest checksums',t=>{
  const root=packageFixture(t), git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  git(['init','--quiet']); git(['add','package.json']);
  git(['-c','user.name=Package test','-c','user.email=package-test@example.invalid','commit','--quiet','-m','Fixture']);
  const commit=git(['rev-parse','HEAD']), manifest=buildOfflinePackage(root);
  assert.equal(manifest.source.commit,commit); assert.equal(manifest.source.version,'0.15.7');
  assert.equal(manifest.source.workingTree,'clean','Generated dist files do not make the source identity dirty');
  assert.equal(manifest.distribution.gitTracked,false); assert.equal(manifest.distribution.channel,'GitHub Release');
  const receipt=verifyOfflinePackage(root);
  assert.equal(receipt.status,'verified'); assert.equal(receipt.htmlFileCompared,true);
  assert.deepEqual(receipt.html,{
    bytes:manifest.html.bytes,sha256:manifest.html.sha256,crc32:manifest.html.crc32,
  });
  const checksumLines=readFileSync(join(root,'dist','Ordre_de_Cendre.sha256'),'utf8').trim().split('\n');
  assert.equal(checksumLines.length,2);
  for(const line of checksumLines) {
    const [digest,name]=line.split('  ');
    assert.equal(createHash('sha256').update(readFileSync(join(root,'dist',name))).digest('hex'),digest);
  }
  writeFileSync(join(root,'untracked-source.mjs'),'export const source = "new";');
  assert.equal(buildOfflinePackage(root).source.workingTree,'modified','Untracked source work is disclosed');
  rmSync(join(root,'untracked-source.mjs'));
  writeFileSync(join(root,'package.json'),JSON.stringify({name:'imperium-march-test',version:'0.15.8'}));
  const changed=buildOfflinePackage(root);
  assert.equal(changed.source.commit,commit); assert.equal(changed.source.workingTree,'modified');
  assert.equal(changed.source.version,'0.15.8');
});

test('package verification detects changed manifest and local HTML without altering the ZIP',t=>{
  const root=packageFixture(t), manifest=buildOfflinePackage(root);
  assert.equal(manifest.source.commit,null,'An extracted source pack does not invent a Git commit');
  const path=join(root,'dist','Ordre_de_Cendre.manifest.json'), original=readFileSync(path), before=readFileSync(join(root,'dist','Ordre_de_Cendre.zip'));
  writeFileSync(path,JSON.stringify({...manifest,zip:{...manifest.zip,sha256:'0'.repeat(64)}}));
  assert.throws(()=>verifyOfflinePackage(root),/ZIP SHA-256/);
  writeFileSync(path,original);
  writeFileSync(join(root,'dist',OFFLINE_ENTRY_NAME),'changed HTML');
  assert.throws(()=>verifyOfflinePackage(root),/local HTML differs/);
  rmSync(join(root,'dist',OFFLINE_ENTRY_NAME));
  assert.equal(verifyOfflinePackage(root).htmlFileCompared,false,'A downloaded release can be checked before extraction');
  assert.deepEqual(readFileSync(join(root,'dist','Ordre_de_Cendre.zip')),before);
});

test('complete offline packages can exceed the 100 MiB Git blob limit without truncation',{timeout:60000},t=>{
  const root=packageFixture(t), bytes=randomBytes(101*1024*1024);
  const expected=createHash('sha256').update(bytes).digest('hex');
  writeFileSync(join(root,'dist',OFFLINE_ENTRY_NAME),bytes);
  const manifest=buildOfflinePackage(root);
  assert.ok(manifest.zip.bytes>100*1024*1024,'The regression fixture must exceed the old transport limit');
  assert.equal(manifest.html.bytes,bytes.length); assert.equal(manifest.html.sha256,expected);
  const receipt=verifyOfflinePackage(root);
  assert.equal(receipt.html.sha256,expected); assert.equal(receipt.htmlFileCompared,true);
});
