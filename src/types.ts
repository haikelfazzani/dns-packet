type OPCODE = 'QUERY' | 'IQUERY' | 'STATUS' | 'RESERVED' | 'NOTIFY' | 'UPDATE';
type RCODE = 'NOERROR' | 'FORMERR' | 'SERVFAIL' | 'NXDOMAIN' | 'NOTIMP' | 'REFUSED';

export type RType = 'A' | 'AAAA' | 'MX' | 'TXT';
export type RClass = 'IN' | 'CS' | 'CH' | 'HS';

export type Question = { NAME: string, TYPE: RType, CLASS: RClass, }
export type Answer = {
  NAME: string,
  TYPE: RType,
  CLASS: RClass,
  TTL: number, // 32 bit unsigned integer that specifies the time interval (in seconds) that the resource record may be cached before it should be discarded
  RDLENGTH: number,
  RDATA?: {
    MNAME: string,
    RNAME: string,
    SERIAL: number, // unsigned 32 bit version number of the original copy of the zone
    REFRESH: number, // 32 bit time interval
    RETRY: number,// 32 bit time interval
    EXPIRE: number// 32 bit time interval
  },
}

export type DNSQuery = {
  id: number, // 16 bit
  flags: {
    QR: 'QUERY' | 'RESPONSE',
    Opcode: OPCODE, // 4 bit : This value is set by the originator of a query and copied into the response
    AA?: 0 | 1,     // Authoritative Answer - this bit is valid in responses
    TC?: 0 | 1,     // TrunCation - specifies that this message was truncated
    RD?: 0 | 1,     // Recursion Desired - this bit may be set in a query and is copied into the response
    RA?: 0 | 1,     // Recursion Available
    Z?: 0,          // 3 bit : Reserved for future use
    RCODE?: RCODE   // Response code - this 4 bit field is set as part of responses
  },
  questions: Question[],
  answers?: Answer[],
  authorities?: Answer[],
  additionals?: Answer[]
}

export type DNSResponse = DNSQuery;