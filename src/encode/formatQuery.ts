import { DNSQuery } from "../types";
import getOPCODE from "../utils/getOPCODE";
import getQR from "../utils/getQR";
import getRCODE from "../utils/getRCODE";
import getRClass from "../utils/getRClass";
import getRType from "../utils/getRType";

export default function formatQuery(packet: DNSQuery) {
  const question = packet.questions[0];
  return {
    id: packet.id || 0,
    flags: {
      QR: getQR(),
      Opcode: getOPCODE(),
      AA: packet.flags.AA || 0,
      TC: packet.flags.TC || 0,
      RD: packet.flags.RD || 1,
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