# RetinaCare API (NestJS)

Backend for the Diabetic Retinopathy Detection System. It implements the API in
`design/_API_.txt` against the requirements in `DR_Requirements_Acceptance_Criteria`.
The AI step is behind a client (`AiService`) so the backend works today without the model.

## Run

```bash
npm install
cp .env.example .env.development   # fill in the secrets
npm run start:dev                  # http://localhost:9090
```

Swagger UI: `http://localhost:9090/api/docs` (JSON: `/api/docs-json`).
Every response is wrapped as `{ "message": "request accepted", "data": ... }`.

Requires MongoDB and Redis. Tests: `npm test` (unit), `NODE_ENV=test npm run test:e2e`
(needs Mongo + Redis from `.env.test`).

## AI modes (`AI_MODE`)

| Mode | Behaviour |
|---|---|
| `disabled` (default) | Image is stored, analysis is created and marked **failed** with "AI detection service is not available yet". It can be retried later with `POST /analyses/:id/retry`. |
| `mock` | Deterministic fake grade per image, flagged `isMock: true` everywhere and "DEMO RESULT" in PDFs. For UI demos only. |
| `remote` | Sends the original image to the FastAPI service at `AI_SERVICE_URL`. |

### Contract for the FastAPI service in `/core`

```
POST /predict        multipart/form-data, field "file" (JPEG/PNG, unmodified)
200 {
  "stage1": { "has_dr": true, "confidence": 0.93 },
  "stage2": { "level": 3, "confidence": 0.81, "probabilities": [0.02,0.05,0.12,0.81,0.0] } | null,
  "grad_cam_png_base64": "<base64 PNG overlay>" | null,
  "model_version": "effnet-b3-ensemble-v4"
}
422 { "detail": "Not a fundus image" }     -> analysis fails with that message (NFR6)
GET /health          200 when the model is loaded
GET /model-info      any JSON
```
Preprocessing (resize, crop, CLAHE), TTA and Grad-CAM run inside the AI service (FR3.3–FR3.7).
Optional header `x-api-key` is sent when `AI_SERVICE_API_KEY` is set.

## Roles and access rules

- **patient**: only their own data; sees reports only after the doctor sends them.
- **doctor**: only patients with an *active* assignment (`doctor-patient`).
- **admin**: everything; first admin is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- No token → 401, wrong role or not assigned → 403 (NFR10).

Images, Grad-CAM overlays and avatars are AES-256-GCM encrypted on disk (`STORAGE_DIR`) and are
returned either through authenticated routes or short-lived **signed URLs**
(`/api/v1/files/:kind/:id?exp&sig`) that the API puts in `fileUrl` / `gradCamUrl` / `avatarUrl`
so `<img>` tags work (NFR9).

## Endpoints

All under `/api/v1`. (Auth is also mounted at `/authentication` for the old client.)

| Area | Endpoints | Requirements |
|---|---|---|
| Auth | `POST auth/signup` (role `patient`/`doctor`, doctors send `clinicName`, `clinicAddress`; `acceptTerms`), `login`, `google`, `verify-email`, `resend-verification`, `refresh-token`, `logout`, `forgot-password`, `reset-password`, `PATCH change-password`, `GET me` | FR1.1–FR1.5, NFR8, NFR11 |
| Users | `GET/PATCH/DELETE users/me`, `PATCH/DELETE users/me/avatar`, `GET users/:id`, `GET users/:id/avatar` | FR1.5 |
| Doctors | `GET/PATCH doctors/me`, `GET doctors/me/dashboard`, `GET doctors?search&city&specialty`, `GET doctors/:id`, `GET doctors/:id/patients?search`, `GET doctors/:id/appointments` | FR2 |
| Patients | `POST patients` (doctor creates + invites), `GET patients?search=` (name, email, `P-XXXXXX` ID, user id), `GET/PATCH patients/me`, `GET/PATCH patients/:id`, `GET patients/:id/doctors`, `/analyses`, `/reports`, `/history` | FR2.1–FR2.5 |
| Assignment | `POST doctor-patient` (doctor: `patientId`/`patientEmail` → active; patient: `doctorId` → pending), `GET`, `GET/PATCH/DELETE doctor-patient/:id` | FR2.3 |
| Fundus images | `POST fundus-images` (multipart `file`, `patientId`, `eye`, `analyze`=true), `GET`, `GET :id`, `GET :id/file`, `PATCH`, `DELETE` | FR3.1, FR3.2, NFR18 |
| Analyses | `POST analyses`, `POST :id/predict`, `POST :id/retry`, `GET`, `GET :id`, `GET :id/result`, `GET :id/grad-cam`, `GET :id/history`, `DELETE` | FR3.2–FR3.7, FR4.1, FR4.2 |
| Doctor reviews | `POST/GET doctor-reviews`, `GET/PATCH/DELETE :id` (confirmed grade, notes, recommendations, follow-up) | — |
| Reports | `POST reports`, `GET`, `GET :id`, `GET :id/pdf`, `PATCH`, `DELETE`, `POST :id/send` | FR4.3–FR4.6, NFR19 |
| Appointments | `POST appointments` (`slotId`, or `doctorId`+`scheduledAt`), `GET`, `GET :id`, `PATCH :id` (reschedule), `PATCH :id/confirm`, `/cancel`, `/complete` | FR5.1, FR5.2 |
| Availability | `POST doctor-availability` (`startAt`, `endAt`, optional `slotMinutes`), `GET ?doctorId`, `GET/PATCH/DELETE :id` | FR5.1 |
| Chat | `POST/GET conversations`, `GET :id`, `GET/POST :id/messages`, `PATCH :id/read`, `DELETE :id` + Socket.IO | FR6.1 |
| Notifications | `GET notifications?unread&type`, `GET :id`, `PATCH :id/read`, `PATCH read-all`, `DELETE :id`, `DELETE` | FR4.4, FR4.6, FR5.2 |
| Hardware | Doctor: `hardware/devices` CRUD + `:id/rotate-key`, `hardware/capture-sessions` CRUD. Device (header `x-device-key`): `POST hardware/device/heartbeat`, `GET hardware/device/capture-sessions`, `POST .../:id/image`, `POST .../:id/fail` | FR7.1 |
| Admin | `GET admin/dashboard`, `admin/users` (+ `/:id`, `/:id/status`, `/:id/role`, `DELETE`), `admin/analyses`, `admin/reports` | — |
| System | `GET health`, `GET ai/health`, `GET ai/model-info`, `GET files/:kind/:id` (signed) | NFR5, NFR15 |

### Socket.IO

Connect to the API origin with `io(API_URL, { auth: { token: accessToken } })`.

| Event | Direction | Payload |
|---|---|---|
| `join_conversation` / `leave_conversation` | client → server | `{ conversationId }` (ack `{ ok, data \| error }`) |
| `send_message` | client → server | `{ conversationId, message }` |
| `typing` | both | `{ conversationId, isTyping }` |
| `mark_read` | client → server | `{ conversationId }` |
| `receive_message`, `message_read`, `conversation_updated` | server → client | message / read info |
| `notification` | server → client | a new notification (every user joins their own room) |
| `capture_session_updated` | server → doctor | fundus camera upload/failure |

## Not done yet

- Real AI predictions (waiting for the model in `/core`).
- Load/uptime testing (NFR1, NFR2, NFR5) and usability testing (NFR12) are measurements to run on a deployed build.
- HTTPS/TLS termination (NFR9) belongs to the deployment (reverse proxy).
