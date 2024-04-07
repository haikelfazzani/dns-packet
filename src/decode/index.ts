import { DNSResponse } from "../types";
import getQR from "../utils/getQR";
import getRCODE from "../utils/getRCODE";
import getRClass from "../utils/getRClass";
import getRType from "../utils/getRType";
import decodeName from "./decodeName";
import decodeRDATA from "./decodeRDATA";

export default function decode(buffer: ArrayBuffer): DNSResponse {

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
    const { name, consumedBytes } = decodeName(view, offset);
    offset += consumedBytes;

    const rType = view.getUint16(offset);
    offset += 2;
    const rClass = view.getUint16(offset);
    offset += 2;

    questions.push({ CLASS: getRClass(rClass), NAME: name, TYPE: getRType(rType) });
  }

  // decode answers
  const answers = [];

  for (let i = 0; i < ANCOUNT; i++) {

    const { name, consumedBytes } = decodeName(view, offset)
    offset += consumedBytes;

    const rType = view.getUint16(offset)
    offset += 2;

    const rClass = view.getUint16(offset)
    offset += 2;

    const ttl = view.getUint32(offset)
    offset += 4;

    const RDLENGTH = view.getUint16(offset)
    offset += 2;

    let RDATA: any = '';
    if ([1, 28].includes(rType)) {
      RDATA = decodeRDATA(view, offset, RDLENGTH, rType);
    }
    else {
      let { name, consumedBytes: cb } = decodeName(view, offset);
      RDATA = name;
      offset += cb;
    }

    answers.push({ CLASS: getRClass(rClass), TYPE: getRType(rType), ttl, RDLENGTH, RDATA, NAME: name });
  }

  // decode authorities
  const authorities = [];

  for (let i = 0; i < NSCOUNT; i++) {
    const { name, consumedBytes } = decodeName(view, offset)
    offset += consumedBytes;

    const rType = view.getUint16(offset)
    offset += 2;

    const rClass = view.getUint16(offset)
    offset += 2;

    const ttl = view.getUint32(offset)
    offset += 4;

    const RDLENGTH = view.getUint16(offset)
    offset += 2;

    let RDATA = decodeRDATA(view, offset, RDLENGTH, rType);
    offset += RDLENGTH + 2;

    authorities.push({ CLASS: getRClass(rClass), TYPE: getRType(rType), ttl, RDLENGTH, RDATA, NAME: name });
  }

  return {
    id,
    flags,
    questions: [{ NAME: questions[0].NAME, CLASS: questions[0].CLASS, TYPE: questions[0].TYPE }],
    answers,
    authorities,
    additionals: [],
  };
}
