/**
 * API: /api/records
 * Description: Manage archived transaction records
 */

export async function onRequestGet({ env }) {
  try {
    const { DB } = env;
    const { results } = await DB.prepare(`
      SELECT * FROM transaction_record 
      ORDER BY transaction_date DESC, id DESC
    `).all();
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });
    }

    const { DB } = env;
    const result = await DB.prepare('DELETE FROM transaction_record WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ success: true, changes: result.meta.changes }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const data = await request.json();
    const { id, field, value } = data;

    if (!id || !field) {
      return new Response(JSON.stringify({ error: 'Missing ID or Field' }), { status: 400 });
    }

    // List of allowed fields to update
    const allowedFields = [
      'owner', 'category', 'sub_category', 'target', 
      'transaction_date', 'account_date', 'info', 
      'withdraw', 'deposit', 'balance', 'transaction_info', 'remark'
    ];
    
    if (!allowedFields.includes(field)) {
      return new Response(JSON.stringify({ error: 'Invalid field' }), { status: 400 });
    }

    const { DB } = env;
    const query = `UPDATE transaction_record SET ${field} = ? WHERE id = ?`;
    const result = await DB.prepare(query).bind(value, id).run();

    return new Response(JSON.stringify({ success: true, changes: result.meta.changes }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
