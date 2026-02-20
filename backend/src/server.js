import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from "express";
import notesRoutes from "./routes/notesRoutes.js";
import { connectionDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// connect to database
connectionDB();

// middleware
app.use(express.json());

app.use("/api/notes", notesRoutes);

app.listen(PORT, () => {
    console.log("server started on PORT: ", PORT);
});