import { env } from "cloudflare:workers";

const schemaSql = `
  CREATE TABLE IF NOT EXISTS candidate_states (
    candidate_id TEXT PRIMARY KEY,
    state TEXT NOT NULL CHECK (state IN ('verified', 'deleted')),
    updated_at TEXT NOT NULL
  )
`;

async function ensureSchema() {
  await env.DB.prepare(schemaSql).run();
}

export async function GET() {
  await ensureSchema();
  const result = await env.DB
    .prepare("SELECT candidate_id, state FROM candidate_states")
    .all<{ candidate_id: string; state: string }>();
  return Response.json(
    {
      states: Object.fromEntries(
        result.results.map((row) => [row.candidate_id, row.state]),
      ),
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    candidateId?: string;
    action?: string;
    code?: string;
  };
  const candidateId = String(payload.candidateId || "");
  const action = String(payload.action || "");

  if (String(payload.code || "") !== "56") {
    return Response.json({ error: "invalid_code" }, { status: 403 });
  }
  if (!/^[a-z0-9-]{3,100}$/.test(candidateId)) {
    return Response.json({ error: "invalid_candidate" }, { status: 400 });
  }
  if (action !== "verified" && action !== "deleted") {
    return Response.json({ error: "invalid_action" }, { status: 400 });
  }

  await ensureSchema();
  await env.DB
    .prepare(
      `INSERT INTO candidate_states (candidate_id, state, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(candidate_id) DO UPDATE SET
         state = excluded.state,
         updated_at = excluded.updated_at`,
    )
    .bind(candidateId, action, new Date().toISOString())
    .run();

  return Response.json({ ok: true, candidateId, state: action });
}
