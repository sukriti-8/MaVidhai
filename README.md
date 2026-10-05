# 🛍️ MaVidhai

### AI-Powered E-Commerce Platform

**MaVidhai** is a modern full-stack e-commerce platform that combines seamless online shopping, AI-powered assistance, multilingual experiences, and WhatsApp-driven payments into one unified platform.

<p align="center">
  <strong>Discover products • Shop smarter • Get AI assistance • Pay through WhatsApp</strong>
</p>

<p align="center">

![Status](https://img.shields.io/badge/status-Release%20Candidate-orange)
![Tests](https://img.shields.io/badge/tests-92%2F92-success)
![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql)
![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4)

</p>

---

<p align="center">
  <em>(📸 Product screenshot placeholder - Add actual UI screenshot here)</em>
</p>

---

## ✨ What is MaVidhai?

MaVidhai is a full-stack commerce platform designed to provide a smooth shopping experience from product discovery to order completion.

The platform brings together:

* 🛍️ Product discovery and search
* 🛒 Smart cart and wishlist
* 📦 Inventory-aware ordering
* 💳 WhatsApp-driven payments
* 🤖 Gemini-powered AI assistant
* 🌐 Multilingual support
* 👤 Authentication and user profiles
* 📋 Order tracking and history

The application is built as a unified monorepo with a **Next.js frontend**, **FastAPI backend**, and **PostgreSQL database**.

---

## 🚀 Features

### 🛍️ Shopping Experience

* Product search
* Category and price filtering
* Product availability tracking
* Stock-aware quantity selection
* Quick Add to Cart
* Wishlist
* Responsive product pages
* Order history and order details

### 🤖 AI Assistant

MaVidhai includes a Gemini-powered AI assistant integrated directly into the application.

The assistant provides a conversational interface that can help users interact with and navigate the platform.

### 💬 WhatsApp Payments

MaVidhai uses a provider-agnostic payment architecture with WhatsApp as the payment handoff channel.

```text
Checkout
   ↓
Create Order
   ↓
Create Payment
   ↓
WhatsApp Payment Handoff
   ↓
External Payment Provider
   ↓
Verified Webhook
   ↓
Payment Captured
   ↓
Inventory Updated
   ↓
Order Confirmed
```

The payment system includes:

* Provider abstraction
* Webhook signature verification
* Idempotent webhook processing
* Payment/order correlation
* Cross-order protection
* Inventory conflict handling
* Checkout payment polling

> Real external-provider staging validation is the remaining gate before production release.

### 🌐 Multilingual Experience

The frontend includes centralized language management and translation support, allowing the interface to adapt to supported languages.

---

## 🎯 Why MaVidhai?

MaVidhai is designed around a simple idea:

> **Make digital commerce more intelligent, conversational, and accessible.**

Instead of treating shopping, customer assistance, and payments as separate experiences, MaVidhai brings them together into a single platform.

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      MaVidhai        │
                    │     Web Platform     │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          ┌──────▼──────┐             ┌──────▼──────┐
          │  Next.js    │             │   FastAPI   │
          │  Frontend   │◄───────────►│   Backend   │
          └─────────────┘             └──────┬──────┘
                                             │
                                    ┌────────▼────────┐
                                    │   PostgreSQL     │
                                    └─────────────────┘
                                             │
                    ┌────────────────────────┼──────────────────────┐
                    │                        │                      │
             ┌──────▼──────┐         ┌──────▼──────┐       ┌──────▼──────┐
             │    Gemini   │         │  WhatsApp   │       │   Payment   │
             │     AI      │         │ Integration │       │   Provider  │
             └─────────────┘         └─────────────┘       └─────────────┘
```

---

## 🛠️ Tech Stack

| Layer           | Technology                      |
| --------------- | ------------------------------- |
| Frontend        | Next.js, React                  |
| Styling         | Tailwind CSS                    |
| Backend         | FastAPI                         |
| ORM             | SQLAlchemy                      |
| Validation      | Pydantic                        |
| Database        | PostgreSQL                      |
| Migrations      | Alembic                         |
| AI              | Google Gemini                   |
| Payments        | Provider abstraction + WhatsApp |
| Testing         | Pytest                          |
| Version Control | Git / GitHub                    |

---

## 📂 Project Structure

```text
MaVidhai/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── context/
│   └── hooks/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── database/
│   │
│   ├── migrations/
│   ├── tests/
│   └── scripts/
│
├── team-projects/
│   ├── sameer/
│   │   └── IntelliAssist-AI/
│   └── bharath/
│       └── plantpulse-app/
│
├── docs/
│
├── package.json
└── README.md
```

---

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Gayathripocharam/MaVidhai.git
cd MaVidhai
```

### 2. Start the frontend

```bash
npm install
npm run dev
```

### 3. Start the backend

```bash
cd backend

python -m venv .venv
```

Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the API:

```bash
uvicorn app.main:app --reload
```

### 4. Configure environment variables

Create the required local environment configuration using the provided example configuration.

Never commit:

* API keys
* access tokens
* database credentials
* `.env` files
* private secrets

---

## 🧪 Testing

Backend tests:

```bash
cd backend
pytest -q
```

Current RC1 result:

```text
92 passed
```

Frontend validation:

```bash
npm run lint
npm run build
```

---

## 📊 Project Status

**v1.0.0-rc1 — Release Candidate**

| Component                     | Status        |
| ----------------------------- | ------------- |
| Frontend                      | 🟢 Complete   |
| Backend                       | 🟢 Complete   |
| Database                      | 🟢 Validated  |
| AI Assistant                  | 🟢 Integrated |
| WhatsApp Payment Architecture | 🟢 Validated  |
| Automated Tests               | 🟢 92/92      |
| Production Build              | 🟢 Passing    |
| External Payment Staging      | 🟡 Pending    |

---

## 👥 Team Projects

The repository also contains supporting projects contributed by team members:

### IntelliAssist-AI

AI assistant project contributed by the team.

### plantpulse-app

AI-based crop disease detection application focused on disease prediction, confidence scoring, and treatment recommendations.

These projects are maintained under `team-projects/` and remain separate from the MaVidhai core application.

---

## 🗺️ Roadmap

* [x] Unified frontend and backend
* [x] Product discovery and shopping
* [x] Cart and wishlist
* [x] Order management
* [x] AI assistant
* [x] Multilingual support
* [x] WhatsApp payment architecture
* [x] Payment security hardening
* [x] RC1 integration testing
* [ ] Real external payment-provider staging validation
* [ ] Production deployment
* [ ] Advanced vendor/admin capabilities
* [ ] Further AI-powered commerce features

---

## 📄 Documentation

Additional technical and release documentation is available in:

```text
docs/
├── release/
│   ├── rc1_release_notes.md
│   └── whatsapp-payment-release-evidence.md
```

---

## ⭐ Contributing

Contributions, suggestions, and improvements are welcome.

For larger changes, please open an issue or discussion before submitting a pull request.

---

## 📜 License

See the `LICENSE` file for licensing information.

---

<p align="center">
  Built with ❤️ by the MaVidhai Team
</p>
