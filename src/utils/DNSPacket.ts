import { Buffer } from 'node:buffer'
import { DNSQuery } from "../types.js";
import PacketUtil from './PacketUtil.js';

export default class DNSPacket {

  private static formatQuery(jsonPacket: DNSQuery) {
    const question = jsonPacket.questions[0];
    return {
      id: jsonPacket.id || 1,
      flags: {
        QR: PacketUtil.getQR(),
        Opcode: PacketUtil.getOPCODE(),
        AA: jsonPacket.flags.AA || 0,
        TC: jsonPacket.flags.TC || 0,
        RD: jsonPacket.flags.RD || 0,
        RA: jsonPacket.flags.RA || 0,
        Z: 0,
        RCODE: PacketUtil.getRCODE()
      },
      questions: [
        {
          CLASS: PacketUtil.getRClass(question.CLASS),
          NAME: question.NAME,
          TYPE: PacketUtil.getRType(question.TYPE)
        }
      ]
    }
  }

  static encode(jsonPacket: DNSQuery) {
    const query = this.formatQuery(jsonPacket);
    // console.log(query);

    const header = Buffer.alloc(12);
    header.writeUInt16BE(query.id, 0);

    const flags = query.flags;
    const flagsVal = (flags.QR << 15) |
      (flags.Opcode << 11) |
      (flags.AA << 10) |
      (flags.TC << 9) |
      (flags.RD << 8) |
      (flags.RA << 7) |
      (flags.Z << 4) |
      flags.RCODE;

    header.writeUInt16BE(flagsVal, 2);
    header.writeUInt16BE(1, 4)   // QDCOUNT
    header.writeUInt16BE(0, 6)   // ANCOUNT
    header.writeUInt16BE(0, 8)   // NSCOUNT
    header.writeUInt16BE(0, 10)  // ARCOUNT

    const question = PacketUtil.encodeQuestion(query.questions[0]);

    return Buffer.concat([header, question])
  }

  static decode(buffer: Buffer) {
    const id = buffer.readUInt16BE(0);
    const flagsVal = buffer.readUInt16BE(2);

    const flags = {
      QR: (flagsVal >> 15) & 1,
      Opcode: (flagsVal >> 11) & 0xF,
      AA: (flagsVal >> 10) & 1,
      TC: (flagsVal >> 9) & 1,
      RD: (flagsVal >> 8) & 1,
      RA: (flagsVal >> 7) & 1,
      Z: (flagsVal >> 4) & 0x7,
      RCODE: flagsVal & 0xF,
    }

    const QDCOUNT = buffer.readUint16BE(4);
    const ANCOUNT = buffer.readUint16BE(6);
    const NSCOUNT = buffer.readUint16BE(8);
    const ARCOUNT = buffer.readUint16BE(10);

    // console.log(id, flags, QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT);

    console.log(this.parseQuestions(buffer, QDCOUNT, 12));
    console.log(this.parseRecords(buffer, ANCOUNT, 28));
  }

  private static parseRecords(buffer: Buffer, count: number, offset: number) {
    const records = [];
    for (let i = 0; i < count; i++) {
      let name = '';
      let nameLength = buffer[offset];
      let nameOffset = offset + 1;
      while (nameLength !== 0) {
        if (name.length > 0) {
          name += '.';
        }
        name += buffer.toString('ascii', nameOffset, nameOffset + nameLength);
        nameOffset += nameLength + 1;
        nameLength = buffer[nameOffset - 1];
      }

      const type = buffer.readUInt16BE(nameOffset);
      const class_ = buffer.readUInt16BE(nameOffset + 2);
      const ttl = buffer.readUInt32BE(nameOffset + 4);
      const rdlength = buffer.readUInt16BE(nameOffset + 8);
      const rdata = buffer.slice(nameOffset + 10, nameOffset + 10 + rdlength).toString('utf8');

      records.push({ name, type, class: class_, ttl, RDLENGTH: rdlength, RDATA: rdata });
      offset = nameOffset + 10 + rdlength;
    }
    return records;
  };


  private static parseQuestions(buffer: Buffer, QDCOUNT: number, offset: number) {
    const questions = [];

    for (let i = 0; i < QDCOUNT; i++) {
      let name = '';
      let nameLength = buffer[offset];
      while (nameLength !== 0) {
        if (name.length > 0) {
          name += '.';
        }
        name += buffer.toString('ascii', offset + 1, offset + 1 + nameLength);
        offset += nameLength + 1;
        nameLength = buffer[offset];
      }
      offset++;

      const type = buffer.readUInt16BE(offset);
      const class_ = buffer.readUInt16BE(offset + 2);

      questions.push({ name, type, class: class_ });
      offset += 4;
    }
    console.log('offset ==> ', offset);

    return questions;
  }
}