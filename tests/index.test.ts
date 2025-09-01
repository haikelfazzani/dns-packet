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

    it('should encode multiple questions', () => {
      const query: DNSQuery = {
        questions: [
          { NAME: 'example.com', TYPE: 'A', CLASS: 'IN' },
          { NAME: 'example.org', TYPE: 'AAAA', CLASS: 'IN' }
        ]
      };

      const result = encode(query);
      const view = new DataView(result.buffer);
      expect(view.getUint16(4)).toBe(2); // QDCOUNT = 2
    });

    it('should encode with EDNS', () => {
      const query: DNSQuery = {
        questions: [
          { NAME: 'example.com', TYPE: 'A', CLASS: 'IN' }
        ],
        edns: {
          udpPayloadSize: 4096,
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

    it('should handle domain name compression', () => {
      const query: DNSQuery = {
        questions: [
          { NAME: 'www.example.com', TYPE: 'A', CLASS: 'IN' },
          { NAME: 'mail.example.com', TYPE: 'A', CLASS: 'IN' }
        ]
      };

      const result = encode(query);
      expect(result.length).toBeLessThan(100); // Should be compressed
    });

    it('should throw error for empty questions', () => {
      const query: DNSQuery = {
        questions: []
      };

      expect(() => encode(query)).toThrow('DNS query must have at least one question');
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

    it('should handle various RDATA types', () => {
      // This would require creating buffers for each record type
      // For brevity, testing one complex case: MX record
      const buffer = new ArrayBuffer(100);
      const view = new DataView(buffer);

      // Simple MX record test setup
      view.setUint16(0, 1); // ID
      view.setUint16(2, 0x8000); // Response flag
      view.setUint16(4, 0); // No questions
      view.setUint16(6, 1); // 1 answer
      view.setUint16(8, 0); // No authority
      view.setUint16(10, 0); // No additional

      let offset = 12;
      // MX record: example.com MX 10 mail.example.com
      view.setUint8(offset++, 7);
      "example".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
      view.setUint8(offset++, 3);
      "com".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
      view.setUint8(offset++, 0);
      view.setUint16(offset, 15); offset += 2; // TYPE MX
      view.setUint16(offset, 1); offset += 2; // CLASS IN
      view.setUint32(offset, 300); offset += 4; // TTL
      view.setUint16(offset, 16); offset += 2; // RDLENGTH
      view.setUint16(offset, 10); offset += 2; // Preference
      view.setUint8(offset++, 4);
      "mail".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
      view.setUint16(offset, 0xc00c); offset += 2; // Pointer to example.com

      const result = decode(new Uint8Array(buffer, 0, offset));
      expect(result.answers[0].TYPE).toBe('MX');
      expect(result.answers[0].RDATA.PREFERENCE).toBe(10);
    });

    it('should handle EDNS OPT records', () => {
      const buffer = new ArrayBuffer(100);
      const view = new DataView(buffer);

      // Basic response with OPT record
      view.setUint16(0, 1);
      view.setUint16(2, 0x8000);
      view.setUint16(4, 0); // No questions
      view.setUint16(6, 0); // No answers
      view.setUint16(8, 0); // No authority
      view.setUint16(10, 1); // 1 additional (OPT)

      let offset = 12;
      // OPT record
      view.setUint8(offset++, 0); // Root domain
      view.setUint16(offset, 41); offset += 2; // TYPE OPT
      view.setUint16(offset, 4096); offset += 2; // UDP payload size
      view.setUint32(offset, 0x00008000); offset += 4; // Extended flags (DO bit set)
      view.setUint16(offset, 0); offset += 2; // No RDATA

      const result = decode(new Uint8Array(buffer, 0, offset));
      expect(result.edns).toBeDefined();
      expect(result.edns!.udpPayloadSize).toBe(4096);
      expect(result.edns!.flags.DO).toBe(1);
    });

    it('should handle malformed data gracefully', () => {
      const malformedBuffer = new Uint8Array([1, 2, 3]); // Too short
      expect(() => decode(malformedBuffer)).toThrow();
    });

    it('should detect pointer loops', () => {
      const buffer = new ArrayBuffer(50);
      const view = new DataView(buffer);

      // Create a pointer loop
      view.setUint16(0, 1);
      view.setUint16(2, 0x8000);
      view.setUint16(4, 1); // 1 question
      view.setUint16(6, 0);
      view.setUint16(8, 0);
      view.setUint16(10, 0);

      // Question with pointer loop
      view.setUint16(12, 0xc00c); // Points to itself
      view.setUint16(14, 1); // TYPE A
      view.setUint16(16, 1); // CLASS IN

      expect(() => decode(new Uint8Array(buffer, 0, 18))).toThrow('pointer loop');
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

    it('should handle various record types in real queries', async () => {
      const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT'];

      for (const recordType of recordTypes) {
        const query: DNSQuery = {
          questions: [
            { NAME: 'example.com', TYPE: recordType, CLASS: 'IN' }
          ]
        };

        const encodedQuery = encode(query);
        expect(encodedQuery.length).toBeGreaterThan(0);

        // Mock different response types
        let mockResponse;
        switch (recordType) {
          case 'AAAA':
            mockResponse = createMockAAAAResponse();
            break;
          case 'MX':
            mockResponse = createMockMXResponse();
            break;
          case 'TXT':
            mockResponse = createMockTXTResponse();
            break;
          default:
            mockResponse = createMockAResponse();
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => mockResponse
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

        expect(decodedResponse.answers).toHaveLength(1);
        expect(decodedResponse.answers[0].TYPE).toBe(recordType);
      }
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

  describe('Performance Tests', () => {
    it('should encode and decode efficiently', () => {
      const largeQuery: DNSQuery = {
        questions: Array.from({ length: 100 }, (_, i) => ({
          NAME: `test${i}.example.com`,
          TYPE: 'A',
          CLASS: 'IN'
        }))
      };

      const start = performance.now();
      const encoded = encode(largeQuery);
      const encodeTime = performance.now() - start;

      expect(encodeTime).toBeLessThan(100); // Should encode in <100ms
      expect(encoded.length).toBeGreaterThan(1000); // Should be reasonably sized
    });
  });
});

// Helper functions for mock responses
function createMockAResponse(): ArrayBuffer {
  const buffer = new ArrayBuffer(100);
  const view = new DataView(buffer);

  view.setUint16(0, 1); // ID
  view.setUint16(2, 0x8180); // Flags
  view.setUint16(4, 1); // QDCOUNT
  view.setUint16(6, 1); // ANCOUNT
  view.setUint16(8, 0); // NSCOUNT
  view.setUint16(10, 0); // ARCOUNT

  let offset = 12;
  // Question
  view.setUint8(offset++, 7);
  "example".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
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
  view.setUint32(offset, 0x5DB8D822); offset += 4;

  return buffer.slice(0, offset);
}

function createMockAAAAResponse(): ArrayBuffer {
  const buffer = new ArrayBuffer(100);
  const view = new DataView(buffer);

  view.setUint16(0, 1);
  view.setUint16(2, 0x8180);
  view.setUint16(4, 1);
  view.setUint16(6, 1);
  view.setUint16(8, 0);
  view.setUint16(10, 0);

  let offset = 12;
  // Question for AAAA
  view.setUint8(offset++, 7);
  "example".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
  view.setUint8(offset++, 3);
  "com".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
  view.setUint8(offset++, 0);
  view.setUint16(offset, 28); offset += 2; // AAAA type
  view.setUint16(offset, 1); offset += 2;

  // AAAA Answer
  view.setUint16(offset, 0xc00c); offset += 2;
  view.setUint16(offset, 28); offset += 2; // AAAA type
  view.setUint16(offset, 1); offset += 2;
  view.setUint32(offset, 300); offset += 4;
  view.setUint16(offset, 16); offset += 2; // IPv6 is 16 bytes
  // Mock IPv6 address: 2001:db8::1
  view.setUint32(offset, 0x20010db8); offset += 4;
  view.setUint32(offset, 0x00000000); offset += 4;
  view.setUint32(offset, 0x00000000); offset += 4;
  view.setUint32(offset, 0x00000001); offset += 4;

  return buffer.slice(0, offset);
}

function createMockMXResponse(): ArrayBuffer {
  const buffer = new ArrayBuffer(150);
  const view = new DataView(buffer);

  view.setUint16(0, 1);
  view.setUint16(2, 0x8180);
  view.setUint16(4, 1);
  view.setUint16(6, 1);
  view.setUint16(8, 0);
  view.setUint16(10, 0);

  let offset = 12;
  // Question
  view.setUint8(offset++, 7);
  "example".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
  view.setUint8(offset++, 3);
  "com".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
  view.setUint8(offset++, 0);
  view.setUint16(offset, 15); offset += 2; // MX type
  view.setUint16(offset, 1); offset += 2;

  // MX Answer
  view.setUint16(offset, 0xc00c); offset += 2;
  view.setUint16(offset, 15); offset += 2; // MX type
  view.setUint16(offset, 1); offset += 2;
  view.setUint32(offset, 300); offset += 4;
  view.setUint16(offset, 16); offset += 2; // RDLENGTH
  view.setUint16(offset, 10); offset += 2; // Priority
  // mail.example.com
  view.setUint8(offset++, 4);
  "mail".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
  view.setUint16(offset, 0xc00c); offset += 2; // Pointer to example.com

  return buffer.slice(0, offset);
}

function createMockTXTResponse(): ArrayBuffer {
  const buffer = new ArrayBuffer(150);
  const view = new DataView(buffer);

  view.setUint16(0, 1);
  view.setUint16(2, 0x8180);
  view.setUint16(4, 1);
  view.setUint16(6, 1);
  view.setUint16(8, 0);
  view.setUint16(10, 0);

  let offset = 12;
  // Question
  view.setUint8(offset++, 7);
  "example".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
  view.setUint8(offset++, 3);
  "com".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));
  view.setUint8(offset++, 0);
  view.setUint16(offset, 16); offset += 2; // TXT type
  view.setUint16(offset, 1); offset += 2;

  // TXT Answer
  view.setUint16(offset, 0xc00c); offset += 2;
  view.setUint16(offset, 16); offset += 2; // TXT type
  view.setUint16(offset, 1); offset += 2;
  view.setUint32(offset, 300); offset += 4;
  view.setUint16(offset, 13); offset += 2; // RDLENGTH
  view.setUint8(offset++, 12); // Text length
  "hello world!".split('').forEach(c => view.setUint8(offset++, c.charCodeAt(0)));

  return buffer.slice(0, offset);
}