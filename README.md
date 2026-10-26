# 🚀 EduMaster Frontend

EduMaster Frontend is a modern educational platform web application developed with React and Vite. It provides an intuitive interface for students, teachers, and administrators.

---

## 📖 Project Overview

EduMaster includes:
- User authentication and session management
- Lesson browsing and interactive video viewing
- Online exams with automatic timers and submission handling
- Student performance and results dashboard
- Admin content and user management tools
- Arabic and English interface
- Dark and Light mode support

This repository contains the **frontend (React) part** of the EduMaster platform.

---

## ✨ Key Features

- ✅ Responsive layout powered by Tailwind CSS & shadcn/ui
- ✅ Role-based access (Student, Admin, Super Admin)
- ✅ Smooth page transitions and micro-interactions with Framer Motion
- ✅ Client-side routing and navigation with React Router

---

## 🛠️ Tech Stack

- **React 19** (`^19.1.0`) – UI Library
- **Vite 6** (`^6.3.5`) – Build tool & Dev server
- **Tailwind CSS 4** (`^4.1.7`) – Styling framework
- **React Router 7** (`^7.6.1`) – Client-side routing
- **shadcn/ui** – UI components
- **Framer Motion** – Animations
- **Lucide Icons** – Iconography

---

## ⚡ Installation & Setup

To run this project locally:

```bash
# 1. Clone the repository
git clone https://github.com/Abda11a20/edumaster-frontend-clean01.git

# 2. Navigate to the project folder
cd edumaster-frontend-clean01

# 3. Setup environment variables
cp .env.example .env

# 4. Install dependencies
npm install

# 5. Start the development server
npm run dev
```

The application runs locally at `http://localhost:5173`.

---

## 🔧 Environment Variables

Configure `.env` based on `.env.example`:

```env
# Target backend API URL (used by Vite dev proxy)
VITE_BACKEND_URL=https://edu-master-delta.vercel.app
```

---

## 📦 Build for Production

```bash
npm run build
```
