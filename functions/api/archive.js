/**
 * API: /api/archive
 * Method: POST
 * Description: Batch archive transaction records from CSV into D1
 */

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { transactions } = data;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return new Response(JSON.stringify({ success: false, error: '無有效資料可儲存' }), { status: 400 });
    }

    const { DB } = env;

    // Build the query and prepare statements
    // Column count: 12 (owner, category, sub_category, target, date, date2, info, withdraw, deposit, balance, tx_info, remark)
    const stmt = DB.prepare(`
      INSERT INTO transaction_record (
        owner, category, sub_category, target,
        transaction_date, account_date, info,
        withdraw, deposit, balance,
        transaction_info, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT DO NOTHING
    `);

    // Helper to clean numeric strings ("1,234.50" -> 1234.50)
    const cleanNum = (val) => {
      if (!val) return 0;
      const cleaned = String(val).replace(/,/g, '').trim();
      return isNaN(cleaned) || cleaned === '' ? 0 : parseFloat(cleaned);
    };

    const batch = transactions.map(tx => stmt.bind(
      tx.owner,
      tx.category,
      tx.sub_category,
      tx.target,
      tx.transaction_date,
      tx.account_date,
      tx.info,
      cleanNum(tx.withdraw),
      cleanNum(tx.deposit),
      cleanNum(tx.balance),
      tx.transaction_info,
      tx.remark
    ));

    const results = await DB.batch(batch);
    
    // Calculate total changes
    const totalChanges = results.reduce((acc, res) => acc + (res.meta.changes || 0), 0);

    return new Response(JSON.stringify({ 
      success: true, 
      changes: totalChanges,
      total: transactions.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Archive error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
