import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Tierlist backend is running 🚀 (TypeScript + PostgreSQL + Prisma)");
});

app.get("/api/tierlists", async (req: Request, res: Response) => {
  const lists = await prisma.tierList.findMany();
  res.json(lists);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
