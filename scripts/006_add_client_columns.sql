-- Adds the "Already a Client" flag and timestamp to coffee_leads.
-- Safe to run multiple times.

ALTER TABLE coffee_leads
  ADD COLUMN IF NOT EXISTS is_existing_client boolean NOT NULL DEFAULT false;

ALTER TABLE coffee_leads
  ADD COLUMN IF NOT EXISTS became_client_at timestamptz;

-- Helpful for "Clients" filter & sort-to-top.
CREATE INDEX IF NOT EXISTS coffee_leads_is_existing_client_idx
  ON coffee_leads (is_existing_client)
  WHERE is_existing_client = true;

-- Backfill: any lead already at acquired stage is implicitly a client.
UPDATE coffee_leads
SET
  is_existing_client = true,
  became_client_at = COALESCE(became_client_at, last_contacted_at, NOW())
WHERE contact_stage = 'acquired'
  AND is_existing_client = false;
