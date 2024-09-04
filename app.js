require('dotenv').config();

const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(express.static(path.join(__dirname, "public")));


app.use(express.urlencoded({ extended: false }));




const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    return;
  }
  console.log("Connected to MySQL database");
});

// Start time and configuration
const registrationStartTime = new Date().getTime();
const registrationDuration = 3600 * 1000; // 1 hour in milliseconds
const maxSeats = 50;

// Home route - displays the registration form
app.get("/", (req, res) => {
  const currentTime = new Date().getTime();
  const timeLeft = registrationDuration - (currentTime - registrationStartTime);

  db.query("SELECT COUNT(*) AS count FROM registrants", (err, results) => {
    const seatsRemaining = maxSeats - results[0].count;

    if (timeLeft <= 0 || seatsRemaining <= 0) {
      return res.render("closed", { seatsRemaining });
    }

    res.render("index", {
      seatsRemaining,
      timeLeft: Math.floor(timeLeft / 1000),
    }); // timeLeft in seconds
  });
});

// Handle form submission
app.post("/register", (req, res) => {
  const currentTime = new Date().getTime();
  const timeLeft = registrationDuration - (currentTime - registrationStartTime);

  if (timeLeft <= 0) {
    return res.render("closed", { message: "Sorry, registration has closed." });
  }

  db.query("SELECT COUNT(*) AS count FROM registrants", (err, results) => {
    if (err) return res.status(500).send("Database error");

    const seatsRemaining = maxSeats - results[0].count;

    if (seatsRemaining <= 0) {
      return res.render("closed", {
        seatsRemaining,
        message: "Sorry, all seats are taken.",
      });
    }

    const { name, email } = req.body;
    db.query(
      "INSERT INTO registrants (name, email) VALUES (?, ?)",
      [name, email],
      (err) => {
        if (err) return res.status(500).send("Database error");
        res.render("closed", {
          seatsRemaining: seatsRemaining - 1,
          message: "Thank you for registering!",
        });
      }
    );
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
