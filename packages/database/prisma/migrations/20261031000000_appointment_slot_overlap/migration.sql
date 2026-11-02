CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "appointment_slot_start_before_end"
  CHECK ("slotStartTime" < "slotEndTime");

-- Half-open ranges allow adjacent appointments while rejecting any active overlap.
-- Expired holds must be transitioned out of PENDING_PAYMENT by the reservation worker.
ALTER TABLE "Appointment"
  ADD CONSTRAINT "appointment_no_overlapping_active_slots"
  EXCLUDE USING gist (
    "doctorId" WITH =,
    tstzrange("slotStartTime", "slotEndTime", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'));