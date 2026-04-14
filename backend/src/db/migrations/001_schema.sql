CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  city TEXT,
  capacity INT,
  status TEXT,
  opens_at TIME,
  closes_at TIME
);

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id),
  name TEXT,
  email TEXT,
  phone TEXT,
  plan_type TEXT,
  member_type TEXT,
  status TEXT,
  joined_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  last_checkin_at TIMESTAMPTZ
);

CREATE TABLE checkins (
  id SERIAL PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  gym_id UUID REFERENCES gyms(id),
  checked_in TIMESTAMPTZ,
  checked_out TIMESTAMPTZ
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  gym_id UUID REFERENCES gyms(id),
  amount NUMERIC,
  plan_type TEXT,
  payment_type TEXT,
  paid_at TIMESTAMPTZ
);

CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id),
  type TEXT,
  severity TEXT,
  message TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);