-- Portfolio branch uses this table instead of `rsvp` so demo submissions
-- from portfolio visitors never mix with real wedding guest data.
CREATE TABLE public.rsvp_portfolio (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attend_or_absent        TEXT NOT NULL CHECK (attend_or_absent IN ('attend', 'absent')),
  number_of_participants  INTEGER,
  name                    TEXT NOT NULL,
  email_address           TEXT NOT NULL,
  age                     INTEGER,
  postcode                TEXT,
  address                 TEXT,
  phone_number            TEXT,
  dietary_restrictions    TEXT,
  message                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rsvp_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.rsvp_portfolio USING (false) WITH CHECK (false);

-- New tables aren't auto-exposed to Data API roles by default (cloud-parity setting) —
-- service_role needs an explicit GRANT even though it bypasses RLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rsvp_portfolio TO service_role;
