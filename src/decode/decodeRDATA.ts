import getRType from "../utils/getRType";
import decodeName from "./decodeName";

export default function decodeRDATA(view: DataView, offset: number, RDLENGTH: number, aType: number) {
  let RDATA = '';

  if (getRType(aType) === 'A') {
    for (let i = 0; i < RDLENGTH; i++) {
      RDATA += (i === 0 ? '' : '.') + view.getUint8(offset + i)
    }
  }

  if (['CNAME', 'NS', 'TXT', 'PTR', 'NULL', 'MR', 'MG', 'MF', 'MD', 'MB'].includes(getRType(aType))) {
    RDATA = decodeName(view, offset, offset + RDLENGTH);
  }

  if(getRType(aType) === 'SOA') {
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
  }

  return RDATA
}