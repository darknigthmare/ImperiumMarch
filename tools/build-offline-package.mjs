/** Deterministic ZIP32 envelope for the exact standalone HTML. No dependencies.
 * The ZIP is repeatable for identical input and the same zlib implementation;
 * the uncompressed HTML SHA-256 is the cross-runtime delivery invariant.
 */
import { deflateRawSync, inflateRawSync, constants } from 'node:zlib';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const OFFLINE_ENTRY_NAME = 'Ordre_de_Cendre.html';
export const OFFLINE_ZIP_DATE = '1980-01-01T00:00:00Z';
const ZIP32_MAX = 0xffffffff;
const COMPRESSION = Object.freeze({ level: 9, windowBits: 15, memLevel: 8, strategy: constants.Z_DEFAULT_STRATEGY });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
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

/** Read only this builder's single-entry ZIP32 format, checking both headers.
 * Returning the inflated bytes permits an independent comparison with the HTML;
 * it does not rewrite either the archive or any embedded image.
 */
export function inspectOfflineZip(input) {
  if (!(input instanceof Uint8Array)) throw new TypeError('Offline archive must be bytes.');
  const zip = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  const require = (condition, message) => { if (!condition) throw new Error(`Invalid offline ZIP: ${message}`); };
  const filename = Buffer.from(OFFLINE_ENTRY_NAME, 'utf8'), end = zip.length - 22;
  require(zip.length >= 30 + filename.length + 46 + filename.length + 22, 'truncated archive');
  require(zip.readUInt32LE(0) === 0x04034b50, 'local header');
  require(zip.readUInt16LE(4) === 20 && zip.readUInt16LE(6) === 0x0800 && zip.readUInt16LE(8) === 8, 'local format');
  require(zip.readUInt16LE(10) === 0 && zip.readUInt16LE(12) === 0x0021, 'local timestamp');
  require(zip.readUInt16LE(26) === filename.length && zip.readUInt16LE(28) === 0, 'local name length');
  require(zip.subarray(30, 30 + filename.length).equals(filename), 'entry name');
  require(zip.readUInt32LE(end) === 0x06054b50, 'end-of-directory header');
  require(zip.readUInt16LE(end + 4) === 0 && zip.readUInt16LE(end + 6) === 0 &&
    zip.readUInt16LE(end + 8) === 1 && zip.readUInt16LE(end + 10) === 1 && zip.readUInt16LE(end + 20) === 0,
  'one entry on one disk with no trailing comment');
  const compressedBytes = zip.readUInt32LE(18), uncompressedBytes = zip.readUInt32LE(22);
  const start = 30 + filename.length, central = zip.readUInt32LE(end + 16), centralSize = zip.readUInt32LE(end + 12);
  require(central === start + compressedBytes && centralSize === 46 + filename.length && central + centralSize === end,
    'entry and directory bounds');
  require(zip.readUInt32LE(central) === 0x02014b50, 'central header');
  require(zip.readUInt16LE(central + 6) === 20 && zip.readUInt16LE(central + 8) === 0x0800 &&
    zip.readUInt16LE(central + 10) === 8, 'central format');
  require(zip.readUInt16LE(central + 12) === 0 && zip.readUInt16LE(central + 14) === 0x0021, 'central timestamp');
  require(zip.readUInt16LE(central + 28) === filename.length && zip.readUInt16LE(central + 30) === 0 &&
    zip.readUInt16LE(central + 32) === 0 && zip.readUInt16LE(central + 34) === 0 && zip.readUInt32LE(central + 42) === 0,
  'central entry metadata');
  require(zip.subarray(central + 46, central + 46 + filename.length).equals(filename), 'central entry name');
  const crc32 = zip.readUInt32LE(14);
  require(zip.readUInt32LE(central + 16) === crc32 && zip.readUInt32LE(central + 20) === compressedBytes &&
    zip.readUInt32LE(central + 24) === uncompressedBytes, 'header size and CRC agreement');
  const bytes = inflateRawSync(zip.subarray(start, central), { maxOutputLength: Math.max(1, uncompressedBytes) });
  require(bytes.length === uncompressedBytes, 'inflated size');
  require(offlineCrc32(bytes) === crc32, 'entry CRC32');
  return { bytes, crc32, compressedBytes, uncompressedBytes };
}

function sourceIdentity(root) {
  const packagePath = resolve(root, 'package.json');
  const version = existsSync(packagePath) ? JSON.parse(readFileSync(packagePath, 'utf8')).version ?? null : null;
  const result = { version, commit: null, tree: null, workingTree: 'unavailable' };
  try {
    const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    // An extracted source pack may sit inside some unrelated repository.
    if (resolve(git(['rev-parse', '--show-toplevel'])) !== root) return result;
    result.commit = git(['rev-parse', 'HEAD']);
    result.tree = git(['rev-parse', 'HEAD^{tree}']);
    // dist is regenerated by the build itself. New/modified sources and assets
    // elsewhere remain visible, including untracked work in a local checkout.
    result.workingTree = git(['status', '--porcelain', '--untracked-files=normal', '--', '.', ':(exclude)dist/'])
      ? 'modified' : 'clean';
  } catch { /* A local ZIP remains buildable without Git or a checkout. */ }
  return result;
}

/** Verify a downloaded ZIP + manifest, and the HTML too when it is present. */
export function verifyOfflinePackage(projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..')) {
  const root = resolve(projectRoot), directory = resolve(root, 'dist');
  const manifest = JSON.parse(readFileSync(resolve(directory, 'Ordre_de_Cendre.manifest.json'), 'utf8'));
  const zip = readFileSync(resolve(directory, 'Ordre_de_Cendre.zip')), decoded = inspectOfflineZip(zip);
  const require = (condition, message) => { if (!condition) throw new Error(`Offline package verification failed: ${message}`); };
  require(manifest.entry === OFFLINE_ENTRY_NAME && manifest.zip?.entries === 1, 'manifest entry');
  require(zip.length === manifest.zip.bytes && sha256(zip) === manifest.zip.sha256, 'ZIP SHA-256 or byte count');
  require(decoded.compressedBytes === manifest.zip.compressedBytes, 'compressed byte count');
  const htmlSha256 = sha256(decoded.bytes), crc32 = decoded.crc32.toString(16).padStart(8, '0');
  require(decoded.bytes.length === manifest.html?.bytes && htmlSha256 === manifest.html.sha256, 'HTML SHA-256 or byte count');
  require(crc32 === manifest.html.crc32, 'manifest CRC32');
  const htmlPath = resolve(directory, OFFLINE_ENTRY_NAME), htmlFileCompared = existsSync(htmlPath);
  if (htmlFileCompared) require(readFileSync(htmlPath).equals(decoded.bytes), 'local HTML differs from the archived entry');
  return { status: 'verified', entry: OFFLINE_ENTRY_NAME, htmlFileCompared,
    html: { bytes: decoded.bytes.length, sha256: htmlSha256, crc32 },
    zip: { bytes: zip.length, sha256: manifest.zip.sha256, entries: 1 }, source: manifest.source ?? null };
}

export function buildOfflinePackage(projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..')) {
  const root=resolve(projectRoot), directory=resolve(root,'dist');
  const input=resolve(directory,OFFLINE_ENTRY_NAME), output=resolve(directory,'Ordre_de_Cendre.zip');
  const html=readFileSync(input), archive=createOfflineZip(html);
  const manifest={
    format:'Ordre de Cendre standalone ZIP32, one UTF-8 file',
    entry:OFFLINE_ENTRY_NAME,
    source:sourceIdentity(root),
    runtime:{node:process.versions.node,zlib:process.versions.zlib},
    distribution:{channel:'GitHub Release',gitTracked:false,
      note:'The complete ZIP is generated locally and attached to a release. It is not limited by Git blob size and no image is reduced.'},
    html:{file:'dist/'+OFFLINE_ENTRY_NAME,bytes:html.length,sha256:sha256(html),crc32:archive.crc32.toString(16).padStart(8,'0')},
    zip:{file:'dist/Ordre_de_Cendre.zip',bytes:archive.bytes.length,sha256:sha256(archive.bytes),entries:1,
      compressedBytes:archive.compressedBytes,method:'deflate',level:9,timestamp:OFFLINE_ZIP_DATE},
    fidelity:'The single ZIP entry is byte-for-byte identical to the locally generated HTML, including every embedded PNG and all gameplay code.',
    reproducibility:'ZIP bytes are deterministic for identical HTML and zlib implementation. Cross-runtime verification compares the extracted HTML SHA-256; compressed bytes may vary between zlib versions.',
  };
  mkdirSync(directory,{recursive:true}); writeFileSync(output,archive.bytes);
  const manifestBytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
  writeFileSync(resolve(directory,'Ordre_de_Cendre.manifest.json'),manifestBytes);
  writeFileSync(resolve(directory,'Ordre_de_Cendre.sha256'),
    `${manifest.zip.sha256}  Ordre_de_Cendre.zip\n${sha256(manifestBytes)}  Ordre_de_Cendre.manifest.json\n`);
  console.log(JSON.stringify({offlinePackage:relative(root,output),htmlBytes:html.length,zipBytes:archive.bytes.length,
    htmlSha256:manifest.html.sha256,zipSha256:manifest.zip.sha256,node:process.versions.node,zlib:process.versions.zlib}));
  return manifest;
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--verify') console.log(JSON.stringify(verifyOfflinePackage(), null, 2));
  else buildOfflinePackage();
}
