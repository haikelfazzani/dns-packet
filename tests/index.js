import { encode, decode } from '../dist/index.mjs';
import axios from 'axios';
import dnsPacket from 'dns-packet';

const pk = {
  id: 153,
  flags: {
    QR: 'QUERY',
    Opcode: 'QUERY',
    AA: 1,
    RD: 1
  },
  questions: [
    { CLASS: 'IN', NAME: 'google.com', TYPE: 'A' }
  ]
};

const dnsQuery = {
  id: 153,
  type: 'query',
  flags:384,
  questions: [{  name: 'google.com', type: 'CNAME', class: 'IN' }]
};

const dr = {
  id: 1,
  type: 'response',
  flags: 384,
  flag_qr: true,
  opcode: 'QUERY',
  flag_aa: false,
  flag_tc: false,
  flag_rd: true,
  flag_ra: true,
  flag_z: false,
  flag_ad: false,
  flag_cd: false,
  rcode: 'NOERROR',
  questions: [{ name: 'google.com', type: 'CNAME', class: 'IN' }],
  answers: [
    {
      name: 'google.com',
      type: 'A',
      ttl: 244,
      class: 'IN',
      flush: false,
      data: '142.250.201.46'
    },
    {
      name: 'google2.com',
      type: 'A',
      ttl: 244,
      class: 'IN',
      flush: false,
      data: '0123:4567:89ab:cdef:0123:4567:89ab:cdef'
    },
    {
      name: 'google.com',
      type: 'NS',
      ttl: 338315,
      class: 'IN',
      flush: false,
      data: 'ns2.google.com'
    }
  ],
  authorities: [
    {
      name: 'google.com',
      type: 'SOA',
      ttl: 21,
      class: 'IN',
      flush: false,
      data: {
        mname: 'ns1.google.com',
        rname: 'dns-admin.google.com',
        serial: 620201047,
        refresh: 900,
        retry: 900,
        expire: 1800,
        minimum: 60
      }
    }
  ],
  additionals: []
};

const dnsResponse = {
  id: 1,
  flags: { QR: 0, Opcode: 0, AA: 0, TC: 0, RD: 0, RA: 0, Z: 0, RCODE: 0 },
  questions: [{ CLASS: 1, NAME: 'google.com', TYPE: 1 }],
  answers: [
    {
      name: 'google.com',
      type: 1,
      ttl: 252,
      class: 1,
      RDLENGTH: 0,
      RDATA: '142.250.200.206'
    }
  ],
  authorities: [], // similar to answers
  additionals: []  // similar to answers
};

(async () => {
  // console.log(Buffer.from(encode(pk)));
  // console.log(dnsPacket.encode(dnsQuery))

  // console.log(dnsPacket.decode(Buffer.from(encode(pk))));

  const rdr = await fetch('https://cloudflare-dns.com/dns-query', {
    body: encode(pk),
    method: 'POST',
    headers: { 'Content-Type': 'application/dns-message' },
  });

  const resp = await rdr.arrayBuffer();

  // console.log(dnsPacket.decode(Buffer.from(resp)));


  // // const enc = dnsPacket.encode(dr);
  // // //  console.log(dnsPacket.decode(enc));

  // // console.log(decode(encode(pk)));
  console.log(dnsPacket.decode(Buffer.from(resp)).answers);
  console.log(decode(resp));
  // decodeDNSPacket(resp)
})()
