# DNS Packet

A Node.js/Deno/Bun and browser module for encoding and decoding DNS packets. This library
is designed to facilitate DNS over HTTPS (DoH) and other DNS-based applications.
It supports the core DNS protocol as defined in **RFC 1035** and includes modern
extensions like EDNS0.

## Usage

You can use this library with an HTTP client like `axios` to perform DNS queries
over HTTPS to a DoH endpoint like Cloudflare's.

```js
import { decode, encode } from "dnspacket-ts";
import axios from "axios";

// Define the DNS query for 'google.com' with an AAAA record type.
// The 'RD: 1' flag requests a recursive query.
const query = {
  id: 153,
  flags: {
    RD: 1, // Recursion Desired
  },
  questions: [
    { CLASS: "IN", NAME: "google.com", TYPE: "AAAA" },
  ],
};

// Encode the JavaScript object into a binary DNS packet (Uint8Array).
const data = encode(query);

(async () => {
  try {
    // Use axios to send the binary DNS packet over HTTPS.
    const rdr = await axios({
      url: "https://cloudflare-dns.com/dns-query",
      method: "POST",
      data: data,
      headers: { "Content-Type": "application/dns-message" },
      responseType: "arraybuffer", // Specify that the response is a binary buffer.
    });

    // Decode the binary response back into a readable JavaScript object.
    console.log(decode(rdr.data));
    /*
      {
        id: 153,
        flags: {
          QR: "RESPONSE",
          Opcode: 0,
          AA: 0,
          TC: 0,
          RD: 1,
          RA: 1,
          Z: 0,
          RCODE: "NOERROR"
        },
        questions: [ { CLASS: "IN", NAME: "google.com", TYPE: "AAAA" } ],
        answers: [
          {
            CLASS: "IN",
            TYPE: "AAAA",
            TTL: 138,
            RDLENGTH: 16,
            RDATA: "2607:f8b0:4009:080b::200e",
            NAME: "google.com"
          }
        ],
        authorities: [],
        additionals: [],
        edns: undefined
      }
    */
  } catch (error) {
    console.error("Error during DNS query:", error);
  }
})();
```

### DNS Packet Format

A DNS packet is a structured binary message consisting of a header and four
sections: Questions, Answers, Authority Records, and Additional Records.

- **Header**: Contains fixed-size fields like the transaction ID, flags, and
  counts for each section.
- **Question Section**: Specifies the domain name, query type, and class being
  queried.
- **Answer Section**: Contains resource records (RRs) that answer the question.
- **Authority Section**: Holds name server records relevant to the query.
- **Additional Section**: Includes extra RRs that may be helpful, such as EDNS0
  records for extended features.

## Resources

- **RFC 1035**: Domain Names - Implementation and Specification
  - This RFC is the foundational standard for the DNS protocol.
- **RFC 3597**: Handling of Unknown DNS Resource Record (RR) Types
  - This RFC is relevant for the `getRType` function, which handles unknown
    record types.
- **RFC 6891**: Extension Mechanisms for DNS (EDNS0)
  - This RFC describes how to extend the DNS protocol to support features like
    larger packet sizes.
- **RFC 8484**: DNS Queries over HTTPS (DoH)
  - This RFC defines how to transport DNS messages over HTTP using the
    `application/dns-message` content type.

- **RFC 1034**: This is a companion to RFC 1035 and covers the conceptual
  foundation of the Domain Name System, including its architecture and
  delegation model.
- **RFC 3596**: Defines the DNS extensions required to support IPv6,
  specifically the "AAAA" resource record type, which the code handles in
  `decodeRDATA.ts`.
- **RFC 2782**: This RFC defines the Service (SRV) record, which the
  `decodeRDATA.ts` file is designed to handle.
- **RFC 2181**: Provides clarifications on the DNS specification, including the
  255-octet limit for domain names, a check that is implemented in the
  `encode.ts` file. It also clarifies that pointers must not be "forward
  pointers," a check that is present in `decodeName.ts`.
- **RFC 6891**: This is a key RFC for the EDNS (Extension Mechanisms for DNS)
  implementation. The code's handling of the `OPT` pseudo-record with `rType 41`
  is based on this standard. It re-purposes fields in the DNS header for
  EDNS-specific data, such as the `udpPayloadSize`, `extendedRCODE`, `version`,
  and the `DNSSEC OK (DO)` flag.
