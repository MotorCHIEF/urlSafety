# 🛡️ URL Safety Check

A full-stack web application built to analyze URLs and generate comprehensive, real-time safety reports. 

Instead of relying on simple database blacklists, this application utilizes a custom **heuristic scoring engine** to calculate an overall threat level. By aggregating various safety checks—including external threat databases, cryptographic validity, and domain registration history—it provides users with a clear, color-coded verdict on whether a link is safe to visit.

## ✨ Key Features
* **Heuristic Scoring Engine:** Aggregates data from the Google Safe Browsing API, SSL certificate validation/expiry checks, and WHOIS domain age to calculate a weighted safety score.
* **High-Performance Caching:** Utilizes a MongoDB Time-To-Live (TTL) index to maintain a rolling 24-hour cache of analyzed URLs. This prevents database race conditions, protects external API rate limits, and ensures report generation in 5-7 seconds.
* **Secure User Authentication:** Features JWT-based authentication with route guarding, password hashing, and a sandbox SMTP integration (Mailtrap) for safe password resets.
* **Lightweight UI:** Built an accessible, responsive dashboard using native CSS conic-gradient math and dynamic style binding to visualize threat data without relying on heavy third-party charting libraries.

## 🛠️ Tech Stack
* **Frontend:** Angular, HTML5, native CSS
* **Backend:** Python, Flask
* **Databases:** Azure Cosmos DB (Production), MongoDB (Testing & TTL Caching)
* **APIs & Integrations:** Google Safe Browsing API, WHOIS, Mailtrap
* **Testing:** Postman (Integration), Unittest (Python), Karma (Angular)
