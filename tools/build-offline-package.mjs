/** Deterministic ZIP32 envelope for the exact standalone HTML. No dependencies.
 * The ZIP is repeatable for identical input and the same zlib implementation;
 * the uncompressed HTML SHA-256 is the cross-runtime delivery invariant.
 */
import { deflateRawSync, constants } from 'node:zlib';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const OFFLINE_ENTRY_NAME = 'Ordre_de_Cendre.html';
export const OFFLINE_ZIP_DATE = '1980-01-01T00:00:00Z';
const ZIP32_MAX = 0xffffffff;
const COMPRESSION = Object.freeze({ level: 9, windowBits: 15, memLevel: 8, strategy: constants.Z_DEFAULT_STRATEGY });
const crcTable = Uint32Array.from({length:256}, (_,value) => {
  let crc=value;
  for(let bit=0;bit<8;bit++) crc=(crc&1) ? (0xedb88320^(crc>>>1)) : crc>>>1;
  return crc>>>0;
});

/** Standard ZIP/IEEE CRC32 over bytes, including UTF-8 bytes without conversion. */
export function offlineCrc32(bytes) {
  let crc=0xffffffff;
  for(let i=0;i<bytes.length;i++) crc=crcTable[(crc^bytes[i])&255]^(crc>>>8);
  return (crc^0xffffffff)>>>0;
}

export function createOfflineZip(bytes) {
  if(!(bytes instanceof Uint8Array)) throw new TypeError('Standalone input must be bytes.');
  if(bytes.length>=ZIP32_MAX) throw new RangeError('Standalone HTML exceeds ZIP32 capacity.');
  const filename=Buffer.from(OFFLINE_ENTRY_NAME,'utf8');
  const compressed=deflateRawSync(bytes,COMPRESSION), crc=offlineCrc32(bytes);
  if(compressed.length>=ZIP32_MAX) throw new RangeError('Compressed HTML exceeds ZIP32 capacity.');
  const flags=0x0800, method=8, dosDate=0x0021, dosTime=0;

  const local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50,0); local.writeUInt16LE(20,4);
  local.writeUInt16LE(flags,6); local.writeUInt16LE(method,8);
  local.writeUInt16LE(dosTime,10); local.writeUInt16LE(dosDate,12);
  local.writeUInt32LE(crc,14); local.writeUInt32LE(compressed.length,18); local.writeUInt32LE(bytes.length,22);
  local.writeUInt16LE(filename.length,26);

  const central=Buffer.alloc(46), centralOffset=local.length+filename.length+compressed.length;
  central.writeUInt32LE(0x02014b50,0); central.writeUInt16LE(0x0314,4); central.writeUInt16LE(20,6);
  central.writeUInt16LE(flags,8); central.writeUInt16LE(method,10);
  central.writeUInt16LE(dosTime,12); central.writeUInt16LE(dosDate,14);
  central.writeUInt32LE(crc,16); central.writeUInt32LE(compressed.length,20); central.writeUInt32LE(bytes.length,24);
  central.writeUInt16LE(filename.length,28);
  central.writeUInt32LE((0o100644<<16)>>>0,38); // regular file; predictable Unix permissions
  central.writeUInt32LE(0,42); // only local header starts at offset zero

  const end=Buffer.alloc(22), centralSize=central.length+filename.length;
  end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(1,8); end.writeUInt16LE(1,10);
  end.writeUInt32LE(centralSize,12); end.writeUInt32LE(centralOffset,16);
  const size=centralOffset+centralSize+end.length;
  if(size>=ZIP32_MAX) throw new RangeError('Offline archive exceeds ZIP32 capacity.');
  return { bytes:Buffer.concat([local,filename,compressed,central,filename,end],size), crc32:crc,
    compressedBytes:compressed.length, uncompressedBytes:bytes.length };
}

export function buildOfflinePackage(projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..')) {
  const root=resolve(projectRoot), directory=resolve(root,'dist');
  const input=resolve(directory,OFFLINE_ENTRY_NAME), output=resolve(directory,'Ordre_de_Cendre.zip');
  const html=readFileSync(input), archive=createOfflineZip(html);
  if(archive.bytes.length>=100*1024*1024) throw new RangeError('Offline ZIP exceeds the 100 MiB GitHub file limit; no PNG or gameplay content has been removed.');
  const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
  const manifest={
    format:'Ordre de Cendre standalone ZIP32, one UTF-8 file',
    entry:OFFLINE_ENTRY_NAME,
    html:{file:'dist/'+OFFLINE_ENTRY_NAME,bytes:html.length,sha256:sha(html),crc32:archive.crc32.toString(16).padStart(8,'0')},
    zip:{file:'dist/Ordre_de_Cendre.zip',bytes:archive.bytes.length,sha256:sha(archive.bytes),entries:1,
      compressedBytes:archive.compressedBytes,method:'deflate',level:9,timestamp:OFFLINE_ZIP_DATE},
    fidelity:'The single ZIP entry is byte-for-byte identical to the locally generated HTML, including every embedded PNG and all gameplay code.',
    reproducibility:'ZIP bytes are deterministic for identical HTML and zlib implementation. Cross-runtime verification compares the extracted HTML SHA-256; compressed bytes may vary between zlib versions.',
  };
  mkdirSync(directory,{recursive:true}); writeFileSync(output,archive.bytes);
  writeFileSync(resolve(directory,'Ordre_de_Cendre.manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({offlinePackage:relative(root,output),htmlBytes:html.length,zipBytes:archive.bytes.length,
    htmlSha256:manifest.html.sha256,zipSha256:manifest.zip.sha256,node:process.versions.node,zlib:process.versions.zlib}));
  return manifest;
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) buildOfflinePackage();
