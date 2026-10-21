# ResQAlloc — Intelligent Emergency Medical Resource Allocation & Dispatch

> **Academic Demonstration & Research Prototype**  
> An integrated emergency triage, multi-criteria hospital matching, and road routing platform for the **Hyderabad Metropolitan Healthcare Network (99 Hospitals)**.

---

## 🚑 System Architecture Overview

ResQAlloc consists of three decoupled, cooperating services:

```
ResQAlloc/
├── client/          # React 18 + Vite + Tailwind CSS + Leaflet (Port 5173)
├── server/          # Node.js + Express + MongoDB + Mongoose (Port 5005)
├── ml-service/      # Python Flask + Scikit-learn KTAS Triage Service (Port 5001)
├── data/            # 99 Hyderabad Hospitals Dataset (hyderabad_hospitals.csv)
└── README.md
```

### 1. Clinical Triage Pipeline (KTAS)
- Computes patient severity using the **Korean Triage and Acuity Scale (KTAS Levels 1–5)**:
  - **Level 1 (Resuscitation - Red)**: Immediate intervention required.
  - **Level 2 (Emergent - Orange)**: Max wait time < 15 minutes.
  - **Level 3 (Urgent - Yellow)**: Max wait time < 30 minutes.
  - **Level 4 (Less Urgent - Green)**: Max wait time < 60 minutes.
  - **Level 5 (Non-Urgent - Blue)**: Max wait time < 120 minutes.
- Evaluates real-time patient vital signs: Heart Rate, Blood Pressure (Sys/Dia), Respiratory Rate, SpO2, Temperature, Glasgow Coma Scale (GCS 3–15), and Pain Scale (0–10).

### 2. Multi-Criteria Hospital Matching & Fallback Engine
- Evaluates **99 Hyderabad hospitals** based on required capabilities (ICU, Ventilator, Blood Bank, Cath Lab, Trauma OT, Stroke Unit, Burn Unit).
- **Fallback Mechanism**: When no single facility satisfies 100% of critical requirements with open beds, secondary constraints are dynamically relaxed to ensure the patient reaches the nearest emergency stabilization facility immediately.
- Integrates road routing via **OSRM (Open Source Routing Machine)** for real road distances and estimated travel times across Hyderabad.

### 3. Role-Based Portals & Dashboards
- **Public Emergency Portal (`/emergency-sos`)**: 1-click citizen reporting with GPS locator, Hyderabad landmark selector, first-aid advice (CPR, severe bleeding, airway), and direct 108/112 dial triggers.
- **Paramedic Triage & Dispatch (`/responder`)**: Complete clinical intake, live KTAS scoring, capability filtering, ranked hospital cards with OSRM route map, and 1-click ambulance dispatch.
- **Hospital Staff Command Portal (`/hospital-staff`)**: Incoming referrals queue with Accept / Divert actions and live bed/ventilator availability management.
- **System Administration (`/admin`)**: Network overview, 99 hospitals manager, user role management, and immutable audit logs.
- **99 Hospitals Directory (`/hospitals`)**: Interactive map and searchable catalog of all 99 facilities.

---

## 🔑 Demo Credentials & Quick Switcher

The application includes a **⚡ 1-Click Demo Login** dropdown in the top navigation bar for immediate testing without passwords. Alternatively, use these pre-seeded accounts:

| Role | Email | Password | Assigned Facility / Permissions |
| :--- | :--- | :--- | :--- |
| **Emergency Responder** | `responder@resqalloc.demo` | `responder123` | Paramedic Unit 108 (Full triage & dispatch) |
| **Hospital Staff** | `staff@resqalloc.demo` | `staff123` | Nizam's Institute of Medical Sciences (NIMS) |
| **Administrator** | `admin@resqalloc.demo` | `admin123demo` | System Master Control (All access) |

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local or MongoDB Atlas URI
- **Python**: 3.9+ with `pip`

---

### Step 1: Python ML Service Setup (Port 5001)

```bash
cd ml-service

# Install dependencies
pip install -r requirements.txt

# Start the ML service
python3 app.py
```
*The service will start on `http://localhost:5001` with demonstration KTAS classification enabled.*

---

### Step 2: Backend Express Server Setup (Port 5005)

```bash
cd server

# Install Node dependencies
npm install

# Configure environment variables (.env is preconfigured)
# MONGODB_URI=your_mongo_connection_string
# PORT=5005
# ML_SERVICE_URL=http://localhost:5001

# Seed the 99 Hyderabad hospitals and demo accounts
npm run seed

# Start the server
npm run dev
# Or: node server.js
```
*The Express API will start on `http://localhost:5005`.*

---

### Step 3: React Frontend Setup (Port 5173)

```bash
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Open `http://localhost:5173` in your browser to access the platform.*

---

## 📊 Dataset & Synthetic Data Notice

- **99 Hyderabad Hospitals**: Imported from `data/hyderabad_hospitals.csv`. Facility names, areas (Banjara Hills, Secunderabad, Gachibowli, Kukatpally, etc.), emergency status, and trauma center capabilities are preserved from authentic registry records.
- **Capacity & Coordinates Labeling**: In compliance with the project specifications, real-time bed numbers, available ICU units, ventilator counts, and exact coordinates are labeled as **synthetic simulation data** for academic modeling and algorithm verification.
- **Not for Clinical Deployment**: This system is strictly an academic research project and must not be used for real clinical diagnosis or emergency dispatch without institutional validation. In actual emergencies, citizens must dial **108** or **112**.

---

## 📡 REST API Reference

| Service | Method | Route | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | User authentication & JWT generation |
| **Auth** | `POST` | `/api/auth/register` | Register new responder or staff account |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| **Emergency** | `POST` | `/api/emergency` | Create emergency case & run triage + hospital matching |
| **Emergency** | `GET` | `/api/emergency` | Get list of emergency cases |
| **Emergency** | `POST` | `/api/emergency/:id/select-hospital` | Select hospital & dispatch ambulance |
| **Emergency** | `POST` | `/api/emergency/public-report` | Public 1-click citizen emergency report |
| **Hospitals** | `GET` | `/api/hospitals` | Search & filter 99 Hyderabad hospitals |
| **Hospitals** | `GET` | `/api/hospitals/:id` | Get individual hospital details |
| **Resources** | `GET` | `/api/resources/:hospitalId` | Get hospital resource availability |
| **Resources** | `PUT` | `/api/resources/:hospitalId` | Update live ICU/bed availability |
| **Referrals** | `GET` | `/api/referrals` | Get referrals queue for assigned hospital |
| **Referrals** | `PUT` | `/api/referrals/:id/respond` | Accept or divert incoming emergency referral |
| **Admin** | `GET` | `/api/admin/dashboard` | Executive system metrics & counters |
| **Admin** | `GET` | `/api/admin/audit-logs` | Chronological immutable audit trail |
| **Health** | `GET` | `/api/health` | Health check & system status |

---

## 🛠️ Tech Stack Summary

- **Frontend**: React 18, Vite, React Router 6, Tailwind CSS, Leaflet, React-Leaflet, Axios, Lucide Icons
- **Backend**: Node.js, Express.js, MongoDB Atlas / Mongoose, JWT, Bcrypt, Helmet, Morgan
- **Machine Learning**: Python Flask, Scikit-learn, NumPy, Pandas, KTAS Clinical Triage Algorithm
- **Routing Engine**: Open Source Routing Machine (OSRM) Road Polyline & Travel Time Engine