import { encode, decode } from '../src/main';
import { DNSQuery, DNSResponse } from '../src/types';

global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('DNS Library Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('encode function', () => {
    it('should encode a simple A record query', () => {
      const query: DNSQuery = {
        id: 12345,
        questions: [
          { NAME: 'example.com', TYPE: 'A', CLASS: 'IN' }
        ]
      };

      const result = encode(query);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(12); // Header + question

      // Check header
      const view = new DataView(result.buffer);
      expect(view.getUint16(0)).toBe(12345); // ID
      expect(view.getUint16(4)).toBe(1); // QDCOUNT = 1
      expect(view.getUint16(6)).toBe(0); // ANCOUNT = 0
      expect(view.getUint16(8)).toBe(0); // NSCOUNT = 0
      expect(view.getUint16(10)).toBe(0); // ARCOUNT = 0
    });

    it('should encode with EDNS', () => {
      const query: DNSQuery = {
        questions: [
          { NAME: 'dnssec-test.sidnlabs.nl', TYPE: 'A', CLASS: 'IN' }
        ],
        edns: {
          udpPayloadSize: 512,
          extendedRCODE: 0,
          version: 0,
          flags: { DO: 1 },
          options: [
            { code: 8, data: new Uint8Array([0, 10]) } // Client subnet
          ]
        }
      };

      const result = encode(query);
      const view = new DataView(result.buffer);
      expect(view.getUint16(10)).toBe(1); // ARCOUNT = 1 (for OPT record)
    });

    it('should handle various record types', () => {
      const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV'];

      recordTypes.forEach(type => {
        const query: DNSQuery = {
          questions: [
            { NAME: 'example.com', TYPE: type, CLASS: 'IN' }
          ]
        };

        const result = encode(query);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(12);
      });
    });
  });

  describe('decode function', () => {
    it('should decode a simple DNS response', () => {
      // Create a simple DNS response buffer
      const buffer = new ArrayBuffer(100);
      const view = new DataView(buffer);

      // Header
      view.setUint16(0, 12345); // ID
      view.setUint16(2, 0x8180); // Flags: QR=1, RD=1, RA=1
      view.setUint16(4, 1); // QDCOUNT
      view.setUint16(6, 1); // ANCOUNT
      view.setUint16(8, 0); // NSCOUNT
      view.setUint16(10, 0); // ARCOUNT

      // Question: example.com A IN
      let offset = 12;
      view.setUint8(offset++, 7); // length of "example"
      "example".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
      view.setUint8(offset++, 3); // length of "com"
      "com".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
      view.setUint8(offset++, 0); // end of name
      view.setUint16(offset, 1); offset += 2; // TYPE A
      view.setUint16(offset, 1); offset += 2; // CLASS IN

      // Answer: example.com A IN 300 192.168.1.1
      view.setUint16(offset, 0xc00c); offset += 2; // Compressed name pointer
      view.setUint16(offset, 1); offset += 2; // TYPE A
      view.setUint16(offset, 1); offset += 2; // CLASS IN
      view.setUint32(offset, 300); offset += 4; // TTL
      view.setUint16(offset, 4); offset += 2; // RDLENGTH
      view.setUint8(offset++, 192);
      view.setUint8(offset++, 168);
      view.setUint8(offset++, 1);
      view.setUint8(offset++, 1);

      const result = decode(new Uint8Array(buffer, 0, offset));

      expect(result.id).toBe(12345);
      expect(result.flags.QR).toBe('RESPONSE');
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].NAME).toBe('example.com');
      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].RDATA).toBe('192.168.1.1');
    });

    it('should handle malformed data gracefully', () => {
      const malformedBuffer = new Uint8Array([1, 2, 3]); // Too short
      expect(() => decode(malformedBuffer)).toThrow();
    });
  });

  describe('Real DNS Server Integration Tests', () => {
    const dnsServers = [
      'https://cloudflare-dns.com/dns-query',
      'https://dns.google/dns-query',
      'https://secure.avastdns.com/dns-query'
    ];

    it.each(dnsServers)('should work with %s', async (serverUrl) => {
      const query: DNSQuery = {
        questions: [
          { NAME: 'example.com', TYPE: 'A', CLASS: 'IN' }
        ]
      };

      const encodedQuery = encode(query);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => {
          // Mock a simple DNS response
          const buffer = new ArrayBuffer(100);
          const view = new DataView(buffer);

          view.setUint16(0, query.id || 0);
          view.setUint16(2, 0x8180); // Response flags
          view.setUint16(4, 1); // QDCOUNT
          view.setUint16(6, 1); // ANCOUNT
          view.setUint16(8, 0); // NSCOUNT
          view.setUint16(10, 0); // ARCOUNT

          // Echo back the question
          let offset = 12;
          view.setUint8(offset++, 7);
          "example".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
          view.setUint8(offset++, 3);
          "com".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
          view.setUint8(offset++, 0);
          view.setUint16(offset, 1); offset += 2; // TYPE A
          view.setUint16(offset, 1); offset += 2; // CLASS IN

          // Add answer
          view.setUint16(offset, 0xc00c); offset += 2; // Pointer
          view.setUint16(offset, 1); offset += 2; // TYPE A
          view.setUint16(offset, 1); offset += 2; // CLASS IN
          view.setUint32(offset, 300); offset += 4; // TTL
          view.setUint16(offset, 4); offset += 2; // RDLENGTH
          view.setUint32(offset, 0x5DB8D822); offset += 4; // 93.184.216.34

          return buffer.slice(0, offset);
        }
      } as Response);

      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/dns-message',
          'Accept': 'application/dns-message'
        },
        body: encodedQuery
      });

      expect(response.ok).toBe(true);

      const responseBuffer = await response.arrayBuffer();
      const decodedResponse = decode(responseBuffer);

      expect(decodedResponse.flags.QR).toBe('RESPONSE');
      expect(decodedResponse.questions).toHaveLength(1);
      expect(decodedResponse.questions[0].NAME).toBe('example.com');
    });

    it('should handle EDNS queries with real servers', async () => {
      const query: DNSQuery = {
        questions: [
          { NAME: 'cloudflare.com', TYPE: 'A', CLASS: 'IN' }
        ],
        edns: {
          udpPayloadSize: 4096,
          extendedRCODE: 0,
          version: 0,
          flags: { DO: 1 }
        }
      };

      const encodedQuery = encode(query);

      // Mock EDNS response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => {
          const buffer = new ArrayBuffer(200);
          const view = new DataView(buffer);

          view.setUint16(0, query.id || 0);
          view.setUint16(2, 0x8180);
          view.setUint16(4, 1); // QDCOUNT
          view.setUint16(6, 1); // ANCOUNT
          view.setUint16(8, 0); // NSCOUNT
          view.setUint16(10, 1); // ARCOUNT (OPT record)

          let offset = 12;
          // Question
          view.setUint8(offset++, 10);
          "cloudflare".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
          view.setUint8(offset++, 3);
          "com".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
          view.setUint8(offset++, 0);
          view.setUint16(offset, 1); offset += 2;
          view.setUint16(offset, 1); offset += 2;

          // Answer
          view.setUint16(offset, 0xc00c); offset += 2;
          view.setUint16(offset, 1); offset += 2;
          view.setUint16(offset, 1); offset += 2;
          view.setUint32(offset, 300); offset += 4;
          view.setUint16(offset, 4); offset += 2;
          view.setUint32(offset, 0x68105CA6); offset += 4; // IP

          // OPT record
          view.setUint8(offset++, 0); // Root
          view.setUint16(offset, 41); offset += 2; // OPT
          view.setUint16(offset, 4096); offset += 2; // UDP size
          view.setUint32(offset, 0x00008000); offset += 4; // Flags
          view.setUint16(offset, 0); offset += 2; // No options

          return buffer.slice(0, offset);
        }
      } as Response);

      const response = await fetch('https://cloudflare-dns.com/dns-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/dns-message',
          'Accept': 'application/dns-message'
        },
        body: encodedQuery
      });

      const responseBuffer = await response.arrayBuffer();
      const decodedResponse = decode(responseBuffer);

      expect(decodedResponse.edns).toBeDefined();
      expect(decodedResponse.edns!.udpPayloadSize).toBe(4096);
    });


  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const query: DNSQuery = {
        questions: [{ NAME: 'example.com', TYPE: 'A', CLASS: 'IN' }]
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        fetch('https://cloudflare-dns.com/dns-query', {
          method: 'POST',
          body: encode(query)
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid server responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      } as Response);

      const response = await fetch('https://cloudflare-dns.com/dns-query');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should handle truncated responses', () => {
      const truncatedBuffer = new Uint8Array(5); // Too small for even a header
      expect(() => decode(truncatedBuffer)).toThrow();
    });
  });
});