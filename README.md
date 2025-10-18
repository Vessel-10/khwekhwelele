# 🚌 Khwekhwelele – Bus Ticketing System

Khwekhwelele is a **web-based bus ticketing system** designed to digitalize and simplify the process of booking, managing, and validating bus tickets for passengers and operators.  
It provides a user-friendly platform for both **customers** and **administrators**, reducing manual errors and improving efficiency in transport management.

---

## 🚀 Overview

This system automates ticket sales and bus scheduling through an interactive web interface.  
Passengers can view available routes, purchase tickets, and confirm bookings online.  
Administrators can manage buses, routes, ticket data, and passengers from a centralized dashboard.

**Key Goals**
- Streamline the ticket booking and management process.  
- Improve accuracy and eliminate paper-based tickets.  
- Enhance transparency for passengers and operators.

---

## 🧠 Project Meta

   **Project Name:** Khwekhwelele  
   **Version:** 1.0.0  
   **Developer:** Vessel (Anaclet Magombo)  
   **Languages/Tools:** PHP, MySQL, HTML, CSS, JavaScript, Bootstrap  
   **Purpose:** To provide a digital ticketing system that improves transparency and efficiency for public transport operators in Malawi.  
   **License:** MIT License  
   **GitHub Repository:** [https://github.com/Vessel-10/khwekhwelele]

## 🧩 Features

- 🔐 **User Authentication** – Secure login and registration.  
- 🚌 **Bus & Route Management** – Create and manage routes, buses, and trips.  
- 🎟️ **Ticket Booking & Validation** – Book, reserve, and verify tickets easily.  
- 🧾 **Ticket Records** – Maintain detailed booking history.  
- 📊 **Admin Dashboard** – View system statistics and manage operations.  
- 💻 **Responsive Design** – Optimized for desktop and mobile.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | HTML, CSS, JavaScript |
| **Backend** | PHP |
| **Database** | MySQL |
| **Server** | Apache (via XAMPP/WAMP) |
| **Version Control** | Git & GitHub |

---

## ⚙️ Installation Guide

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vessel-10/khwekhwelele.git
   
2. Move the folder to your local server directory
  - For XAMPP → htdocs
  - For WAMP → www

3. Create the database
  - Open phpMyAdmin
  - Create a database called khwekhwelele_db
  - Import the provided .sql file if available.

4. Update the database connection
In config.php or connection.php, modify the credentials:
  - $host = "localhost";
  - $user = "root";
  - $password = "";
  - $dbname = "khwekhwelele_db";
    
5. Run the project
  - Open your browser and go to:
    http://localhost/khwekhwelele/
📁 Project Structure
    khwekhwelele/
      │
      ├── assets/            # CSS, JS, and images
        ├── pages/             # System pages (booking, admin, etc.)
        ├── includes/          # Header, footer, and helper files
        ├── config/            # Database connection
      ├── index.php          # Entry point
      └── README.md          # Documentation

💡 Future Improvements
  💳 Integrate online payments (PayPal, Airtel Money, TNM Mpamba).
  📱 Develop a mobile app version.
  📷 Add QR code ticket validation.
  📍 Enable live bus tracking.
  📈 Add advanced reporting for admins.
  🌐 Multi-language support.

🧠 Lessons Learned
  - Practical experience in connecting PHP with MySQL.
  - How to structure backend logic for CRUD operations.
  - Building responsive web layouts for real-world systems.
  - Improving system usability through clean interface design.

👨‍💻 Author
  Anaclet C. Magombo
  📍 Malawi
  💼 Frontend & Web Developer
  📧 magomboanaclet@gmail.com
