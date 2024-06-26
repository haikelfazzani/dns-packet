import { DNSQuery } from "../types";
import getRCODE from "../utils/getRCODE";
import getRClass from "../utils/getRClass";
import getRType from "../utils/getRType";

export default function formatQuery(packet: DNSQuery) {
  const question = packet.questions[0];
  const flags = packet.flags || {};

  return {
    id: packet.id || 0,
    flags: {
      QR: 0,
      Opcode: 0,
      AA: flags.AA & 1,
      TC: flags.TC & 1,
      RD: flags.RD & 1,
      RA: flags.RA & 1,
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
