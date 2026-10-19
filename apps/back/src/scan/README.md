# Scan — Analyze beta

## Achieved: collection completion (beta)

The agent's Accepted tab opens a camera modal. Capture calls
`POST /api/v1/scan/achieved` with multipart fields `file` and `recovery_id`, using
the assigned agent's access token. The same image limits as Analyze apply.
The request checks the assignment and ASSIGNED status before calling Gemini.

Editable visual policy: `prompts/achieved.prompt.ts`. It accepts identifiable
recyclables (plastic, paper/cardboard, glass or metal) grouped for collection;
unclear or invalid evidence returns HTTP 422. It does not prove a physical
handover, location or measured weight, and does not detect photo reuse.

Success returns `is_valid: true`, `reason_invalid: null`, `materials` and a
`verification_token`. This signed receipt is bound to the recovery and agent,
expires after ten minutes and becomes invalid on backend restart. The current
receipt key lives in one backend process; multiple replicas require a shared
signing key before deployment.

Then `PATCH /api/v1/recovery/:id/complete` accepts
`{ "verification_token": "..." }`. Only the assigned agent can transition an
ASSIGNED recovery to COMPLETED. A conditional update prevents concurrent cancel
and complete operations from both succeeding. Repeating completion of an already
completed recovery by that agent returns its data without another event.
The completion listener saves a notification for the citizen and publishes it
through SSE. No additional points or measured kilograms are credited by this flow.

The modal retains a successful receipt if completion fails, allowing a retry
without another Gemini call. Taking another photo discards the receipt.
Manual requests: `achieved.http`. To check the full UI, open an assigned recovery
in the agent's Accepted tab, complete it with a photo, and inspect the citizen's
notification and the recovery detail showing COMPLETED. Also try an unclear photo
and confirm the recovery remains ASSIGNED.

Analyze and Verify are implemented. The frontend calls Analyze, then Verify with
the same image and analysis before showing the result. Neither endpoint creates
scan/recovery rows or credits the user's balance. There are no new DB tables.

## Verify and points (beta)

`POST /api/v1/scan/verify` accepts authenticated multipart fields `file` (the original
image) and `analysis` (JSON string containing Analyze's five public fields).
All fields are checked again against the image; client-supplied points are rejected.
On a mismatch it calls Analyze once with discrepancy feedback, then Verify again.
A second mismatch returns HTTP 422 asking for a clearer photo. Provider errors
are propagated without retries. This means at most three Gemini calls per Verify
request (four including the initial Analyze request).

Success returns exactly the five Analyze fields plus `eco_points`.
Points are provisional because weight is visually
estimated; no account or measured recovery weight is changed.

Editable policy: `scan-points.ts`. The Verify prompt reads these same constants.
Rates in points/kg: PET 50, HDPE/PEAD 60,
PP 45, LDPE/PEBD 35, PVC/PS/OTHER/UNKNOWN 20. Only a legible resin code confirms
the material; otherwise UNKNOWN applies. Each visible cap adds 2 points and each
visible label adds 1. These bonuses represent additional recovered components,
not instructions to leave them attached; follow the collector's separation rules.
Weight includes these components once. Total base points are rounded down after summing, then multiplied by 2.
Example: 0.045 kg PET + 2 visible caps + 1 visible label = 2 * floor(2.25 + 4 + 1) = 14.

Prompts: `prompts/analyze.prompt.ts` and `prompts/verify.prompt.ts`.
Verify checks consistency using the same vision model; it is not proof of physical
weight or a guarantee against image reuse. Balance crediting belongs to a later,
authenticated collection completion flow with measured weight and deduplication.

Set these variables in `apps/back/.env.local` (ignored by Git) and restart the backend:

```dotenv
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_SCAN_MODEL=gemini-3.5-flash-lite
```

Create a key in https://aistudio.google.com/apikey using a project on the Free
tier. The module uses Gemini's `generateContent` REST API, a JSON Schema response
format, and runtime validation. There are no new dependencies. The API key stays
in the backend. Missing configuration affects Analyze and Verify (503).

The REST request uses `generationConfig.responseMimeType: "application/json"`
and `generationConfig.responseJsonSchema`. Do not replace these with
`responseFormat.text.mimeType: "application/json"`: the endpoint rejects that
value in the newer enum-based field. The compatibility fields were verified
against the real Gemini endpoint with a minimal PNG.

The default model supports image input and structured output and is listed with
a Free tier. Gemini 2.5 access is restricted for new projects, so it is not the
default. Model selection remains configurable. Actual quotas and tier are managed
by Google for the project; there is no request parameter that forces free billing.
Use a Free-tier project without enabling paid billing if you want no API charges.
The service does not upgrade the project, use paid fallback models, retry failed
requests automatically, or fall back to OpenAI.

## Request

`POST /api/v1/scan/analyze`, with a login **access** token in `Authorization: Bearer ...`.
Send `multipart/form-data` with one image named `file`. JPEG, PNG, WEBP up to 5 MB
are accepted; the file content is checked, not only its name or MIME declaration.
Files are held in memory, not saved to disk or the DB. The image is sent to Gemini
as base64 `inlineData`. Google's Free tier can use submitted content to improve
its products; review the provider terms before sending personal photos.
No real model request is made by the automated tests.

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
    "materials": ["2 botellas plásticas; resina no confirmada"],
    "preparation": ["1. Vacía los envases.", "2. Enjuaga y deja secar."],
    "impact": [
      "Recuperar estos materiales puede reducir la necesidad de plástico virgen."
    ],
    "environmental_damage": [
      "Si se desechan en el entorno, pueden afectar la fauna."
    ],
    "weight_estimate": 0.045
  }
}
```

`weight_estimate` is an approximate dry/empty weight in **kg**, not actual measured
recycled weight. It does not update `recovery.recycled_kg` or medail progress.
`preparation` is numbered by the backend. Field names deliberately use
`impact`, `environmental_damage` and the corrected spelling `weight_estimate`.

No identifiable plastic (including ambiguous/blurry images) returns **422**, with
an explanatory `message` and the usual `path`/`timestamp` from the global filter.
Other errors: 400 missing/invalid image; 401 missing/invalid access token;
413 image too large; 502 malformed/incomplete/inconsistent AI response;
503 missing Gemini key/provider authorization/quota; 504 timeout (30 seconds).
Provider error bodies and credentials are not returned to the client. This beta
does not automatically retry provider failures. Verify only reanalyzes semantic mismatches.

## Refining the beta

Edit `prompts/analyze.prompt.ts` and increment `ANALYZE_PROMPT_VERSION` when
changing instructions. The structural contract is in `schemas/analyze.schema.ts`
and runtime output validation is in `dto/analyze-output.dto.ts`.
The private model envelope has `is_plastic` and `reason_invalid`, which are used
to reject invalid images and are not returned as successful analysis fields.

Official references:

- https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- https://ai.google.dev/gemini-api/docs/image-understanding
- https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
- https://ai.google.dev/gemini-api/docs/pricing
