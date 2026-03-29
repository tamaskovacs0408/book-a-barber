import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { authenticate } from "./middlewares/auth.js";
import barbersRouter from "./routes/barbers.js";
import bookingsRouter from "./routes/bookings.js";
import publicHolidayRouter from "./routes/publicHolidays.js"
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "book a barber backend",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/public-holidays", publicHolidayRouter);

app.use(authenticate);

app.use("/api/barbers", barbersRouter);
app.use("/api/booking", bookingsRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (err.message === "Invalid email") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Invalid barberId") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Invalid datetime") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Cannot book for past date") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Cannot book on holidays") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Cannot book on Sundays") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Barber not found") {
    return res.status(404).json({ message: err.message });
  }

  if (err.message === "Barber does not work on this day") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Time outside of barber's working hours") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Time slot already booked") {
    return res.status(409).json({ message: err.message });
  }

  if (err.message === "Booking not found") {
    return res.status(404).json({ message: err.message });
  }

  if (err.message === "Id required") {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
});

export { app };

export default app;
