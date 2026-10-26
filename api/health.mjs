export default function health(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'method_not_allowed' });
  }
  return response.status(200).json({
    application: 'agent-library',
    catalogueConfigured: Boolean(process.env.VITE_CONVEX_URL || process.env.CONVEX_DEPLOY_KEY),
    database: 'convex',
    version: '0.1.0'
  });
}
