# Current Decisions

## 2026-05-21 File Understanding

- We tested direct file-understanding with the current `yunwu.ai` account and key.
- `GET /v1/models` works.
- `POST /v1/files` is not currently usable for this account/channel combination.
- Decision:
  skip direct model-side file understanding for now.
- Current implementation path:
  `frontend upload -> server-side text extraction -> chat model analysis`
- Future option:
  if upstream file support becomes stable later, remove the parsing layer and switch to direct file handoff.
