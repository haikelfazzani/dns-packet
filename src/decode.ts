import { DNSResponse } from "./types";
import getQR from "./utils/getQR";
import getRCODE from "./utils/getRCODE";
import getRClass from "./utils/getRClass";
import getRType from "./utils/getRType";

function decodeName(view: DataView, offset: number) {
  let pos = offset;
  let domainName = '';

  console.log(offset);
  

  while (true) {
    const partLen = view.getUint8(pos++);
    console.log(partLen, pos);
    

    if (partLen === 0) break;
    if (domainName.length !== 0) domainName += '.';

    for (let i = 0; i < partLen; i++) {
      
      if (pos + partLen > view.byteLength) {
        
        throw new Error('Invalid DNS packet: Label length exceeds buffer bounds');
      }

      domainName += String.fromCharCode(view.getUint8(pos + i));
    }

    pos += partLen;
  }
  return { name: domainName, offset:pos }
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
  let qd = decodeName(view, offset)
  const question = { NAME: qd.name, TYPE: view.getUint16(qd.offset), CLASS: view.getUint16(qd.offset + 2) };

  offset = qd.offset - offset + 4;

  // decode answers
  let ad = decodeName(view, offset);




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