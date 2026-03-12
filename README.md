# Focusly 🚀

(Work in Progress)

Focusly is a **smart productivity and goal‑tracking web application** designed to help users plan goals, break them into actionable tasks, track progress over time, stay consistent with reminders, and reflect through a personal diary — all in one place.

The app combines **structured task management**, **progress analytics**, **journaling**, and a **goal‑assisting chatbot** to help users build habits and improve productivity sustainably.

---

## 🧠 Core Idea

Most productivity apps either:

* track tasks **without reflection**, or
* focus on motivation **without structure**.

**Focusly bridges this gap** by combining:

* goals → tasks → progress
* actual vs predicted performance
* reminders + journaling
* intelligent suggestions using past data

---

## ✨ Key Features

### 1️⃣ User Authentication

* User signup & login
* Secure credential storage
* User‑specific goals, tasks, diary entries, and reminders

---

### 2️⃣ Home Dashboard

* Personalized greeting (time‑based)
* Current date display
* Overview of:

  * Today’s tasks
  * Streak status ("Don’t break the streak")
  * Active goals

---

### 3️⃣ Goal Management

#### Create Goals

* Goals can be **long‑term or short‑term**
* Each goal can be broken down into:

  * Monthly sub‑goals
  * Weekly sub‑goals
  * Daily tasks

#### Goal Types

* **Independent goals** – standalone
* **Dependent goals** – rely on completion of other goals

---

### 4️⃣ Task System

Tasks are categorized into:

#### 🔁 Recurring Tasks

* Daily / weekly / custom frequency
* Start date & end date
* Completion rate tracking

#### 🔹 Independent Tasks

* One‑time tasks
* Due date & actual completion date
* Priority & time allocation

#### 🔗 Dependent Tasks

* Linked to parent goals or tasks
* Completion depends on prerequisites

Each task tracks:

* Created date
* Due date
* Actual end date
* Completion status
* Remarks / notes

---

### 5️⃣ Track Progress & Analytics

* Visual graphs for productivity
* Views available:

  * Daily
  * Weekly
  * Monthly
  * Yearly

#### Productivity Logic

* **Predicted vs Actual completion**
* Productivity score calculation:

  * 100% → actual = predicted
  * < 100% → actual > predicted
  * > 100% → actual < predicted

---

### 6️⃣ Dear Diary 📓

* Personal journaling space
* Write daily reflections
* Entries saved locally or in database
* Option to view past entries by date

---

### 7️⃣ Reminders ⏰

* Create reminders linked to tasks or goals
* Scheduled notifications
* Input → output reminder system

---

### 8️⃣ Streak System 🔥

* Encourages daily consistency
* Tracks consecutive days of task completion
* Visual streak indicators on dashboard

---

### 9️⃣ Smart Chatbot 🤖

The chatbot helps users:

* Understand their current goals
* Break large goals into smaller actionable tasks
* Suggest daily plans based on:

  * Past task history
  * Average available time per day

#### Workflow

1. User inputs a goal
2. Chatbot analyzes past data
3. Generates a structured plan
4. User approves the plan
5. Approved plan integrates into main task system

If rejected, chatbot regenerates suggestions.

---

## 🗄️ Data Model Overview
* Model:
![Project Data Model](images\DataModel.drawio.png)

---

## 🛠️ Tech Stack

### Frontend

* React + TypeScript
* Vite
* React Router
* CSS

### Backend

* Node.js
* Express.js
* REST APIs

### Database

* Postgresql
* Designed for relational task dependencies


---

## 📂 Project Structure (Simplified)

```
project-root/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middlewares/
│   │   ├── db/
│   │   └── index.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
└── README.md
```

---

## 🚧 Project Status

* UI wireframes planned
* Core architecture defined
* Backend & frontend separation complete
* **AI chatbot integrated for goal planning and task breakdown**
* Features under active development

---

## 🎯 Future Enhancements

* Calendar integrations
* Cloud sync
* Notifications & push alerts

---

## 🙌 Vision

**Focusly is not just a to‑do app.**

It’s a system to:

* plan intentionally
* act consistently
* reflect honestly
* and grow sustainably



