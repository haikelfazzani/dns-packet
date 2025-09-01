export type OPCODE = 'QUERY' | 'IQUERY' | 'STATUS' | 'RESERVED' | 'NOTIFY' | 'UPDATE';
export type RCODE = 'NOERROR' | 'FORMERR' | 'SERVFAIL' | 'NXDOMAIN' | 'NOTIMP' | 'REFUSED';

export type Question = { NAME: string, TYPE: string, CLASS: string }

export type Answer = {
  NAME: string,
  TYPE: string,
  CLASS: string,
  TTL: number,
  RDLENGTH: number,
  RDATA: any,
}

export type EDNS = {
  udpPayloadSize: number;
  extendedRCODE: number;
  version: number;
  flags: {
    DO: number; // DNSSEC OK (0 or 1)
  };
  options?: { code: number; data: Uint8Array }[];
};

export type DNSQuery = {
  id?: number,
  flags?: {
    QR?: 'QUERY' | 'RESPONSE',
    Opcode?: OPCODE,
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
  additionals?: Answer[],
  edns?: EDNS,
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
  answers: Answer[],
  authorities: Answer[],
  additionals: Answer[],
  edns?: EDNS
}