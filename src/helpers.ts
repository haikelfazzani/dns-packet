export function getOPCODE(val?: string | number) {
  if (typeof val === 'string') val = val.toUpperCase();
  const oPCODE = { 'QUERY': 0 };
  return typeof val === 'number' ? Object.keys(oPCODE)[0] : oPCODE[val] || 0;
}

export function getQR(val?: string | number) {
  const qR = { 'QUERY': 0, 'RESPONSE': 1 };
  return typeof val === 'number' ? Object.entries(qR).find(([_, value]) => value === val)?.[0] : qR[val] || 0;
}

export function getRClass(val?: string | number) {
  if (typeof val === 'string') val = val.toUpperCase();
  const RClass = {
    'IN': 1,
    'ANY': 255,
    '*': 255
  };
  return typeof val === 'number' ? Object.entries(RClass).find(([_, value]) => value === val)?.[0] : RClass[val] || 1;
}

export function getRCODE(val?: string | number) {
  if (typeof val === 'string') val = val.toUpperCase();
  const rCODE = {
    'NOERROR': 0, 'FORMERR': 1, 'SERVFAIL': 2, 'NXDOMAIN': 3, 'NOTIMP': 4, 'REFUSED': 5,
  };
  return typeof val === 'number' ? Object.entries(rCODE).find(([_, value]) => value === val)?.[0] : rCODE[val] || 0;
}


export function getRType(val?: string | number) {
  const rTypeStringToCode = {
    'A': 1, 'NS': 2, 'CNAME': 5, 'SOA': 6, 'PTR': 12, 'MX': 15,
    'TXT': 16, 'AAAA': 28, 'SRV': 33, 'OPT': 41, 'ANY': 255, '*': 255
  };

  const rTypeCodeToString = Object.fromEntries(
    Object.entries(rTypeStringToCode).map(([key, value]) => [value, key])
  );

  if (typeof val === 'string') {
    if (val.startsWith('UNKNOWN_')) return +val.replace(/\D+/g, '');
    return rTypeStringToCode[val.toUpperCase()] || 255;
  }
  if (typeof val === 'number') {
    return rTypeCodeToString[val] || 'UNKNOWN_' + val;
  }
  return 255;
}