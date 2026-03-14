/**
 * GET /api/health
 * Health check endpoint — also verifies D1 binding is available.
 */
export async function onRequestGet(context) {
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  // Check D1 binding
  if (context.env.DB) {
    try {
      const result = await context.env.DB.prepare('SELECT 1 AS alive').first();
      response.database = result?.alive === 1 ? 'connected' : 'error';
    } catch (err) {
      response.database = 'error';
      response.dbError = err.message;
    }
  } else {
    response.database = 'not bound';
  }

  return new Response(JSON.stringify(response, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
