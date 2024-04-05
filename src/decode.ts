import { DNSResponse } from "./types";
import getQR from "./utils/getQR";
import getRCODE from "./utils/getRCODE";
import getRClass from "./utils/getRClass";
import getRType from "./utils/getRType";

export default function decode(buffer: ArrayBuffer): DNSResponse {

  // const uint8Array = new Uint8Array(buffer)

  const view = new DataView(buffer);

  const id = view.getUint16(0, true);
  const flagsVal = view.getUint16(2);

  const QDCOUNT = view.getUint16(4);
  const ANCOUNT = view.getUint16(6);
  const NSCOUNT = view.getUint16(8);
  const ARCOUNT = view.getUint16(10);

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

  let offset = 12;

  // decode questions
  const questions = [];
  for (let i = 0; i < QDCOUNT; i++) {
    let end = offset;
    while (view.getUint8(end) !== 0) {
      end++;
    }

    const name = decodeName(view, offset, end);
    offset = end + 1;

    const type = view.getUint16(offset);
    offset += 2;
    const qclass = view.getUint16(offset);
    offset += 2;

    questions.push({ CLASS: qclass, NAME: name, TYPE: type });
  }

  offset += questions.length + 1;
  
  // decode answers
  const answers = [];
  for (let i = 0; i < ANCOUNT; i++) {
    const aType = view.getUint16(offset)
    offset += 2;

    const aClass = view.getUint16(offset)
    offset += 2;

    const ttl = view.getUint32(offset)
    offset += 4;

    const RDLENGTH = view.getUint16(offset)
    offset += 2;

    let data = '';
    for (let i = 0; i < RDLENGTH; i++) {
      data += '.' + view.getUint8(offset + i);
    }

    answers.push({ CLASS: getRClass(aClass), TYPE: getRType(aType), ttl, RDLENGTH, data: data.slice(1), NAME:questions[0].NAME });
  }

  offset += answers.length + 1;

  console.log('offset ===> ', view.byteLength, offset);

  // decode authorities


  return {
    id,
    flags,
    questions: [{ NAME: questions[0].NAME, CLASS: getRClass(questions[0].CLASS), TYPE: getRType(questions[0].TYPE) }],
    answers,
    authorities: [],
    additionals: [],
  };
}

function decodeName(data: DataView, start: number, end: number) {
  let name = "";
  for (let i = start; i < end; i++) {
    const offset = data.getUint8(i);
    const c = String.fromCharCode(offset);
    name += c;
  }
  return name.replace('\x03', '.');
}
