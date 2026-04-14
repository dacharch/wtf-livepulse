DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM gyms) THEN
    RAISE NOTICE 'Seed already exists';
    RETURN;
  END IF;
END $$;


-- ✅ GYMS
INSERT INTO gyms (name, city, capacity, status, opens_at, closes_at) VALUES
('WTF Gyms — Lajpat Nagar','New Delhi',220,'active','05:30','22:30'),
('WTF Gyms — Connaught Place','New Delhi',180,'active','06:00','22:00'),
('WTF Gyms — Bandra West','Mumbai',300,'active','05:00','23:00'),
('WTF Gyms — Powai','Mumbai',250,'active','05:30','22:30'),
('WTF Gyms — Indiranagar','Bengaluru',200,'active','05:30','22:00'),
('WTF Gyms — Koramangala','Bengaluru',180,'active','06:00','22:00'),
('WTF Gyms — Banjara Hills','Hyderabad',160,'active','06:00','22:00'),
('WTF Gyms — Sector 18 Noida','Noida',140,'active','06:00','21:30'),
('WTF Gyms — Salt Lake','Kolkata',120,'active','06:00','21:00'),
('WTF Gyms — Velachery','Chennai',110,'active','06:00','21:00');


-- ✅ MEMBERS (5000)
INSERT INTO members (gym_id, name, email, phone, plan_type, member_type, status, joined_at, plan_expires_at)
SELECT 
  (SELECT id FROM gyms ORDER BY random() LIMIT 1),
  'User ' || gs,
  'user'||gs||'@gmail.com',
  '9'||floor(random()*1000000000),
  (ARRAY['monthly','quarterly','annual'])[floor(random()*3)+1],
  'new',
  'active',
  NOW() - (random() * INTERVAL '90 days'),
  NOW() + INTERVAL '30 days'
FROM generate_series(1,5000) gs;


-- ✅ CHECKINS (~250k)
INSERT INTO checkins (member_id, gym_id, checked_in, checked_out)
SELECT
  m.id,
  m.gym_id,
  NOW() - (random() * INTERVAL '90 days'),
  CASE 
    WHEN random() < 0.9 
    THEN NOW() - (random() * INTERVAL '90 days') + (INTERVAL '45 minutes' + random() * INTERVAL '45 minutes')
    ELSE NULL  -- 🔥 some people still inside gym
  END
FROM members m
JOIN generate_series(1, 50) gs ON true;

UPDATE checkins
SET checked_out = NULL
WHERE id IN (
  SELECT id FROM checkins
  ORDER BY RANDOM()
  LIMIT 200
);


-- ✅ PAYMENTS
-- 🔥 ADD TODAY PAYMENTS (FOR DASHBOARD)
INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at)
SELECT
  id,
  gym_id,
  CASE 
    WHEN plan_type='monthly' THEN 1499
    WHEN plan_type='quarterly' THEN 3999
    ELSE 11999
  END,
  plan_type,
  'new',
  NOW()
FROM members
ORDER BY RANDOM()
LIMIT 300;


-- ✅ ANOMALIES
INSERT INTO anomalies (gym_id, type, severity, message)
SELECT id, 'capacity_breach','critical','Over capacity'
FROM gyms WHERE name ILIKE '%Bandra%';

INSERT INTO anomalies (gym_id, type, severity, message)
SELECT id, 'zero_checkins','warning','No activity'
FROM gyms WHERE name ILIKE '%Velachery%';

INSERT INTO anomalies (gym_id, type, severity, message)
SELECT id, 'revenue_drop','warning','Revenue dropped'
FROM gyms WHERE name ILIKE '%Salt Lake%';