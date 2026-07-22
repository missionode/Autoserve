const endpoints = [
  ['web', 'http://localhost:3000/health'],
  ['api', 'http://localhost:3001/api/v1/health'],
  ['worker', 'http://localhost:3002/health'],
  ['provider-stub', 'http://localhost:8089/health'],
  ['object-storage', 'http://localhost:9000/minio/health/live'],
];

for (const [name, endpoint] of endpoints) {
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`${name} health failed with ${response.status}`);
  console.log(`${name}: healthy`);
}
