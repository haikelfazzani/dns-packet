import { textDecoder } from "../constants";
import { getRType } from "../helpers";
import decodeName from "./decodeName";

export default function decodeRDATA(view: DataView, offset: number, RDLENGTH: number, rType: number): { data: any, consumedBytes: number } {
  const rTypeStr: string = getRType(rType);
  let consumedBytes = RDLENGTH;

  if (rTypeStr === 'A') {
    if (RDLENGTH !== 4) {
      throw new Error(`Invalid A record length: ${RDLENGTH}, expected 4`);
    }
    const parts = [];
    for (let i = 0; i < 4; i++) {
      parts.push(view.getUint8(offset + i).toString());
    }
    return { data: parts.join('.'), consumedBytes: RDLENGTH };
  }

  if (rTypeStr === 'AAAA') {
    if (RDLENGTH !== 16) {
      throw new Error(`Invalid AAAA record length: ${RDLENGTH}, expected 16`);
    }
    const parts = [];
    for (let i = 0; i < 16; i += 2) {
      const value = view.getUint16(offset + i);
      parts.push(value.toString(16).padStart(4, '0'));
    }

    let bestStart = -1, bestLength = 0;
    let currentStart = -1, currentLength = 0;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === '0000') {
        if (currentStart === -1) currentStart = i;
        currentLength++;
      } else {
        if (currentLength > bestLength) {
          bestStart = currentStart;
          bestLength = currentLength;
        }
        currentStart = -1;
        currentLength = 0;
      }
    }

    if (currentLength > bestLength) {
      bestStart = currentStart;
      bestLength = currentLength;
    }

    let result = parts.join(':');
    if (bestLength >= 2) {
      const before = parts.slice(0, bestStart);
      const after = parts.slice(bestStart + bestLength);
      result = `${before.join(':')}::${after.join(':')}`;
    }

    result = result.replace(/::+/g, '::'); // Clean up potential multiple '::'
    return { data: result, consumedBytes: RDLENGTH };
  }

  if (rTypeStr === 'TXT') {
    const texts = [];
    let i = 0;
    while (i < RDLENGTH) {
      if (i >= RDLENGTH) {
        throw new Error('TXT record truncated');
      }
      const len = view.getUint8(offset + i);
      i += 1;
      if (i + len > RDLENGTH) {
        throw new Error('TXT record string exceeds record length');
      }

      const textBytes = new Uint8Array(view.buffer, offset + i, len);
      texts.push(textDecoder.decode(textBytes));
      i += len;
    }
    return { data: texts, consumedBytes: RDLENGTH };
  }

  if (['CNAME', 'NS', 'PTR'].includes(rTypeStr)) {
    try {
      const { name, consumedBytes: nameBytes } = decodeName(view, offset);
      return { data: name, consumedBytes: nameBytes };
    } catch (error) {
      throw new Error(`Failed to decode ${rTypeStr} record: ${error.message}`);
    }
  }

  if (rTypeStr === 'MX') {
    if (RDLENGTH < 3) {
      throw new Error(`MX record too short: ${RDLENGTH} < 3`);
    }
    const PREFERENCE = view.getUint16(offset);
    try {
      const { name, consumedBytes: nameBytes } = decodeName(view, offset + 2);
      consumedBytes = 2 + nameBytes;
      return { data: { PREFERENCE, EXCHANGE: name }, consumedBytes };
    } catch (error) {
      throw new Error(`Failed to decode MX exchange: ${error.message}`);
    }
  }

  if (rTypeStr === 'SOA') {
    if (RDLENGTH < 20) {
      throw new Error(`SOA record too short: ${RDLENGTH} < 20`);
    }

    try {
      const MNAME = decodeName(view, offset);
      let currentOffset = offset + MNAME.consumedBytes;
      const RNAME = decodeName(view, currentOffset);
      currentOffset += RNAME.consumedBytes;

      if (currentOffset + 20 > offset + RDLENGTH) {
        throw new Error('SOA record truncated');
      }

      consumedBytes = (currentOffset + 20) - offset;
      return {
        data: {
          MNAME: MNAME.name,
          RNAME: RNAME.name,
          SERIAL: view.getUint32(currentOffset),
          REFRESH: view.getUint32(currentOffset + 4),
          RETRY: view.getUint32(currentOffset + 8),
          EXPIRE: view.getUint32(currentOffset + 12),
          MINIMUM: view.getUint32(currentOffset + 16),
        },
        consumedBytes,
      };
    } catch (error) {
      throw new Error(`Failed to decode SOA record: ${error.message}`);
    }
  }

  if (rTypeStr === 'SRV') {
    if (RDLENGTH < 7) {
      throw new Error(`SRV record too short: ${RDLENGTH} < 7`);
    }

    try {
      const { name: TARGET, consumedBytes: nameBytes } = decodeName(view, offset + 6);
      consumedBytes = 6 + nameBytes;
      return {
        data: {
          PRIORITY: view.getUint16(offset),
          WEIGHT: view.getUint16(offset + 2),
          PORT: view.getUint16(offset + 4),
          TARGET
        },
        consumedBytes,
      };
    } catch (error) {
      throw new Error(`Failed to decode SRV target: ${error.message}`);
    }
  }

  // For unknown record types, return raw data
  if (offset + RDLENGTH > view.byteLength) {
    throw new Error(`Record data exceeds buffer: ${offset + RDLENGTH} > ${view.byteLength}`);
  }

  return { data: new Uint8Array(view.buffer.slice(offset, offset + RDLENGTH)), consumedBytes: RDLENGTH };
}