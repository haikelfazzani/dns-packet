import { encode, decode } from '../src/main';
import { DNSQuery, DNSResponse } from '../src/types';
import axios from 'axios';

const headers = {
  'Content-Type': 'application/dns-message',
  'Accept': 'application/dns-message'
}

const dnsServers = [
  'https://secure.avastdns.com/dns-query',
  'https://cloudflare-dns.com/dns-query',
  'https://dns.google/dns-query'
];

describe('DNS Packet Encoding and Decoding', () => {
  it('should encode a DNS query and successfully decode the response for a standard A record lookup', async () => {
    const response = await axios.post(dnsServers[1], encode({
      flags: {
        RD: 1, // Recursion Desired
        Opcode: 'QUERY'
      },
      questions: [
        {
          NAME: 'google.com',
          TYPE: 'A',
          CLASS: 'IN'
        }
      ]
    }), {
      headers,
      responseType: 'arraybuffer'
    });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/dns-message');

    const decodedResponse: DNSResponse = decode(response.data);
    expect(decodedResponse.flags.QR).toBe('RESPONSE');
    expect(decodedResponse.questions[0].NAME).toBe('google.com');
  });

  it('should encode a DNS query and successfully decode the response for a CNAME record lookup', async () => {
    const encodedQuery = encode({
      flags: {
        RD: 1,
        Opcode: 'QUERY'
      },
      questions: [
        {
          NAME: 'www.cloudflare.com',
          TYPE: 'CNAME',
          CLASS: 'IN'
        }
      ]
    });

    const response = await axios.post(dnsServers[1], encodedQuery, {
      headers,
      responseType: 'arraybuffer'
    });

    expect(response.status).toBe(200);
    const decodedResponse: DNSResponse = decode(response.data);
    expect(decodedResponse.flags.QR).toBe('RESPONSE');
  });

  it('should encode and decode a DNS query for an AAAA record lookup (IPv6)', async () => {
    const encodedQuery = encode({
      flags: { RD: 1 },
      questions: [
        { NAME: 'google.com', TYPE: 'AAAA', CLASS: 'IN' }
      ]
    });

    const response = await axios.post(dnsServers[1], encodedQuery, {
      headers,
      responseType: 'arraybuffer'
    });

    expect(response.status).toBe(200);
    const decodedResponse: DNSResponse = decode(response.data);
    expect(decodedResponse.questions[0].NAME).toBe('google.com');
    expect(decodedResponse.answers[0].TYPE).toBe('AAAA');
    expect(decodedResponse.answers[0].RDATA).not.toBeNull();
  });

  it('should encode and decode a DNS query for an MX record lookup', async () => {
    const encodedQuery = encode({
      flags: { RD: 1 },
      questions: [
        { NAME: 'google.com', TYPE: 'MX', CLASS: 'IN' }
      ]
    });

    const response = await axios.post(dnsServers[1], encodedQuery, {
      headers,
      responseType: 'arraybuffer'
    });

    expect(response.status).toBe(200);
    const decodedResponse: DNSResponse = decode(response.data);
    const mxRecord = decodedResponse.answers.find(a => a.TYPE === 'MX');
    expect(mxRecord).toBeDefined();
    expect(mxRecord!.RDATA.PREFERENCE).toBeDefined();
    expect(mxRecord!.RDATA.EXCHANGE).toBeDefined();
    expect(mxRecord!.RDATA.EXCHANGE).toBe('smtp.google.com');
  });


  it('should encode and decode a DNS query for a TXT record lookup', async () => {
    const encodedQuery = encode({
      flags: { RD: 1 },
      questions: [
        { NAME: 'google.com', TYPE: 'TXT', CLASS: 'IN' }
      ]
    });

    const response = await axios.post(dnsServers[1], encodedQuery, {
      headers,
      responseType: 'arraybuffer'
    });

    expect(response.status).toBe(200);
    const decodedResponse: DNSResponse = decode(response.data);
    const txtRecord = decodedResponse.answers.find(a => a.TYPE === 'TXT');

    expect(txtRecord).toBeDefined();
    expect(Array.isArray(txtRecord!.RDATA)).toBe(true);
  });

  it('should encode and decode a DNS query with EDNS options (DNSSEC OK)', async () => {
    const encodedQuery = encode({
      id: 1234,
      flags: { RD: 1, Opcode: 'QUERY' },
      questions: [
        { NAME: 'dnssec-test.sidnlabs.nl', TYPE: 'A', CLASS: 'IN' }
      ],
      edns: {
        udpPayloadSize: 512,
        extendedRCODE: 0,
        version: 0,
        flags: {
          DO: 1 // DNSSEC OK
        }
      }
    });

    const response = await axios.post(dnsServers[1], encodedQuery, {headers,responseType: 'arraybuffer'});
    expect(response.status).toBe(200);
    const decodedResponse: DNSResponse = decode(response.data);
    expect(decodedResponse.flags.RA).toBe(1); // Recursion Available
    expect(decodedResponse.flags.RCODE).toBe('NOERROR');
  });

});