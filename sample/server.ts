import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: WhatIsMyIP / Client Info
  app.get('/api/ip', async (req, res) => {
    try {
      // Determine client IP
      const xForwardedFor = req.headers['x-forwarded-for'];
      let clientIp = '';
      if (typeof xForwardedFor === 'string') {
        clientIp = xForwardedFor.split(',')[0].trim();
      } else if (Array.isArray(xForwardedFor)) {
        clientIp = xForwardedFor[0].trim();
      } else {
        clientIp = req.headers['x-real-ip'] as string || req.socket.remoteAddress || '';
      }

      // Sanitize local loopback IPs for testing
      const isLocal = !clientIp || clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('10.') || clientIp.startsWith('192.168.');
      
      // If client IP is provided in query param (e.g. testing or specific IP lookup)
      const requestedIp = (req.query.ip as string) || (isLocal ? '' : clientIp);

      let geoData: any = {};
      try {
        const targetIp = requestedIp || ''; // ip-api.com returns caller IP if empty string
        const geoRes = await fetch(`http://ip-api.com/json/${targetIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
          signal: AbortSignal.timeout(4000)
        });
        if (geoRes.ok) {
          geoData = await geoRes.json();
        }
      } catch (err) {
        console.warn('IP Geo fetch failed:', err);
      }

      const headersList = {
        'user-agent': req.headers['user-agent'] || '',
        'accept-language': req.headers['accept-language'] || '',
        'accept-encoding': req.headers['accept-encoding'] || '',
        'sec-ch-ua': req.headers['sec-ch-ua'] || '',
        'sec-ch-ua-platform': req.headers['sec-ch-ua-platform'] || '',
        'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'https',
        'host': req.headers['host'] || '',
      };

      res.json({
        ip: geoData.query || clientIp || '127.0.0.1',
        isLocal,
        isIpv6: (geoData.query || clientIp).includes(':'),
        geo: {
          country: geoData.country || 'Unknown',
          countryCode: geoData.countryCode || '',
          region: geoData.regionName || '',
          city: geoData.city || '',
          zip: geoData.zip || '',
          lat: geoData.lat || 0,
          lon: geoData.lon || 0,
          timezone: geoData.timezone || '',
          isp: geoData.isp || 'Local Network',
          org: geoData.org || '',
          as: geoData.as || '',
        },
        headers: headersList,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to detect IP' });
    }
  });

  // API 2: WHOIS / RDAP Lookup
  app.get('/api/whois', async (req, res) => {
    const rawQuery = (req.query.query as string || '').trim().toLowerCase();
    if (!rawQuery) {
      return res.status(400).json({ error: 'Missing domain or IP parameter' });
    }

    // Sanitize query (strip http://, https://, paths)
    let domainOrIp = rawQuery.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0].split(':')[0];

    try {
      // Determine if query is IP or Domain
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(domainOrIp) || domainOrIp.includes(':');
      const endpoint = isIp ? `https://rdap.org/ip/${domainOrIp}` : `https://rdap.org/domain/${domainOrIp}`;

      const rdapResponse = await fetch(endpoint, {
        headers: { Accept: 'application/rdap+json, application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (!rdapResponse.ok) {
        if (rdapResponse.status === 404) {
          return res.status(404).json({ error: `No WHOIS/RDAP record found for "${domainOrIp}"` });
        }
        return res.status(rdapResponse.status).json({ error: `RDAP server returned HTTP ${rdapResponse.status}` });
      }

      const data = await rdapResponse.json();

      // Extract key WHOIS fields cleanly
      const events = data.events || [];
      const registrationEvent = events.find((e: any) => e.eventAction === 'registration');
      const expirationEvent = events.find((e: any) => e.eventAction === 'expiration');
      const lastChangedEvent = events.find((e: any) => e.eventAction === 'last changed' || e.eventAction === 'last update');

      // Extract registrar
      let registrar = 'Unknown';
      if (data.entities) {
        const registrarEntity = data.entities.find((e: any) => e.roles && e.roles.includes('registrar'));
        if (registrarEntity && registrarEntity.vcardArray) {
          const fn = registrarEntity.vcardArray[1]?.find((v: any) => v[0] === 'fn');
          if (fn) registrar = fn[3];
        } else if (registrarEntity?.handle) {
          registrar = registrarEntity.handle;
        }
      }

      // Nameservers
      const nameServers = (data.nameservers || []).map((ns: any) => ns.ldhName || ns.unicodeName || ns.handle).filter(Boolean);

      // Statuses
      const statuses = data.status || [];

      res.json({
        query: domainOrIp,
        type: isIp ? 'IP' : 'Domain',
        handle: data.handle || '',
        ldhName: data.ldhName || domainOrIp,
        registrar,
        createdDate: registrationEvent ? registrationEvent.eventDate : null,
        expiresDate: expirationEvent ? expirationEvent.eventDate : null,
        updatedDate: lastChangedEvent ? lastChangedEvent.eventDate : null,
        nameServers,
        status: statuses,
        rawRdap: data,
      });
    } catch (err: any) {
      res.status(500).json({
        error: `WHOIS/RDAP Query failed: ${err.message || 'Network timeout'}`,
        query: domainOrIp,
      });
    }
  });

  // Vite middleware for dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
