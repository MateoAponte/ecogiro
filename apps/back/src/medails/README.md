# Rewards and medails

`GET /api/v1/rewards` returns the shared reward catalog. A reward has `name`,
`description` and `required_points` (a nonnegative integer). It has no owner and does not
deduct points. The frontend compares `required_points` with the user's `eco_points`.

`GET /api/v1/medails` returns the shared medail catalog. A medail has `name`,
`description`, `condition_type` and `condition_value` (a positive integer).
Supported conditions are `ECO_POINTS`, `COMPLETED_RECOVERIES` and `RECYCLED_KG`.
Recovery count and recycled kilograms include only recoveries whose status is
`COMPLETED` and which belong to that user. Condition thresholds are positive
integers (whole kilograms for `RECYCLED_KG`).
Both catalogs support POST, GET /:id, PATCH /:id and DELETE /:id.

Store actual weight in `recovery.recycled_kg` (nonnegative kilograms, up to three
decimal places, default 0). It can be supplied on creation or through
`PATCH /api/v1/recovery/:id`, including together with `status: 5` (`COMPLETED`).
`GET /api/v1/user/:user_id/recycling-stats` returns `completed_recoveries` and
`recycled_kg`. These totals are calculated from recoveries, not duplicated on
the user table, so edits and cancellations affect the totals immediately.

`GET /api/v1/user/:user_id/medails` evaluates current conditions, persists newly
earned medails, and returns the user's assignments with medail details and
`earned_at`. `POST /api/v1/user/:user_id/medails/evaluate` explicitly performs
the same reconciliation. New catalog definitions are picked up on the next
request; no frontend code changes or manual assignments are required. Evaluation
is request-driven, not a background task or an event listener.

Assignments are unique per user and medail, including concurrent requests.
Earned medails remain earned if eco points drop or the condition changes. Deleting
a catalog medail deletes its assignments; deleting a user deletes their assignments.
No user entity or credentials are included in assignment responses.

The development database is empty and uses `synchronize: true` in `AppModule`.
Restart the backend to synchronize tables and relations with the entities.
No manual migration or seed data is required.
