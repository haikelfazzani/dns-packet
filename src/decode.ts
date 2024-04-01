import { DNSResponse } from "./types";
import getQR from "./utils/getQR";
import getRCODE from "./utils/getRCODE";
import getRClass from "./utils/getRClass";
import getRType from "./utils/getRType";

function decodeName(view: DataView, offset: number) {
  let position = offset;
  let domainName = '';

  while (true) {
    const partLen = view.getUint8(position++);

    if (partLen === 0) break;
    if (domainName.length !== 0) domainName += '.';

    for (let i = 0; i < partLen; i++) {
      domainName += String.fromCharCode(view.getUint8(position + i));
    }

    position += partLen;
  }
  return { name: domainName, position }
}

export default function decode(buffer: ArrayBuffer): DNSResponse {

  let offset = 12;

  const view = new DataView(buffer)
  const id = view.getUint16(0, true)
  const flagsVal = view.getUint16(2);

  const QDCOUNT = view.getUint16(4)
  const ANCOUNT = view.getUint16(6)
  const NSCOUNT = view.getUint16(8)
  const ARCOUNT = view.getUint16(10)

  const flags = {
    QR: getQR((flagsVal >> 15) & 0x1),
    Opcode: (flagsVal >> 11) & 0xF,
    AA: (flagsVal >> 10) & 0x1,
    TC: (flagsVal >> 9) & 0x1,
    RD: (flagsVal >> 8) & 0x1,
    RA: (flagsVal >> 7) & 0x1,
    Z: (flagsVal >> 4) & 0x7,
    RCODE: getRCODE(flagsVal & 0xF)
  };

  // decode questions
  const { position, name } = decodeName(view, offset)
  const question = { NAME: name, TYPE: view.getUint16(position), CLASS: view.getUint16(position + 2) };

  offset = position - offset + 4;

  // decode answers

  // decode authorities

  return {
    id,
    flags,
    questions: [{ NAME: question.NAME, CLASS: getRClass(question.CLASS), TYPE: getRType(question.TYPE) }],
    answers: [],
    authorities: [],
    additionals: [],
  };
}