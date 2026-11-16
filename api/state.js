import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const key = process.env.AGENDA_KEY;
  if (!key || req.headers['x-agenda-key'] !== key) {
    return res.status(401).json({ error: 'no autorizado' });
  }
  const sql = neon(process.env.DATABASE_URL);
  try {
    if (req.method === 'GET') {
      const r = await sql`select data, updated_at from agenda_state where id = 'main'`;
      return res.status(200).json(r[0] || { data: null });
    }
    if (req.method === 'PUT') {
      const d = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!d || !Array.isArray(d.ev)) return res.status(400).json({ error: 'datos no válidos' });
      await sql`insert into agenda_state (id, data, updated_at) values ('main', ${JSON.stringify(d)}::jsonb, now())
                on conflict (id) do update set data = excluded.data, updated_at = now()`;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'método no permitido' });
  } catch (e) {
    return res.status(500).json({ error: 'error de base de datos' });
  }
}
