import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';
import { createOfflineZip, offlineCrc32, OFFLINE_ENTRY_NAME } from '../tools/build-offline-package.mjs';

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
