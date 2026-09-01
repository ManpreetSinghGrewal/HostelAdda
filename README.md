<div align="center">

  <!-- Animated Header Banner -->
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&size=32&pause=1000&color=F97316&center=true&vCenter=true&width=600&height=70&lines=Welcome+to+HostelAdda;Real-Time+Chitkara+Student+Hub;Omegle-Style+Peer+Video+Matchmaking;Brevo+OTP+%2B+Google+OAuth+Security" alt="Typing SVG" />

  <p align="center">
    <strong>The ultimate real-time peer video matchmaking & hostel lounge platform for Chitkara University students.</strong>
  </p>

  <!-- Badges -->
  <p align="center">
    <a href="https://hosteladda-tawny.vercel.app/"><img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Deployment" /></a>
    <a href="https://chitmeet.onrender.com/"><img src="https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render Backend" /></a>
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Brevo-Transactional_OTP-0092FF?style=for-the-badge&logo=sendinblue&logoColor=white" alt="Brevo OTP" />
  </p>

  <p align="center">
    <a href="#-key-features">Key Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-system-architecture">Architecture</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-environment-variables">Environment Variables</a> •
    <a href="#-author">Author</a>
  </p>

  <hr />
</div>

## 🌟 Overview

**HostelAdda** is a full-stack, real-time web application designed exclusively for Chitkara University students. It combines **1-on-1 random peer video matching (Omegle-style)** with **Hostel Block video lounges**, real-time presence indicators, and student social networking.

Engineered with strict security, authentication is restricted to **`@chitkara.edu.in`** domains using **Brevo 6-Digit Email OTP** verification and **Google OAuth 2.0 Single Sign-On**.

---

## ⚡ Key Features

| Feature | Description |
| :--- | :--- |
| 🔀 **Omegle-Style Matching** | Instant 1-on-1 random video/audio matching between peers across campus. |
| 🏢 **Hostel Block Lounges** | Dedicated audio/video chat rooms for Franklin-A, Archimedes, NGH, Vasco, and more. |
| 🛡️ **Brevo 6-Digit Email OTP** | High-deliverability transactional email verification for `@chitkara.edu.in` student emails. |
| 🔑 **Dual Sign-In & SSO** | 1-Click Google OAuth SSO + optional custom password setup for direct email login next time. |
| 🟢 **Live Real-Time Presence** | Live WebSocket counter broadcasting male (`👨`), female (`👩`), and room occupancy without reloads. |
| 👥 **Friends Hub & Direct Chat** | Add peers by email, view online/offline status, accept requests, and initiate direct chats. |
| 🎨 **60fps Canvas Particles** | Interactive HTML5 particle background with seamless Light/Dark theme switching. |

---

## 🛠️ Tech Stack

### **Frontend**
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![CSS3](https://img.shields.io/badge/Custom_CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-F97316?style=flat-square&logo=lucide&logoColor=white)

### **Backend & Real-Time**
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)
![ExpressJS](https://img.shields.io/badge/Express.js-404D59?style=flat-square)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=flat-square&logo=webrtc&logoColor=white)

### **Database & Services**
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-4EA94B?style=flat-square&logo=mongodb&logoColor=white)
![Brevo API](https://img.shields.io/badge/Brevo_API_v3-0092FF?style=flat-square&logo=sendinblue&logoColor=white)
![Google OAuth](https://img.shields.io/badge/Google_OAuth_2.0-4285F4?style=flat-square&logo=google&logoColor=white)

---

## 🏗️ System Architecture

```text
               +-------------------------------------------------+
               |             React 19 Frontend Client            |
               |       (HostelAdda UI / WebRTC / Socket.io)      |
               +-----------------------+-------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
        [ REST API / HTTP ]                        [ WebSocket ]
                   |                                       |
                   v                                       v
      +-------------------------+             +-------------------------+
      |  Node.js / Express.js   |             |   Socket.io Gateway     |
      |     Backend Server      |             |   (Real-Time Presence   |
      +------------+------------+             |   & WebRTC Signaling)   |
                   |                          +-------------------------+
       +-----------+-----------+
       |                       |
       v                       v
+--------------+       +---------------+
| MongoDB      |       | Brevo API v3  |
| Atlas DB     |       | Transactional |
| (Users/OTPs) |       | Email (OTP)   |
+--------------+       +---------------+
```

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **MongoDB Atlas** database connection string
- **Brevo API Key** (from [Brevo Dashboard](https://app.brevo.com))

---

### **1. Clone the Repository**
```bash
git clone https://github.com/ManpreetSinghGrewal/HostelAdda.git
cd HostelAdda
```

### **2. Setup Backend**
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chitmeet
JWT_SECRET=your_jwt_secret_key
BREVO_API_KEY=xkeysib-your-brevo-api-key
BREVO_SENDER_EMAIL=manpreetsgrewal5911@gmail.com
BREVO_SENDER_NAME=HostelAdda Verification
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Start the backend server:
```bash
npm run dev
```

---

### **3. Setup Frontend**
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory (optional for production):
```env
VITE_API_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Start the Vite development server:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔐 Environment Variables

| Variable Name | Required | Location | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | Backend `.env` | Backend HTTP server port (Default: `5001`). |
| `MONGODB_URI` | Yes | Backend `.env` | MongoDB connection URI string. |
| `JWT_SECRET` | Yes | Backend `.env` | Secret key for signing JWT authentication tokens. |
| `BREVO_API_KEY` | Yes | Backend `.env` | Brevo (Sendinblue) API v3 key for sending 6-digit OTP emails. |
| `BREVO_SENDER_EMAIL` | Yes | Backend `.env` | Authorized Brevo sender email address (`manpreetsgrewal5911@gmail.com`). |
| `GOOGLE_CLIENT_ID` | Optional | Backend `.env` | Google OAuth 2.0 Client ID for server token verification. |
| `VITE_API_URL` | Yes | Frontend `.env` | Backend API URL (`https://chitmeet.onrender.com` in production). |

---

## 🌐 Live Deployments

- 🎨 **Frontend**: [https://hosteladda-tawny.vercel.app](https://hosteladda-tawny.vercel.app)
- ⚙️ **Backend**: [https://chitmeet.onrender.com](https://chitmeet.onrender.com)

---

## 👤 Author

**Manpreet Singh**  
- 🎓 Computer Science Engineering Student @ **Chitkara University** (CGPA 9.26/10)
- 💼 GitHub: [@ManpreetSinghGrewal](https://github.com/ManpreetSinghGrewal)
- 🔗 LinkedIn: [Manpreet Singh](https://linkedin.com/in/manpreet-singh-480363317)
- ⚡ LeetCode: [@ManpreetSG](https://leetcode.com/u/ManpreetSG/)

---

<div align="center">
  <sub>Built with ❤️ for Chitkara University Students</sub>
</div>
