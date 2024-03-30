export default class PacketUtil {

  static getOPCODE(val?: string) {
    const OPCODE = { 'QUERY': 0, 'IQUERY': 1, 'STATUS': 2, 'RESERVED': 3, 'NOTIFY': 4, 'UPDATE': 5, }
    return OPCODE[val] || 0
  }

  static getRCODE(val?: string) {
    const RCODE = { 'NOERROR': 0, 'FORMERR': 1, 'SERVFAIL': 2, 'NXDOMAIN': 3, 'NOTIMP': 4, 'REFUSED': 5, }
    return RCODE[val] || 0
  }

  static getRType(val?: string) {
    const RType = { 'A': 1, 'NS': 2, 'CNAME': 5, 'SOA': 6, 'PTR': 12, 'MINFO': 14, 'MX': 15, 'TXT': 16 }
    return RType[val] || 1
  }

  static getRClass(val?: string) {
    const RClass = { 'IN': 1, 'CS': 2, 'CH': 3, 'HS': 4 }
    return RClass[val] || 1
  }

  static getQR(val?: string) {
    const QR = { 'QUERY': 0, 'RESPONSE': 1 }
    return QR[val] || 0
  }

  static encodeQuestion(question: any) {
    // Encode the question name using DNS name compression
    const nameParts = question.NAME.split('.');
    let nameBuffer = Buffer.from('');

    for (const part of nameParts) {
      const partLength = Buffer.from(String.fromCharCode(part.length));  // Length octet
      nameBuffer = Buffer.concat([nameBuffer, partLength, Buffer.from(part)]);
    }

    nameBuffer = Buffer.concat([nameBuffer, Buffer.from([0])]);  // Terminator

    // Combine CLASS, TYPE, and name buffers
    const classBuffer = Buffer.allocUnsafe(2);
    classBuffer.writeUInt16BE(question.CLASS, 0);
    const typeBuffer = Buffer.allocUnsafe(2);
    typeBuffer.writeUInt16BE(question.TYPE, 0);
    return Buffer.concat([nameBuffer, classBuffer, typeBuffer]);
  }

}