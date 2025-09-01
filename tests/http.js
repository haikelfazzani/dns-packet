import { encode, decode } from '../dist/index.js';
import axios from 'axios';

const dnsServers = [
  "https://secure.avastdns.com/dns-query",
  "https://cloudflare-dns.com/dns-query",
  "https://dns.google/dns-query",
];

const encodedQuery = encode({
  flags: {
    RD: 1, // Recursion Desired
    Opcode: "QUERY",
  },
  questions: [
    // {
    //   NAME: "google.com",
    //   TYPE: "A",
    //   CLASS: "IN",
    // },
    {
      NAME: "www.cloudflare.com",
      TYPE: "TXT",
      CLASS: "IN",
    },
  ],
});

const response = await axios.post(dnsServers[1], encodedQuery, {
  headers: {
    "Content-Type": "application/dns-message",
    "Accept": "application/dns-message",
  },
  responseType: "arraybuffer",
});

const decodedResponse = decode(response.data);
console.log(decodedResponse);
