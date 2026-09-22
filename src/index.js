const SERVERS = [
  { ip: '<ip_address_1>', url: 'https://server1.domain.com/health' },
  { ip: '<ip_address_2>', url: 'https://server2.domain.com/health' },
  { ip: '<ip_address_3>', url: 'https://server3.domain.com/health' },
  { ip: '<ip_address_4>', url: 'https://server4.domain.com/health' },
];

const FALLBACK_SERVER = { ip: '<ip_address_circuit_breaker>', url: 'https://serverf.domain.com/health' };

export default {
  async fetch(request, env) {
    const ZONE_ID = env.ZONE_ID;
    const API_TOKEN = env.API_TOKEN;
    const RECORD_NAME = 'lb-ft.domain.com';

    const healthyServers = [];
    console.log("🔍 Starting health checks...");

    // Health Checks
    for (const server of SERVERS) {
      try {
        const resp = await fetch(server.url, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
        if (resp.ok) {
          healthyServers.push(server);
          console.log(`✅ Server ${server.ip} is healthy.`);
        } else {
          console.log(`❌ Server ${server.ip} returned status: ${resp.status}`);
        }
      } catch (e) {
        console.error(`❌ Error connecting to ${server.ip}:`, e.message);
      }
    }


    console.log("Healthy Servers:", healthyServers.map((s) => s.ip));

    const useFallback = healthyServers.length === 0;
    console.log(useFallback ? "⚠️ All primary servers are unhealthy. Using fallback." : "✅ At least one primary server is healthy.");

    const currentRecordsResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${RECORD_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const currentRecords = await currentRecordsResponse.json();
    if (!currentRecords.success) {
      console.error("❌ Failed to list DNS records:", currentRecords.errors);
      return new Response('Failed to list DNS records', { status: 500 });
    }

    const currentARecords = currentRecords.result.filter((r) => r.type === 'A');
    const currentIPs = new Set(currentARecords.map((r) => r.content));
    const desiredIPs = useFallback
      ? new Set([FALLBACK_SERVER.ip])
      : new Set(healthyServers.map((s) => s.ip));

    const toAdd = [...desiredIPs].filter((ip) => !currentIPs.has(ip));
    const toRemove = [...currentIPs].filter((ip) => !desiredIPs.has(ip));

    console.log("➕ Servers to Add:", toAdd);
    console.log("➖ Records to Remove:", toRemove);

    for (const ip of toRemove) {
      const record = currentARecords.find((r) => r.content === ip);
      if (record) {
        const deleteResponse = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${record.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (deleteResponse.ok) {
          console.log(`🗑 Removed DNS record for ${ip}`);
        } else {
          console.error("❌ Failed to remove DNS record:", ip);
        }
      }
    }

    for (const ip of toAdd) {
      const addResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'A',
            name: RECORD_NAME,
            content: ip,
            proxied: false,
            ttl: 60
          }),
        }
      );

      if (addResponse.ok) {
        console.log(`✅ Added DNS record for ${ip}`);
      } else {
        const error = await addResponse.json();
        console.error("❌ Failed to add DNS record for:", ip, error);
      }
    }

    return new Response('Health check and DNS update complete', { status: 200 });
  },
};
