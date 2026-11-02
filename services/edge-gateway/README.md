# Edge Gateway

The gateway accepts HL7 v2 over MLLP (TCP 2575 by default) or the internal REST endpoint `POST /edge/sync-trigger` (HTTP 8080). REST requests may contain raw HL7 text or JSON with a non-empty `hl7` property. Accepted messages are persisted before the gateway returns an MLLP `AA` acknowledgment or HTTP `202`.

Supported message content:

- ADT messages with a PID segment become FHIR Patient resources.
- ORU messages with OBR/OBX segments become DiagnosticReport and Observation resources.
- SIU messages with SCH segments become Appointment resources.

The converter maps recognized laboratory aliases to LOINC and preserves unrecognized codes in a hospital-local code system. CCCD values are taken from PID-19 or a PID-3 CX identifier explicitly typed as CCCD; an untyped first PID-3 identifier is treated as CCCD. Hospital-specific code tables and field conventions should be confirmed before production use.

## Configuration

`CENTRAL_API_URL` and `HOSPITAL_CODE` are required. The gateway posts transaction bundles to `/api/v1/fhir/bundle` and heartbeats every 30 seconds to `/api/v1/edge/heartbeat`. The local spool and JSON logs are stored under `SPOOL_DIR` and `LOG_FILE`.

For mutual TLS, set `CLIENT_CERT_PATH` to a PEM certificate file and `CLIENT_KEY_PATH` to its private key file. If the certificate and key are combined in one PEM, both variables may point to that file. The Compose file mounts `services/edge-gateway/certs` read-only at `/run/secrets`; use those container paths in the environment.

Run `docker compose -f services/edge-gateway/docker-compose.yml up --build` from the repository root after setting `CENTRAL_API_URL` and `HOSPITAL_CODE`. The named `edge-gateway-data` volume preserves pending messages and logs across container restarts.

For local development, run `npm run build --workspace @healthcare/edge-gateway`, then start with `CENTRAL_API_URL`, `HOSPITAL_CODE`, and optionally `PORT`, `MLLP_PORT`, `SPOOL_DIR`, and `LOG_FILE` configured. Set `MLLP_PORT=0` to disable the TCP listener.
