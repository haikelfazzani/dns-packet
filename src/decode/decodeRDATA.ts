import getRType from "../utils/getRType";
import decodeName from "./decodeName";

export default function decodeRDATA(view: DataView, offset: number, RDLENGTH: number, rType: number) {
  let RDATA = '';
  const rTypeStr: string = getRType(rType);

  if (rTypeStr === 'A') {
    for (let i = 0; i < RDLENGTH; i++) {
      RDATA += (i === 0 ? '' : '.') + view.getUint8(offset + i)
    }
    return RDATA
  }

  if (rTypeStr === 'AAAA') {
    for (let i = 0; i < RDLENGTH; i += 2) {
      RDATA += (i === 0 ? '' : ':') + view.getUint16(offset + i).toString(16)
    }
    return RDATA
  }

  if (rTypeStr === 'TXT') {
    for (let i = 1; i < RDLENGTH; i++) {
      RDATA += String.fromCharCode(view.getUint8(offset + i))
    }
    return RDATA
  }

  if (rTypeStr.startsWith('UNKNOWN') || ['CNAME', 'NS', 'PTR', 'NULL', 'MR', 'MG', 'MF', 'MD', 'MB'].includes(rTypeStr)) {
    RDATA = decodeName(view, offset).name;
    return RDATA
  }

  if (rTypeStr === 'WKS') {
    /**
     * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
        |                    ADDRESS                    |
        +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
        |       PROTOCOL        |                       |
        +--+--+--+--+--+--+--+--+                       |
        |                                               |
        /                   <BIT MAP>                   /
        /                                               /
        +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    ADDRESS         An 32 bit Internet address
    PROTOCOL        An 8 bit IP protocol number
    <BIT MAP>       A variable length bit map.  The bit map must be a multiple of 8 bits long.
     */

    return {
      ADDRESS: view.getUint32(offset),
      PROTOCOL: view.getUint8(offset + 4),
      BIT_MAP: view.getUint16(offset + 1)
    }
  }

  if (rTypeStr === 'MX') {
    /**
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |     PREFERENCE     16 bit integer              |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    /     EXCHANGE       A <domain-name>             /
    /                                               /
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
     */
    const PREFERENCE = view.getUint16(offset);
    const EXCHANGE = decodeName(view, offset + 2);

    return {
      PREFERENCE,
      EXCHANGE: EXCHANGE.name
    }
  }

  if (rTypeStr === 'HINFO') {
    /**
     * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    /                      CPU                      /
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    /                       OS                      /
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

    CPU   A <character-string> which specifies the CPU type.
    OS    A <character-string> which specifies the operating  system type.
     */
    const CPU = decodeName(view, offset);
    offset += CPU.consumedBytes
    const OS = decodeName(view, offset);

    return {
      CPU: CPU.name,
      OS: OS.name
    }
  }

  if (rTypeStr === 'SOA') {

    const MNAME = decodeName(view, offset);
    offset += MNAME.consumedBytes
    const RNAME = decodeName(view, offset);
    offset += RNAME.consumedBytes;

    const SERIAL = view.getUint32(offset);
    offset += 4;
    const REFRESH = view.getUint32(offset)
    offset += 4;

    const RETRY = view.getUint32(offset)
    offset += 4;

    const EXPIRE = view.getUint32(offset)
    offset += 4;

    const MINIMUM = view.getUint32(offset);


    /**
     * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    /                     MNAME                     /
    /                                               /
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    /                     RNAME                     /
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    SERIAL                     |
    |                                               |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    REFRESH                    |
    |                                               |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                     RETRY                     |
    |                                               |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    EXPIRE                     |
    |                                               |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    MINIMUM                    |
    |                                               |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
     */
    return {
      MNAME: MNAME.name,
      RNAME: RNAME.name,
      SERIAL,
      REFRESH,
      RETRY,
      EXPIRE,
      MINIMUM
    }
  }

  if (rTypeStr === 'SRV') {
    const PRIORITY = view.getUint16(offset)
    offset += 2

    const WEIGHT = view.getUint16(offset)
    offset += 2

    const PORT = view.getUint16(offset)
    offset += 2

    const TARGET = decodeName(view, offset).name

    return {
      PRIORITY,
      WEIGHT,
      PORT,
      TARGET
    }
  }

  return view.buffer.slice(offset)
}