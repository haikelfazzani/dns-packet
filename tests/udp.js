import { createSocket, } from 'dgram'
import { encode, decode } from '../dist/index.js';

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


const server = createSocket('udp4');

server.send(pk, 53, '1.1.1.1', (err) => {
  if (err) console.log(err.message);

  server.on('message', (msg, rinfo) => {
    console.log(msg);
    console.log(decode(msg).answers);
    console.log(decode(msg).authorities);
    server.close();
  });
});

// server.bind(8000)
