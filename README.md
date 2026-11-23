# Findlt – Smart Campus Lost & Found Management System

**Findlt** is a full-stack, enterprise-grade web application built for college campuses. It streamlines the reporting of lost articles, cataloging of found belongings, community search, ownership verification, and administrative security handover.

---

## 🏛️ System Architecture

```text
               +-------------------------------------------+
               |        React (Vite) + Tailwind CSS        |
               |       Public Portal & Admin Panel         |
               +--------------------+----------------------+
                                    |
                            REST API / Axios
                                    |
               +--------------------+----------------------+
               |      Flask Backend / Express Proxy        |
               |     (JWT Auth, Validation, Handover)      |
               +--------------------+----------------------+
                                    |
                     +--------------+--------------+
                     |                             |
                     v                             v
       +----------------------------+   +----------------------+
       | Supabase PostgreSQL DB     |   | Supabase Storage     |
       | (RLS Policies, Procedures) |   | (Item Photographs)   |
       +----------------------------+   +----------------------+
```

---

## 🚀 Key Features

### 1. Public Landing & Discovery
- High-impact campus hero with dynamic statistics (`Total Items`, `Returned Items`, `Active Reports`).
- Browse items gallery with instant multi-facet filtering (Category, Location, Status, Date, Search).
- Privacy protection: finder's private contact information is masked to prevent spam and harassment.

### 2. Role-Based Access Control (RBAC)
- **Student**: Report lost items, log found items with photo uploads, track own reports, file ownership claims, receive in-app notifications.
- **Campus Admin / Security Officer**: Comprehensive dashboard with analytics, user management (activate/suspend), review claims (approve/reject with remarks), and physical handover verification with signed audit trail.

### 3. Secure Claim & Handover Flow
1. Student identifies a found item in the directory.
2. Student submits an ownership claim with identifying details and optional proof.
3. Status changes to `claimed` (Pending).
4. Campus Security / Admin verifies details and marks `Approved`.
5. Student brings student ID to the security desk.
6. Admin verifies physical ID and documents handover; status transitions to `Returned` (Completed).
7. Conflicting pending claims are automatically resolved.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide React, Axios, React Router DOM |
| **Backend** | Python 3.10+, Flask, Flask-CORS, PyJWT, Werkzeug |
| **Database** | Supabase (PostgreSQL 15), Row Level Security (RLS) |
| **Storage** | Supabase Storage (`lost-found-images` bucket) |

---

## 📦 Project Directory Structure

```
findlt/
├── frontend/ (integrated in root)
│   ├── src/
│   │   ├── assets/images/      # Generated high-resolution assets
│   │   ├── components/         # Navbar, Sidebar, Modals, StatCards, Toast
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── pages/              # Landing, Browse, Details, Reports, Claims, Admin
│   │   └── services/           # Axios API client
├── backend/
│   ├── app/
│   │   ├── routes/             # Auth, Items, Claims, Admin, Notifications
│   │   ├── services/           # Supabase DB & Storage connector
│   │   ├── middleware/         # JWT verification, Admin authorization
│   │   └── __init__.py         # Flask app factory
│   ├── config.py               # Environment configuration
│   ├── requirements.txt        # Python package dependencies
│   ├── run.py                  # Backend application runner
│   └── .env.example
├── database/
│   ├── schema.sql              # PostgreSQL DDL tables & triggers
│   ├── rls_policies.sql        # Supabase Row Level Security policies
│   └── seed.sql                # Realistic campus sample data
├── server.ts                   # Express full-stack runtime with Vite middleware
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup Guide

### Option A: Run Live Web Application (Node + Express + Vite)
The application includes a dual-engine architecture: an Express/Vite full-stack server runs seamlessly out of the box.

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack application (Port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

### Option B: Run Python Flask Backend Standalone

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Copy environment template
cp .env.example .env

# 5. Run Flask server
python run.py
```

The Flask API will run at `http://localhost:5000`.

---

## 🗄️ Supabase PostgreSQL & Storage Setup

1. Create a free account at [supabase.com](https://supabase.com).
2. Create a new project named `findlt-campus`.
3. In the **SQL Editor**, execute `database/schema.sql`.
4. Next, execute `database/rls_policies.sql` to secure tables.
5. *(Optional)* Run `database/seed.sql` to populate sample college data.
6. Go to **Storage** -> Create a new public bucket named `lost-found-images`.
7. Retrieve your **Project URL** and **API Key (anon/service_role)** under `Project Settings -> API` and paste into `.env`.

---

## 🔑 Default Demo Accounts

| Role | Campus ID | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin / Security** | `ADM-8801` | `admin@campus.edu` | `Admin@123` |
| **Student (Alex)** | `CS-2024-042` | `alex.j@campus.edu` | `Student@123` |
| **Student (Sarah)** | `CS-2024-118` | `sarah.m@campus.edu` | `Student@123` |

*New students can register instantly using any college email and student ID.*
