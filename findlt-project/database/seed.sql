-- ====================================================================
-- FINDLT: SAMPLE DATABASE SEED SCRIPT
-- Seeds realistic categories, campus profiles, lost & found items,
-- claims, and handover logs for college testing.
-- ====================================================================

-- 1. Insert Categories
INSERT INTO item_categories (id, category_name, description, is_active)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Electronics', 'Laptops, mobile phones, chargers, smartwatches, calculators', true),
  ('c2222222-2222-2222-2222-222222222222', 'Documents', 'Student ID cards, driving licenses, certificates, folders', true),
  ('c3333333-3333-3333-3333-333333333333', 'Accessories', 'Headphones, watches, wallets, spectacles, jewelry', true),
  ('c4444444-4444-4444-4444-444444444444', 'Bags', 'Backpacks, shoulder bags, pouches, gym bags', true),
  ('c5555555-5555-5555-5555-555555555555', 'Books & Stationery', 'College textbooks, class notebooks, lab manuals', true),
  ('c6666666-6666-6666-6666-666666666666', 'Clothing', 'Jackets, varsity hoodies, scarves, college sports jerseys', true),
  ('c7777777-7777-7777-7777-777777777777', 'Keys', 'Dormitory keys, vehicle key fobs, locker keys', true),
  ('c8888888-8888-8888-8888-888888888888', 'Other', 'Water bottles, umbrella, sports gear, musical instruments', true)
ON CONFLICT (category_name) DO NOTHING;

-- 2. Insert Profiles
INSERT INTO profiles (id, full_name, campus_id, email, phone, department, course, semester, role, account_status, password_hash)
VALUES
  (
    'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Dr. Arthur Pendelton',
    'ADM-8801',
    'admin@campus.edu',
    '+1 (555) 234-5678',
    'Campus Safety & Administration',
    'Operations',
    'Staff',
    'admin',
    'active',
    'scrypt:32768:8:1$7W3KzQeBqUa4FjXo$b4697ffbc0cb99dd4f808fc59d28c946f8ebaa4e8e19e7931f82f281e8eb9c66e2c918eeffc5faee08d3e86c04fdf89b91484ff2f1ec5648f58b736b0be6ce3a'
  ),
  (
    'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Alex Johnson',
    'CS-2024-042',
    'alex.j@campus.edu',
    '+1 (555) 345-6789',
    'Computer Science & Engineering',
    'BCA',
    '6th Semester',
    'student',
    'active',
    'scrypt:32768:8:1$a1B2c3D4e5F6g7H8$3b2f5ec379deae336cf93874b942bc239bc7a61d02bf86018151ff3ee67bfce50e41f71dfbc5a7c293755480434316ae5a21fa2e022fe6004bdfa5e5527be177'
  ),
  (
    'c3333333-cccc-cccc-cccc-cccccccccccc',
    'Sarah Miller',
    'CS-2024-118',
    'sarah.m@campus.edu',
    '+1 (555) 456-7890',
    'Information Technology',
    'BCA',
    '4th Semester',
    'student',
    'active',
    'scrypt:32768:8:1$a1B2c3D4e5F6g7H8$3b2f5ec379deae336cf93874b942bc239bc7a61d02bf86018151ff3ee67bfce50e41f71dfbc5a7c293755480434316ae5a21fa2e022fe6004bdfa5e5527be177'
  )
ON CONFLICT (email) DO NOTHING;


-- 3. Insert Items
INSERT INTO items (id, user_id, item_name, description, category, item_type, brand, color, image_url, report_date, location, submitted_to, status, additional_notes)
VALUES
  (
    'i1111111-1111-1111-1111-111111111111',
    'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Silver MacBook Pro 14"',
    'Found unattended silver laptop with college stickers on lid. Handed over to security desk staff.',
    'Electronics',
    'found',
    'Apple',
    'Space Gray / Silver',
    '/src/assets/images/found_item_macbook_1793681206791.jpg',
    CURRENT_DATE - INTERVAL '2 days',
    'Main Science Library - 2nd Floor Study Cubicle 14',
    'Central Campus Security Desk (Gate 2)',
    'open',
    'Kept safely in security locker. Serial number matches campus wifi registration.'
  ),
  (
    'i2222222-2222-2222-2222-222222222222',
    'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Sony WH-1000XM4 Wireless Headphones',
    'Over-ear black wireless headphones with black protective carrying zip case.',
    'Accessories',
    'found',
    'Sony',
    'Matte Black',
    '/src/assets/images/found_item_headphones_1793681207346.jpg',
    CURRENT_DATE - INTERVAL '3 days',
    'Humanities Hall Study Lounge',
    'Campus Administration Office Room 102',
    'open',
    'Turned on with ~60% battery. Has subtle scratch near left swivel cup.'
  ),
  (
    'i3333333-3333-3333-3333-333333333333',
    'c3333333-cccc-cccc-cccc-cccccccccccc',
    'Navy Blue Water-Resistant Campus Backpack',
    'Contains notebook spirals for Data Structures and an insulated steel water bottle.',
    'Bags',
    'found',
    'Herschel / North Face',
    'Navy Blue',
    '/src/assets/images/found_item_backpack_1793681207588.jpg',
    CURRENT_DATE - INTERVAL '5 days',
    'Student Cafeteria Outdoor Bench near Fountain',
    'Student Union Helpdesk',
    'open',
    'Owner can identify notebook titles to claim.'
  ),
  (
    'i4444444-4444-4444-4444-444444444444',
    'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Campus Dormitory Key Set with ID Lanyard',
    'Ring of 2 room keys with stamped dormitory unit number and blue University lanyard.',
    'Keys',
    'found',
    'University Housing',
    'Blue Lanyard / Brass Keys',
    '/src/assets/images/found_item_id_keys_1793681208297.jpg',
    CURRENT_DATE - INTERVAL '6 days',
    'Engineering Block Auditorium B Hallway',
    'Department Security Guard Station',
    'claimed',
    'Claim pending verification.'
  ),
  (
    'i5555555-5555-5555-5555-555555555555',
    'c3333333-cccc-cccc-cccc-cccccccccccc',
    'Casio Scientific Calculator FX-991EX',
    'Classwiz scientific calculator with my initials "S.M." scratched discreetly on the sliding battery cover.',
    'Electronics',
    'lost',
    'Casio',
    'Black and White',
    NULL,
    CURRENT_DATE - INTERVAL '1 day',
    'Math Building Lab 304',
    NULL,
    'open',
    'Lost during calculus mid-term revision session.'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Claims
INSERT INTO claims (id, item_id, claimant_id, ownership_description, evidence_url, status, admin_remarks, reviewed_by)
VALUES
  (
    'k1111111-1111-1111-1111-111111111111',
    'i4444444-4444-4444-4444-444444444444',
    'c3333333-cccc-cccc-cccc-cccccccccccc',
    'The dorm room key has unit number 308 engraved on the reverse side. The lanyard ID badge belongs to Sarah Miller.',
    NULL,
    'Pending',
    'Awaiting student to visit administration room 102 with student identity card.',
    NULL
  )
ON CONFLICT (id) DO NOTHING;
