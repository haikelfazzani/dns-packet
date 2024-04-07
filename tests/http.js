import { encode, decode } from '../dist/index.mjs';
import axios from 'axios';
import dnsPacket from 'dns-packet';

const pk = {
  id: 153,
  questions: [
    { CLASS: 'IN', NAME: 'google.com', TYPE: 'DS' }
  ]
};

const dnsQuery = {
  id: 153,
  type: 'query',
  flags: dnsPacket.RECURSION_DESIRED,
  questions: [{ name: 'google.com', type: 'A', class: 'IN' }]
};

(async () => {
  const rdr = await axios({
    url: 'https://cloudflare-dns.com/dns-query',
    method: 'POST',
    data: dnsPacket.encode(dnsQuery),
    headers: { 'Content-Type': 'application/dns-message' },
    responseType: 'arraybuffer'
  });

  console.log(dnsPacket.decode(Buffer.from(rdr.data)));
  console.log(decode(rdr.data));
})();

// (async () => {
//   const rdr = await fetch('https://cloudflare-dns.com/dns-query', {
//     body: encode(pk),
//     method: 'POST',
//     headers: { 'Content-Type': 'application/dns-message' },
//   });

//   const resp = await rdr.arrayBuffer();

//   console.log(dnsPacket.decode(Buffer.from(resp)));
//   console.log(decode(resp));
// })();
