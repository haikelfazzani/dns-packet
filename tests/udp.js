import { createSocket, } from 'dgram'
import dnsPacket from 'dns-packet';
import { encode, decode } from '../dist/index.mjs';

const dnsQuery = {
  id: 153,
  type: 'query',
  flags: dnsPacket.RECURSION_DESIRED,
  questions: [{ name: 'gmail.google.com', type: 'TXT', class: 'IN' }]
};

const server = createSocket('udp4');

server.send(dnsPacket.encode(dnsQuery), 53, '1.1.1.1', (err) => {
  console.log(err);


  server.on('message', (msg, rinfo) => {
    console.log(dnsPacket.decode(msg).authorities);
    console.log(decode(msg.buffer).authorities);

    server.close();
  });


});

// server.bind(8000)