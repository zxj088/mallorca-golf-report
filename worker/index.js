const schemaSql = `
  CREATE TABLE IF NOT EXISTS candidate_states (
    candidate_id TEXT PRIMARY KEY,
    state TEXT NOT NULL CHECK (state IN ('verified', 'deleted')),
    updated_at TEXT NOT NULL
  )
`;

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

async function ensureSchema(db) {
  await db.prepare(schemaSql).run();
}

async function readStates(db) {
  await ensureSchema(db);
  const result = await db
    .prepare("SELECT candidate_id, state FROM candidate_states")
    .all();
  return Object.fromEntries(
    (result.results || []).map((row) => [row.candidate_id, row.state]),
  );
}

async function writeState(request, db) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_json" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const candidateId = String(payload.candidateId || "");
  const action = String(payload.action || "");
  const code = String(payload.code || "");
  if (code !== "56") {
    return new Response(
      JSON.stringify({ error: "invalid_code" }),
      { status: 403, headers: jsonHeaders },
    );
  }
  if (!/^[a-z0-9-]{3,100}$/.test(candidateId)) {
    return new Response(
      JSON.stringify({ error: "invalid_candidate" }),
      { status: 400, headers: jsonHeaders },
    );
  }
  if (action !== "verified" && action !== "deleted") {
    return new Response(
      JSON.stringify({ error: "invalid_action" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  await ensureSchema(db);
  await db
    .prepare(
      `INSERT INTO candidate_states (candidate_id, state, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(candidate_id) DO UPDATE SET
         state = excluded.state,
         updated_at = excluded.updated_at`,
    )
    .bind(candidateId, action, new Date().toISOString())
    .run();

  return new Response(
    JSON.stringify({ ok: true, candidateId, state: action }),
    { headers: jsonHeaders },
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/candidate-states") {
      if (!env.DB) {
        return new Response(
          JSON.stringify({ error: "database_unavailable" }),
          { status: 503, headers: jsonHeaders },
        );
      }
      if (request.method === "GET") {
        const states = await readStates(env.DB);
        return new Response(JSON.stringify({ states }), {
          headers: jsonHeaders,
        });
      }
      if (request.method === "POST") {
        return writeState(request, env.DB);
      }
      return new Response(
        JSON.stringify({ error: "method_not_allowed" }),
        { status: 405, headers: jsonHeaders },
      );
    }

    if (url.pathname === "/") {
      url.pathname = "/index.html";
      request = new Request(url, request);
    }
    return env.ASSETS.fetch(request);
  },
};
