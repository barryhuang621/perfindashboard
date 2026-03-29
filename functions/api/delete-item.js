/**
 * GET /api/delete-item?id=123
 * Isolated deletion endpoint for troubleshooting.
 */
export async function onRequestGet(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const id = searchParams.get('id');
    
    console.log(`📡 ISOLATED DELETE: Received ID [${id}]`);

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const numericId = Number(id);
    const result = await context.env.DB.prepare(
      'DELETE FROM asset_record WHERE id = ?'
    ).bind(numericId).run();

    console.log(`✅ ISOLATED DELETE Success: ID [${numericId}] Changes [${result.meta.changes}]`);

    return new Response(JSON.stringify({ 
      success: true, 
      changes: result.meta.changes,
      id: numericId
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
    });
  } catch (err) {
    console.error(`❌ ISOLATED DELETE Error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
