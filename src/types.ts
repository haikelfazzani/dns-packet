export type OPCODE = 'QUERY' | 'IQUERY' | 'STATUS' | 'RESERVED' | 'NOTIFY' | 'UPDATE';
export type RCODE = 'NOERROR' | 'FORMERR' | 'SERVFAIL' | 'NXDOMAIN' | 'NOTIMP' | 'REFUSED';

export type Question = { NAME: string, TYPE: string, CLASS: string }

export type Answer = {
  NAME: string,
  TYPE: string,
  CLASS: 'IN' | 'CS' | 'CH' | 'HS',
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
    QR?: 'QUERY' | 'RESPONSE',
    Opcode?: OPCODE, // 4 bit : This value is set by the originator of a query and copied into the response
    AA?: number,     // (0 | 1) Authoritative Answer - this bit is valid in responses
    TC?: number,     // (0 | 1) TrunCation - specifies that this message was truncated
    RD?: number,     // (0 | 1) Recursion Desired - this bit may be set in a query and is copied into the response
    RA?: number,     // (0 | 1) Recursion Available
    Z?: number,          // 3 bit : Reserved for future use
    RCODE?: RCODE   // Response code - this 4 bit field is set as part of responses
  },
  questions: Question[],
  answers?: Answer[],
  authorities?: Answer[],
  additionals?: Answer[]
}

export type DNSResponse = {
  id: number,
  flags: {
    QR: 'QUERY' | 'RESPONSE',
    Opcode: number,
    AA?: number,
    TC?: number,
    RD?: number,
    RA?: number,
    Z?: number,
    RCODE?: RCODE
  },
  questions: Question[],
  answers?: Answer[],
  authorities?: Answer[],
  additionals?: Answer[]
}