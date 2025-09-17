# 🔐 SecureVault – Password & API Key Manager

A full-stack application to securely store, manage, and access **passwords** and **API keys**, built with:

- ⚡️ FastAPI (Backend)
- 🔐 Firebase Authentication (User login)
- 🧠 AES-256 encryption (Data security)
- 🧬 MongoDB Atlas (Cloud database)
- ⚛️ React + Tailwind CSS + ShadCN UI (Frontend)

---

## 🚀 Features

- 🔐 **Secure Storage** — Passwords and API keys are encrypted on the client-side before being saved.
- 🪪 **Authentication** — Sign-in with Firebase (Google/email).
- 🧩 **API Key Management** — Add, edit, delete, and monitor keys.
- 🔍 **Searchable Interface** — Quickly find saved items.
- ✨ **Polished UI** — Built with ShadCN and Tailwind CSS.

---

## 📦 Tech Stack

| Layer       | Stack                     |
|-------------|---------------------------|
| Frontend    | React + Tailwind + ShadCN |
| Backend     | FastAPI                   |
| Auth        | Firebase Authentication   |
| Database    | MongoDB Atlas (NoSQL)     |
| Encryption  | AES (via Web Crypto API)  |

---

## 🔧 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/securevault.git
cd securevault
```

---

### 2. Backend Setup (`/backend` folder)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

📌 Create a `.env` file inside `/backend` with the following:

```env
MONGODB_URL=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CERT_PATH=path_to_your_firebase_admin_sdk.json
```

Run the server:

```bash
uvicorn main:app --reload
```

---

### 3. Frontend Setup (`/frontend` folder)

```bash
cd frontend
npm install
```

📌 Make sure your Firebase project is initialized and replace config in:

```ts
/src/context/AuthContext/firebase.ts
```

Run the React dev server:

```bash
npm run dev
```

---

## 🧪 Testing

- Make sure both frontend (`http://localhost:5173`) and backend (`http://localhost:8000`) are running.
- Register/login and start adding passwords and API keys.

---

## 📁 Folder Structure (Simplified)

```
/backend
  └── main.py
  └── routes/
  └── firebase.py
  └── DB.py

/frontend
  └── src/
      ├── context/
      ├── pages/
      ├── components/
      └── App.tsx
```

---

## 📝 Notes

- 🔐 **Do NOT commit your `.env` or Firebase service credentials to GitHub**.
- 💾 MongoDB Atlas must be configured to accept your IP address.
- ✅ Passwords and keys are encrypted in-browser before being sent to the backend.

---

## 📌 TODO

- [ ] Add support for categories/folders
- [ ] Multi-device sync status
- [ ] Role-based sharing (team use)

---

## 💙 Credits

Created by [Your Name] with ❤️ and security in mind.