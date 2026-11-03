/**
 * Pure Node.js Zero-Dependency Zip Creator
 * Menggunakan zlib.deflateRawSync dan zlib.crc32 bawaan Node.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createZipFromDir(sourceDir, outputFile) {
  const entries = [];

  function walk(currentDir, relativePath) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      const relPath = relativePath ? `${relativePath}/${item.name}` : item.name;

      if (item.isDirectory()) {
        walk(fullPath, relPath);
      } else if (item.isFile()) {
        const uncompressedData = fs.readFileSync(fullPath);
        const compressedData = zlib.deflateRawSync(uncompressedData);
        const crc = zlib.crc32(uncompressedData);

        entries.push({
          relPath: relPath.replace(/\\/g, '/'),
          uncompressedData,
          compressedData,
          crc,
          uncompressedSize: uncompressedData.length,
          compressedSize: compressedData.length
        });
      }
    }
  }

  walk(sourceDir, '');

  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.relPath, 'utf8');

    // Local Header (30 bytes + name length + data)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4);         // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0x0800, 6);     // Flags (UTF-8)
    localHeader.writeUInt16LE(8, 8);          // Compression method (Deflate)
    localHeader.writeUInt16LE(0, 10);         // Mod time
    localHeader.writeUInt16LE(0, 12);         // Mod date
    localHeader.writeUInt32LE(entry.crc, 14); // CRC-32
    localHeader.writeUInt32LE(entry.compressedSize, 18);   // Compressed size
    localHeader.writeUInt32LE(entry.uncompressedSize, 22); // Uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26);      // Filename length
    localHeader.writeUInt16LE(0, 28);         // Extra field length

    const localChunk = Buffer.concat([localHeader, nameBuffer, entry.compressedData]);
    localHeaders.push(localChunk);

    // Central Directory Header (46 bytes + name length)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central file header signature
    centralHeader.writeUInt16LE(20, 4);         // Version made by
    centralHeader.writeUInt16LE(20, 6);         // Version needed
    centralHeader.writeUInt16LE(0x0800, 8);     // Flags
    centralHeader.writeUInt16LE(8, 10);         // Compression method
    centralHeader.writeUInt16LE(0, 12);         // Mod time
    centralHeader.writeUInt16LE(0, 14);         // Mod date
    centralHeader.writeUInt32LE(entry.crc, 16); // CRC-32
    centralHeader.writeUInt32LE(entry.compressedSize, 20);   // Compressed size
    centralHeader.writeUInt32LE(entry.uncompressedSize, 24); // Uncompressed size
    centralHeader.writeUInt16LE(nameBuffer.length, 28);      // Filename length
    centralHeader.writeUInt16LE(0, 30);         // Extra field length
    centralHeader.writeUInt16LE(0, 32);         // File comment length
    centralHeader.writeUInt16LE(0, 34);         // Disk number start
    centralHeader.writeUInt16LE(0, 36);         // Internal file attributes
    centralHeader.writeUInt32LE(0, 38);         // External file attributes
    centralHeader.writeUInt32LE(offset, 42);    // Relative offset of local header

    const centralChunk = Buffer.concat([centralHeader, nameBuffer]);
    centralHeaders.push(centralChunk);

    offset += localChunk.length;
  }

  const centralDirOffset = offset;
  const centralDirBuffer = Buffer.concat(centralHeaders);
  const centralDirSize = centralDirBuffer.length;

  // End of Central Directory Record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);               // EOCD signature
  eocd.writeUInt16LE(0, 4);                         // Disk number
  eocd.writeUInt16LE(0, 6);                         // Disk with central dir
  eocd.writeUInt16LE(entries.length, 8);            // Total entries this disk
  eocd.writeUInt16LE(entries.length, 10);           // Total entries central dir
  eocd.writeUInt32LE(centralDirSize, 12);           // Size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16);         // Offset of central directory
  eocd.writeUInt16LE(0, 20);                        // Comment length

  const fullZip = Buffer.concat([...localHeaders, centralDirBuffer, eocd]);

  if (outputFile) {
    fs.writeFileSync(outputFile, fullZip);
  }

  return fullZip;
}

module.exports = { createZipFromDir };
