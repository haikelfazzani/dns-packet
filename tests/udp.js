import { createSocket, } from 'dgram'
import { encode, decode } from '../dist/index.mjs';
import dnsPacket from 'dns-packet'

const pk = encode({
  id: 153,
  flags: {
    RD: 1,
    RA: 0
  },
  questions: [
    { CLASS: 'IN', NAME: "dns.cloudflare.com", TYPE: "SOA" }
  ]
});

const buf = dnsPacket.encode({
  type: 'query',
  id: 1,
  flags: dnsPacket.RECURSION_DESIRED,
  questions: [{
    type: 'CNAME',
    name: 'clients.l.google.com'
  }]
})

const server = createSocket('udp4');

server.send(buf, 53, '1.1.1.1', (err) => {
  if (err) console.log(err.message);

  server.on('message', (msg, rinfo) => {
    console.log(msg);
    console.log(decode(msg).answers);
    console.log(decode(msg).authorities);
    server.close();
  });
});

// server.bind(8000)
