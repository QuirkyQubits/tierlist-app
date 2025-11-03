import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import tierListRoutes from "./routes/tierListRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { uploadDir } from "./utils/paths.js";
import itemRoutes from "./routes/itemRoutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(uploadDir));

app.get("/", (_, res) => {
  res.send("Tierlist backend is running 🚀");
});

app.use("/api", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/tierlists", tierListRoutes);
app.use("/api/items", itemRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
