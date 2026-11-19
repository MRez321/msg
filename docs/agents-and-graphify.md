# AGENTS.md & graphify — fast agent navigation

## 1. How they work together

`AGENTS.md` is the agent orchestrator for this repo. It tells coding agents to:

1. Read `ref/index.md` first, then `ref/serverless-bot/`, `ref/relay/`,
   `ref/guide/`, `ref/human/`, and `ref/agent/`.
2. Check `.agents/` skills and **use the `graphify` skill** to map the codebase
   into a knowledge graph (`graphify-out/`) and query it instead of reading every
   file from scratch.
3. Refresh the graph after code changes (`graphify update`).

`graphify-out/graph.json` is the persistent knowledge graph (nodes = files,
functions, classes, constants; edges = calls, contains, imports). It is generated
by the `graphify` CLI (installed at `~/.local/bin/graphify.exe` on this machine).

## 2. graphify commands agents should use

Run from the repo root (`F:\Dev\msg`).

| Command | Purpose |
|---|---|
| `graphify query "<question>"` | BFS traversal — broad context (default). Use this first for "how does X work?" questions. |
| `graphify query "<question>" --dfs` | DFS — trace a specific call path. |
| `graphify path "NodeA" "NodeB"` | Shortest path between two concepts. |
| `graphify explain "NodeName"` | Plain-language explanation of a node and its neighbors. |
| `graphify update` | Incremental rebuild of only new/changed files. Run after changing `tgcloud/`, `src/`, `.github/`, or `docs/`. |
| `graphify extract . --code-only --no-cluster` | Fast full rebuild of the code graph (no API key needed). |
| `graphify --help` | Full CLI reference. |

Example:
```bash
graphify query "where is the channel adapter defined"
graphify path "TelegramChannelAdapter" "delivery_logs"
graphify explain "tgCall"
graphify update
```

## 3. What gets indexed

Included: source code (`.js`), docs (`.md`), reference guides under `ref/`.

Excluded (never indexed; see `.gitignore`):
- `node_modules/`, build/cache outputs, `dist/`
- `graphify-out/` itself
- lockfiles (`package-lock.json`)
- `.env` / secrets

## 4. Refresh cadence (`[Certain]`)

Run `graphify update` after any change to `tgcloud/`, `src/`, `.github/`, or
`docs/` so the graph stays current for the next agent session. If files were
deleted and the graph must shrink, use `graphify update --force`.

## 5. Query tips

- Prefer `graphify query` over `grep`/`Read` when the answer needs links that
  text search cannot see (doc ↔ code, across files, call paths, communities).
- For a single lookup in an ordinary-sized codebase, a plain `grep`/`Read` is
  faster and free — build/query the graph when you expect many questions against
  the corpus.
- When citing a fact, quote `source_location` from `graph query` / `explain`
  output (e.g. `at=tgcloud/lib/relay.js:L66`).

## 6. Cost & honesty

graphify AST extraction of code needs no API key. Semantic extraction of docs
uses Gemini only if `GEMINI_API_KEY`/`GOOGLE_API_KEY` is set; otherwise it falls
back to the host agent. Never prompt for or block on an API key — code-only
indexing works without one. See `.agents/skills/graphify/SKILL.md` for the full
skill reference (Honesty Rules: never invent an edge; use AMBIGUOUS when unsure).
