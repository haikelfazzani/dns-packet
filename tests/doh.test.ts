// __tests__/dns.test.ts

import { encode, decode } from '../src/main';
import { DNSQuery, DNSResponse } from '../src/types';
import axios from 'axios';

describe('DNS Packet Encoding and Decoding', () => {
  const dnsServers = [
    'https://secure.avastdns.com/dns-query',
    'https://cloudflare-dns.com/dns-query',
    'https://dns.google/dns-query'
  ];

  dnsServers.forEach(serverUrl => {
    describe(`Testing with DNS over HTTPS server: ${serverUrl}`, () => {
      it('should encode a DNS query and successfully decode the response for a standard A record lookup', async () => {
        const queryPacket: DNSQuery = {
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
        };

        // 1. Encode the DNS query packet
        const encodedQuery = encode(queryPacket);

        // 2. Send the encoded query to the DNS over HTTPS server using Axios
        const response = await axios.post(serverUrl, encodedQuery, {
          headers: {
            'Content-Type': 'application/dns-message',
            'Accept': 'application/dns-message'
          },
          responseType: 'arraybuffer'
        });

        // 3. Check if the response is valid
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('application/dns-message');

        const responseUint8Array = new Uint8Array(response.data);

        // 4. Decode the DNS response packet
        const decodedResponse: DNSResponse = decode(responseUint8Array);

        // 5. Assertions on the decoded response
        expect(decodedResponse.flags.QR).toBe('RESPONSE');
        expect(decodedResponse.questions[0].NAME).toBe('google.com');
      });

      it('should encode a DNS query and successfully decode the response for a CNAME record lookup', async () => {
        const queryPacket: DNSQuery = {
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
        };

        const encodedQuery = encode(queryPacket);

        const response = await axios.post(serverUrl, encodedQuery, {
          headers: {
            'Content-Type': 'application/dns-message',
            'Accept': 'application/dns-message'
          },
          responseType: 'arraybuffer'
        });

        expect(response.status).toBe(200);

        const decodedResponse: DNSResponse = decode(new Uint8Array(response.data));

        expect(decodedResponse.flags.QR).toBe('RESPONSE');
      });
    });
  });
});