import { DNSQuery } from "./types";
import getOPCODE from "./utils/getOPCODE";
import getQR from "./utils/getQR";
import getRCODE from "./utils/getRCODE";
import getRClass from "./utils/getRClass";
import getRType from "./utils/getRType";

function concatenateUint8Arrays(arrays) {
  let totalLength = 0;
  arrays.forEach((arr) => {
    totalLength += arr.length;
  });
  const result = new Uint8Array(totalLength);
  let offset = 0;
  arrays.forEach((arr) => {
    result.set(arr, offset);
    offset += arr.length;
  });
  return result;
}

function formatQuery(packet: DNSQuery) {
  const question = packet.questions[0];
  return {
    id: packet.id || 0,
    flags: {
      QR: getQR(),
      Opcode: getOPCODE(),
      AA: packet.flags.AA || 0,
      TC: packet.flags.TC || 0,
      RD: packet.flags.RD || 0,
      RA: packet.flags.RA || 0,
      Z: 0,
      RCODE: getRCODE()
    },
    questions: [
      {
        CLASS: getRClass(question.CLASS),
        NAME: question.NAME,
        TYPE: getRType(question.TYPE)
      }
    ]
  }
}

export default function encode(packet: DNSQuery) {
  const query = formatQuery(packet);
  const header = new Uint8Array(12);
  const view = new DataView(header.buffer);

  view.setUint16(0, query.id, true);

  view.setUint8(2, (query.flags.QR << 7) | (query.flags.Opcode << 3) | (query.flags.AA << 2) | (query.flags.TC << 1) | query.flags.RD);
  view.setUint8(3, (query.flags.RA << 7) | (query.flags.Z << 6) | query.flags.RCODE);

  // QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT
  view.setUint16(4, 1, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);

  const encodeQuestion = (question: { CLASS: number, NAME: string, TYPE: number }) => {
    const nameParts = question.NAME.split('.');
    let nameBuffer = new Uint8Array();

    for (const part of nameParts) {
      const partLength = new Uint8Array([part.length]);
      nameBuffer = concatenateUint8Arrays([nameBuffer, partLength, new TextEncoder().encode(part)]);
    }

    nameBuffer = concatenateUint8Arrays([nameBuffer, new Uint8Array([0])]); // Terminator

    const classBuffer = new Uint8Array(2);
    const typeBuffer = new Uint8Array(2);
    classBuffer[0] = (question.CLASS >> 8) & 0xFF; 
    classBuffer[1] = question.CLASS & 0xFF;        
    typeBuffer[0] = (question.TYPE >> 8) & 0xFF; 
    typeBuffer[1] = question.TYPE & 0xFF;        

    return concatenateUint8Arrays([nameBuffer, classBuffer, typeBuffer]);
  };

  const question = encodeQuestion(query.questions[0]);

  return concatenateUint8Arrays([header, question]);
}