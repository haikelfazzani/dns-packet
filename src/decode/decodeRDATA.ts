import getRType from "../utils/getRType";
import decodeName from "./decodeName";

export default function decodeRDATA(view: DataView, offset: number, RDLENGTH: number, rType: number) {
  let RDATA = '';

  console.log(rType);
  

  if (getRType(rType) === 'A') {
    for (let i = 0; i < RDLENGTH; i++) {
      RDATA += (i === 0 ? '' : '.') + view.getUint8(offset + i)
    }
  }

  if (['CNAME', 'NS', 'TXT', 'PTR', 'NULL', 'MR', 'MG', 'MF', 'MD', 'MB'].includes(getRType(rType))) {
    RDATA = decodeName(view, offset, offset + RDLENGTH);
  }

  if(getRType(rType) === 'SOA') {
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