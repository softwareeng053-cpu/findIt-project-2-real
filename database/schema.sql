-- ====================================================================
-- FINDLT: SMART CAMPUS LOST & FOUND MANAGEMENT SYSTEM
-- PostgreSQL Database Schema for Supabase
-- Target DBMS: PostgreSQL 14+ / Supabase
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running migration
DROP TABLE IF EXISTS handover_records CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS item_categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- --------------------------------------------------------------------
-- TABLE 1: profiles
-- Stores student and administrator profiles linked to campus identity
-- --------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    campus_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(25),
    department VARCHAR(100) NOT NULL,
    course VARCHAR(100) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'security')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);


CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_campus_id ON profiles(campus_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- --------------------------------------------------------------------
-- TABLE 2: item_categories
-- Standardized categorization for campus lost & found articles
-- --------------------------------------------------------------------
CREATE TABLE item_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- --------------------------------------------------------------------
-- TABLE 3: items
-- Stores both Lost and Found reports with metadata, location, and status
-- --------------------------------------------------------------------
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('lost', 'found')),
    brand VARCHAR(100),
    color VARCHAR(60),
    image_url TEXT,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location VARCHAR(255) NOT NULL,
    submitted_to VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'returned', 'expired')),
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_items_type ON items(item_type);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_report_date ON items(report_date DESC);

-- --------------------------------------------------------------------
-- TABLE 4: claims
-- Ownership claims submitted by students with proof and admin remarks
-- --------------------------------------------------------------------
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ownership_description TEXT NOT NULL,
    evidence_url TEXT,
    status VARCHAR(25) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Rejected', 'Completed')),
    admin_remarks TEXT,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_claims_item_id ON claims(item_id);
CREATE INDEX idx_claims_claimant_id ON claims(claimant_id);
CREATE INDEX idx_claims_status ON claims(status);

-- --------------------------------------------------------------------
-- TABLE 5: notifications
-- In-app notifications for claims, approvals, and report updates
-- --------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- --------------------------------------------------------------------
-- TABLE 6: handover_records
-- Audit trail documenting physical return of articles to rightful owners
-- --------------------------------------------------------------------
CREATE TABLE handover_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    verified_by VARCHAR(150) NOT NULL,
    handover_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Verified' CHECK (status IN ('Verified', 'Archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_handover_item ON handover_records(item_id);
CREATE INDEX idx_handover_claim ON handover_records(claim_id);

-- --------------------------------------------------------------------
-- AUTOMATIC updated_at TRIGGER FUNCTION
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_claims_updated_at BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- --------------------------------------------------------------------
-- TABLE 7: admin_activity_logs
-- Comprehensive immutable audit trail tracking sensitive administrator operations
-- --------------------------------------------------------------------
CREATE TABLE admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    admin_name VARCHAR(150) NOT NULL,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_activity_admin ON admin_activity_logs(admin_id);
CREATE INDEX idx_activity_action ON admin_activity_logs(action);
CREATE INDEX idx_activity_created ON admin_activity_logs(created_at DESC);

-- --------------------------------------------------------------------
-- TABLE 8: system_settings
-- Global institutional configuration for Findlt portal
-- --------------------------------------------------------------------
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Seed default system settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES
  ('campus_info', '{"system_name": "Findlt Campus Portal", "college_name": "University Campus & Affiliated Institutes", "security_hotline": "+1 (555) 019-9000", "central_office": "Central Security Desk (Gate 2)", "contact_email": "lostfound@campus.edu"}', 'Campus identity and emergency contacts'),
  ('policy_rules', '{"auto_approve_claims": false, "require_evidence_link": false, "retention_period_days": 90, "student_public_directory": true, "enable_broadcasts": true}', 'Operating rules and retention policies')
ON CONFLICT (setting_key) DO NOTHING;
