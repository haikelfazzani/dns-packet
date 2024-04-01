import getQR from "./utils/getQR";
import getRCODE from "./utils/getRCODE";

function readQuestion(view: DataView, offset: number) {
  let position = offset;
  let domain = '';

  while (true) {
    const labelLength = view.getUint8(position++);
    console.log('labelLength ==> ',labelLength, position);
    
    if (labelLength === 0) break;
    if (domain.length !== 0) domain += '.';

    for (let i = 0; i < labelLength; i++) {
      domain += String.fromCharCode(view.getUint8(position + i));
    }

    position += labelLength;
  }

  const TYPE = view.getUint16(position);
  const CLASS = view.getUint16(position + 2);

  return {
    NAME: domain,
    TYPE,
    CLASS,
    length: position - offset + 4
  };
}

export default function decode(buffer: ArrayBuffer) {

  const view = new DataView(buffer)
  const id = view.getUint16(0, true)
  const flagsVal = view.getUint16(2);

  const QDCOUNT = view.getUint16(4)
  const ANCOUNT = view.getUint16(6)
  const NSCOUNT = view.getUint16(8)
  const ARCOUNT = view.getUint16(10)

  const flags = {
    QR: (flagsVal >> 15) & 0x1,
    Opcode: (flagsVal >> 11) & 0xF,
    AA: (flagsVal >> 10) & 0x1,
    TC: (flagsVal >> 9) & 0x1,
    RD: (flagsVal >> 8) & 0x1,
    RA: (flagsVal >> 7) & 0x1,
    Z: (flagsVal >> 4) & 0x7,
    RCODE: flagsVal & 0xF
  };

  const questions = readQuestion(view, 12);
  console.log(questions);


  return {
    id,
    flags: {
      ...flags,
      QR: getQR(flags.QR),
      RCODE: getRCODE(flags.RCODE)
    },
    questions: []
  };
}