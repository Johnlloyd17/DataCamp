import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from "express";
import notesRoutes from "./routes/notesRoutes.js";
import { connectionDB } from "./config/db.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// connect to database
connectionDB();

// middleware
app.use(express.json());

// Serve static files from frontend, css, js, and images directories
app.use(express.static(path.join(__dirname, "../../frontend")));
app.use(express.static(path.join(__dirname, "../../css")));
app.use(express.static(path.join(__dirname, "../../js")));
app.use(express.static(path.join(__dirname, "../../images")));

// API routes
app.use("/api/notes", notesRoutes);

// Serve index.html for root path
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

// Catch-all to serve index.html for frontend routes (SPA support)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

app.listen(PORT, () => {
    console.log("server started on PORT: ", PORT);
});