# Scan — Analyze beta

Only Analyze is implemented. It performs one vision request and does not create
scan/recovery rows, grant points, or execute Verify. There are no new DB tables.

Set these variables in `apps/back/.env.local` (ignored by Git) and restart the backend:

```dotenv
OPENAI_API_KEY=your_real_key
OPENAI_SCAN_MODEL=gpt-4.1-mini
```

The module uses the OpenAI Responses HTTP API and strict Structured Outputs.
There are no new dependencies. Model selection is configurable; the selected
model must support image input and strict JSON Schema output. The API key stays
in the backend. Missing configuration affects only Analyze (503).

## Request

`POST /api/v1/scan/analyze`, with a login **access** token in `Authorization: Bearer ...`.
Send `multipart/form-data` with one image named `file`. JPEG, PNG, WEBP up to 5 MB
are accepted; the file content is checked, not only its name or MIME declaration.
Files are held in memory, not saved to disk or the DB. The image is sent to OpenAI
as a base64 data URL with `store: false`. This setting is not a promise of zero
provider retention. No real model request is made by the automated tests.

Example using a local photo (replace token and file path):

```powershell
curl.exe http://localhost:3000/api/v1/scan/analyze -H "Authorization: Bearer YOUR_ACCESS_TOKEN" -F "file=@C:/photos/bottle.jpg"
```

There is also `scan.http` for HTTP clients.

## Response

The existing global interceptor wraps the output:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "materiales": ["2 botellas plásticas; resina no confirmada"],
    "preparacion": ["1. Vacía los envases.", "2. Enjuaga y deja secar."],
    "impacto_inmediato": [
      "Recuperar estos materiales puede reducir la necesidad de plástico virgen."
    ],
    "daño_ambiental": [
      "Si se desechan en el entorno, pueden afectar la fauna."
    ],
    "peso_estimado": 0.045
  }
}
```

`peso_estimado` is an approximate dry/empty weight in **kg**, not actual measured
recycled weight. It does not update `recovery.recycled_kg` or medail progress.
`preparacion` is numbered by the backend. Field names deliberately use
`impacto_inmediato`, `daño_ambiental` and the corrected spelling `peso_estimado`.

No identifiable plastic (including ambiguous/blurry images) returns **422**, with
an explanatory `message` and the usual `path`/`timestamp` from the global filter.
Other errors: 400 missing/invalid image; 401 missing/invalid access token;
413 image too large; 502 malformed/incomplete/inconsistent AI response;
503 missing key/provider authorization/quota; 504 timeout (30 seconds).
Provider error bodies and credentials are not returned to the client. This beta
does not automatically retry or call Analyze again; that belongs to the future Verify flow.

## Refining the beta

Edit `prompts/analyze.prompt.ts` and increment `ANALYZE_PROMPT_VERSION` when
changing instructions. The structural contract is in `schemas/analyze.schema.ts`
and runtime output validation is in `dto/analyze-output.dto.ts`.
The private model envelope has `es_plastico` and `motivo_invalido`, which are used
to reject invalid images and are not returned as successful analysis fields.

Official references:

- https://developers.openai.com/api/docs/guides/images-vision
- https://developers.openai.com/api/docs/guides/structured-outputs
