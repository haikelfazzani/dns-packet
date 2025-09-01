import { encode, decode } from '../dist/index.js';
import axios from 'axios';

const dnsServers = [
  "https://secure.avastdns.com/dns-query",
  "https://cloudflare-dns.com/dns-query",
  "https://dns.google/dns-query",
];

const response = await axios.post(dnsServers[1], encode({
  flags: {
    RD: 1,
    Opcode: "QUERY",
  },
  questions: [
    {
      NAME: "google.com",
      TYPE: "A",
      CLASS: "IN",
    },
  ],
}), {
  headers: {
    "Content-Type": "application/dns-message",
    "Accept": "application/dns-message",
  },
  responseType: "arraybuffer",
});

const decodedResponse = decode(response.data);
console.log(decodedResponse);


const response2 = await axios.post(dnsServers[1], encode({
  flags: {
    RD: 1,
    Opcode: "QUERY",
  },
  questions: [
    {
      NAME: "www.cloudflare.com",
      TYPE: "TXT",
      CLASS: "IN",
    },
  ],
}), {
  headers: {
    "Content-Type": "application/dns-message",
    "Accept": "application/dns-message",
  },
  responseType: "arraybuffer",
});

const decodedResponse2 = decode(response2.data);
console.log(decodedResponse2);