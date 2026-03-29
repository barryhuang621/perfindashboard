/**
 * POST /api/assets
 * Saves a new asset record to the D1 database.
 */
export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const { category, subCategory, target } = data;

    if (!category || !subCategory || !target) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert into D1. Using INSERT OR IGNORE to handle the unique constraint silently.
    // Or we can use INSERT and return an error if it fails (user preferred not to write if exists).
    const statement = context.env.DB.prepare(
      'INSERT OR IGNORE INTO asset_record (category, sub_category, target) VALUES (?, ?, ?)'
    );
    
    const result = await statement.bind(category, subCategory, target).run();

    return new Response(JSON.stringify({ 
      success: true, 
      changes: result.meta.changes 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/assets
 * Lists all asset records.
 */
export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM asset_record ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
