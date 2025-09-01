import { DNSQuery, EDNS } from "./types";
import { getRCODE, getRClass, getRType } from "./helpers";

function encodeName(name: string, view: DataView, offset: number, compressionMap: Map<string, number>): number {
  const labels = name.split('.');

  for (let i = 0; i < labels.length; i++) {
    const suffix = labels.slice(i).join('.');
    if (compressionMap.has(suffix)) {
      const jumpOffset = compressionMap.get(suffix)!;
      view.setUint16(offset, 0xc000 | jumpOffset, false);
      return offset + 2;
    }
  }

  let currentOffset = offset;
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const suffix = labels.slice(i).join('.');

    if (currentOffset + label.length + 1 > view.byteLength) {
      throw new Error('Encoding name exceeds buffer length');
    }

    if (suffix) {
      compressionMap.set(suffix, currentOffset);
    }

    view.setUint8(currentOffset++, label.length);
    for (let j = 0; j < label.length; j++) {
      const charCode = label.charCodeAt(j);
      if (charCode > 255) {
        throw new Error(`Non-ASCII character in domain name: ${label}`);
      }
      view.setUint8(currentOffset++, charCode);
    }
  }

  view.setUint8(currentOffset++, 0);
  return currentOffset;
}

function encodeQuestion(question: { NAME: string; CLASS: number; TYPE: number }, view: DataView, offset: number, compressionMap: Map<string, number>): number {
  let currentOffset = encodeName(question.NAME, view, offset, compressionMap);

  if (currentOffset + 4 > view.byteLength) {
    throw new Error('Encoding question exceeds buffer length');
  }

  view.setUint16(currentOffset, question.TYPE, false);
  currentOffset += 2;
  view.setUint16(currentOffset, question.CLASS, false);
  currentOffset += 2;
  return currentOffset;
}

function encodeOPT(edns: EDNS, view: DataView, offset: number): number {
  let currentOffset = offset;

  // OPT pseudo-record header
  view.setUint8(currentOffset++, 0); // Root domain for NAME
  view.setUint16(currentOffset, getRType('OPT'), false); // TYPE = OPT
  currentOffset += 2;
  view.setUint16(currentOffset, edns.udpPayloadSize, false); // CLASS = UDP payload size
  currentOffset += 2;

  const ttlVal = (edns.extendedRCODE << 24) | (edns.version << 16) | (edns.flags.DO << 15);
  view.setUint32(currentOffset, ttlVal, false); // TTL field repurposed for extended flags
  currentOffset += 4;

  // Calculate total RDLENGTH from all options
  const options = edns.options || [];
  let rdLength = 0;
  for (const option of options) {
    rdLength += 4 + option.data.byteLength; // 2 for code, 2 for length, N for data
  }

  view.setUint16(currentOffset, rdLength, false);
  currentOffset += 2;

  // Encode each option
  for (const option of options) {
    if (currentOffset + 4 + option.data.byteLength > view.byteLength) {
      throw new Error('Encoding EDNS option exceeds buffer length');
    }
    view.setUint16(currentOffset, option.code, false); // Option-Code
    currentOffset += 2;
    view.setUint16(currentOffset, option.data.byteLength, false); // Option-Length
    currentOffset += 2;
    option.data.forEach((byte, i) => { // Option-Data
      view.setUint8(currentOffset + i, byte);
    });
    currentOffset += option.data.byteLength;
  }

  return currentOffset;
}

function formatQuery(packet: DNSQuery) {
  const flags = packet.flags || {};
  const rd = flags.RD === undefined ? 1 : flags.RD;

  return {
    id: packet.id || Math.floor(Math.random() * 65535),
    flags: { QR: 0, Opcode: 0, AA: 0, TC: 0, RD: rd, RA: 0, Z: 0, RCODE: getRCODE() },
    questions: packet.questions.map(q => ({ // Process all questions
      CLASS: getRClass(q.CLASS),
      NAME: q.NAME,
      TYPE: getRType(q.TYPE)
    })),
    edns: packet.edns,
  };
}

export default function encode(packet: DNSQuery): Uint8Array {
  const query = formatQuery(packet);
  if (!query.questions || query.questions.length === 0) {
    throw new Error('DNS query must have at least one question');
  }

  // Buffer size is dynamic based on EDNS or a larger default.
  const bufferSize = query.edns ? query.edns.udpPayloadSize : 512;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);
  const compressionMap = new Map<string, number>();

  view.setUint16(0, query.id, false);

  const flags = (query.flags.QR << 15) | (query.flags.Opcode << 11) | (query.flags.AA << 10) | (query.flags.TC << 9) | (query.flags.RD << 8) | (query.flags.RA << 7) | (query.flags.Z << 4) | query.flags.RCODE;
  view.setUint16(2, flags, false);

  view.setUint16(4, query.questions.length, false); // QDCOUNT is now the actual number of questions
  view.setUint16(6, 0, false); // ANCOUNT
  view.setUint16(8, 0, false); // NSCOUNT

  const hasEdns = !!query.edns;
  view.setUint16(10, hasEdns ? 1 : 0, false); // ARCOUNT

  let offset = 12;

  for (const question of query.questions) {
    offset = encodeQuestion(question, view, offset, compressionMap);
  }

  if (hasEdns) {
    offset = encodeOPT(query.edns!, view, offset);
  }

  return new Uint8Array(buffer, 0, offset);
}