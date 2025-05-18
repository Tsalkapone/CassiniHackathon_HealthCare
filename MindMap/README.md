
# 🌿 MindMap: Your Mental Wellness Companion

**MindMap** is a science-driven mental wellness app that merges satellite data, clinically validated tools, and personalized content to promote emotional well-being. It helps users track moods, discover nearby green spaces, and improve their mental health through interactive tools and multimedia guidance.

![MindMap Cover](https://www.dropbox.com/scl/fi/2ijyye1szion89n1bl7c0/user_dashboard_desktop.png?rlkey=f4of7y7u0ykxihdi2nmby52c5&st=nyi88egd&dl=0)

---

## ✨ Features

- 🧠 **Clinically Validated Self-Assessments**  
  Tools for evaluating anxiety, depression, and overall wellbeing.

- 🗺️ **Map-Based Discovery**  
  Find calming, green, and healing spots near you using satellite-powered MindMap.

- 🌤️ **Live Environmental Data**  
  Real-time updates on air quality, sunlight, and vegetation via Copernicus & EUSPA APIs.

- 🎧 **Relaxation & Motivational Content**  
  Curated nature sounds, meditations, and sleep tracks to soothe the mind.

- 📊 **Mood Tracking with Insights**  
  Track your emotional patterns and receive science-backed suggestions.

- 🤖 **Coming Soon**  
  AI Chatbot integration, CBT tools, and access to live therapy support.

---

## 🧩 Tech Stack

### 🖥️ Frontend
- `jQuery`, `JavaScript`, `HTML5`, `CSS3`
- Progressive Web App (PWA)
- `Bootstrap`, `Font Awesome`, `Leaflet.js`, `OpenStreetMap`
- CDN integration and smart caching mechanisms

### ⚙️ Backend
- `PHP` (Laravel Framework)
- RESTful APIs and secure endpoints

### 🧠 AI/ML
- Integration with trained LLMs (e.g. Gemini AI) for future features like:
  - Conversational therapy bot
  - Mood prediction
  - Personalized CBT routines

### 📡 APIs & Data Sources
- `Copernicus`, `EUSPA` for satellite and environmental data
- `Gemini AI` for language understanding and response generation

### 🔐 Authentication & Compliance
- `OAuth2` secure login
- Full GDPR compliance & anonymized data handling

---

## 🚀 Installation

### 🧰 Option 1: Using XAMPP (Easy for Beginners)


1. Download and install [XAMPP](https://www.apachefriends.org/index.html)
2. Copy this project folder into `htdocs`:
   - Windows: `C:\xampp\htdocs\`
   - macOS: `/Applications/XAMPP/htdocs/`
3. Launch XAMPP Control Panel and start **Apache** (and **MySQL** if needed).
4. (Optional) Open `http://localhost/phpmyadmin`, create a database, and import `database.sql` if included.
5. Open your browser and go to:

http://localhost/

### 💻 Option 2: Using Laravel Sail (Modern Setup)

#### Prerequisites
- [Composer](https://getcomposer.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

#### Steps

```bash
# Clone this repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Install PHP dependencies
composer install

# Copy and edit environment
cp .env.example .env
php artisan key:generate

# Launch with Laravel Sail
./vendor/bin/sail up

# Access on your browser
http://localhost
