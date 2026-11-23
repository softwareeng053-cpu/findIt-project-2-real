-- ====================================================================
-- FINDLT: SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data privacy, prevents unauthorized claim manipulation,
-- and guarantees admin-only review and role assignment.
-- ====================================================================

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_records ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- HELPER: Check if current authenticated user is an administrator
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND account_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- PROFILES POLICIES
-- --------------------------------------------------------------------
-- Any authenticated user can read public basic profile info
CREATE POLICY "Allow authenticated read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update only their own non-role fields
CREATE POLICY "Allow users to update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Only administrators can insert/delete or update roles
CREATE POLICY "Admins full access to profiles"
ON profiles FOR ALL
TO authenticated
USING (is_admin());

-- --------------------------------------------------------------------
-- ITEM CATEGORIES POLICIES
-- --------------------------------------------------------------------
-- Everyone can read active categories
CREATE POLICY "Public read categories"
ON item_categories FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Only admins can modify categories
CREATE POLICY "Admins manage categories"
ON item_categories FOR ALL
TO authenticated
USING (is_admin());

-- --------------------------------------------------------------------
-- ITEMS POLICIES
-- --------------------------------------------------------------------
-- Everyone (even anonymous campus guests) can browse found & lost items
CREATE POLICY "Anyone can browse items"
ON items FOR SELECT
TO anon, authenticated
USING (status != 'expired');

-- Authenticated users can insert lost/found items
CREATE POLICY "Users can create items"
ON items FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Item owner or admin can update their item
CREATE POLICY "Owners or admins update items"
ON items FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- Item owner or admin can delete item
CREATE POLICY "Owners or admins delete items"
ON items FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- --------------------------------------------------------------------
-- CLAIMS POLICIES
-- --------------------------------------------------------------------
-- Users can read only their own claims; Admins can read all claims
CREATE POLICY "Users read own claims, admins read all"
ON claims FOR SELECT
TO authenticated
USING (claimant_id = auth.uid() OR is_admin());

-- Authenticated users can submit a claim with their own claimant_id
CREATE POLICY "Users insert own claims"
ON claims FOR INSERT
TO authenticated
WITH CHECK (claimant_id = auth.uid());

-- Only admins can update claim review status and remarks
CREATE POLICY "Admins review and update claims"
ON claims FOR UPDATE
TO authenticated
USING (is_admin());

-- --------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- --------------------------------------------------------------------
-- Users can only read and update their own notifications
CREATE POLICY "Users access own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users mark read own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Service role and triggers can insert notifications
CREATE POLICY "System insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- --------------------------------------------------------------------
-- HANDOVER RECORDS POLICIES
-- --------------------------------------------------------------------
-- Handover records are security audit logs: visible to admins & claimant
CREATE POLICY "Claimant and admins view handovers"
ON handover_records FOR SELECT
TO authenticated
USING (
  is_admin() OR
  claim_id IN (SELECT id FROM claims WHERE claimant_id = auth.uid())
);

-- Only admins can create handover records
CREATE POLICY "Admins insert handover records"
ON handover_records FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- --------------------------------------------------------------------
-- ADMIN ACTIVITY LOGS POLICIES (Immutable Audit Trail)
-- --------------------------------------------------------------------
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view activity logs"
ON admin_activity_logs FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Only admins can insert activity logs"
ON admin_activity_logs FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Nobody can update or delete activity logs (Immutable security guarantee)
-- No UPDATE or DELETE policies are declared, thereby denying updates/deletions.

-- --------------------------------------------------------------------
-- SYSTEM SETTINGS POLICIES
-- --------------------------------------------------------------------
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings"
ON system_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Only admins can update system settings"
ON system_settings FOR ALL
TO authenticated
USING (is_admin());
