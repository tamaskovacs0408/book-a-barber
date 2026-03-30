import { readFile, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import fetchBarbers from "./barberService.js";
import { apiFetch } from "../lib/utils.js";
import type { WorkSchedule } from "../types/barbers.ts";
import type { PublicHolidays } from "../types/publicHolidays.ts";
import type { Booking } from "../types/bookings.ts";
import { AppError, HttpStatusCode } from "../lib/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const filePath = join(__dirname, "../data/bookings.json");

const WEEKDAYS: (keyof WorkSchedule)[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export async function loadBookings(): Promise<Booking[]> {
  try {
    const bookings = await readFile(filePath, "utf-8");
    return JSON.parse(bookings);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }

    if (error instanceof SyntaxError) {
      console.error("Corrupted bookings.json, falling back to empty list");
      return [];
    }

    throw error;
  }
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  const bookingContent = JSON.stringify(bookings, null, 2);
  await writeFile(filePath, bookingContent, "utf-8");
}

export async function createBooking(bookingData: {
  email: string;
  barberId: string;
  date: string;
  time: string;
}): Promise<Booking> {
  const bookings = await loadBookings();
  const barbers = await fetchBarbers();

  const { email, barberId, date, time } = bookingData;
  if (!email || !email.includes("@")) throw new AppError("Invalid email", HttpStatusCode.BadRequest);
  if (!barberId) throw new AppError("Invalid barberId", HttpStatusCode.BadRequest);
  if (!date || !time) throw new AppError("Invalid datetime", HttpStatusCode.BadRequest);

  const barber = barbers.find(barber => barber.id === barberId);
  if (!barber) throw new AppError("Barber not found", HttpStatusCode.NotFound);

  const bookingDate = new Date(`${date}T${time}`);
  const bookingConflict = bookings.some(
    booking =>
      booking.barberId === barberId &&
      booking.date === date &&
      booking.time === time
  );

  const currentYear = date.slice(0, 4);

  const publicHolidays: PublicHolidays[] = await apiFetch(
    `${process.env.PUBLIC_HOLIDAY_API_URL}/${currentYear}/HU`
  );

  publicHolidays.map(holiday => {
    if (holiday.date === date) throw new AppError("Cannot book on holidays", HttpStatusCode.BadRequest);
  });

  const weekday = bookingDate.getDay();
  if (weekday === 0) {
    throw new AppError("Cannot book on Sundays", HttpStatusCode.BadRequest);
  }

  if (isNaN(bookingDate.getTime())) throw new AppError("Invalid datetime", HttpStatusCode.BadRequest);
  if (bookingDate <= new Date()) throw new AppError("Cannot book for past date", HttpStatusCode.BadRequest);
  if (bookingConflict) throw new AppError("Time slot already booked", HttpStatusCode.Conflict);

  const dayIndex = bookingDate.getDay();
  const dayName = WEEKDAYS[dayIndex];
  const workSchedule = barber.workSchedule[dayName];

  if (!workSchedule) throw new AppError("Barber does not work on this day", HttpStatusCode.BadRequest);
  if (time < workSchedule.start || time >= workSchedule.end)
    throw new AppError("Time outside of barber's working hours", HttpStatusCode.BadRequest);

  const newBooking: Booking = {
    id: randomUUID(),
    email,
    barberId,
    date,
    time,
  };

  bookings.push(newBooking);

  await saveBookings(bookings);

  return newBooking;
}

export async function getBookingsByEmail(email: string): Promise<Booking[]> {
  if (!email) throw new AppError("Email required", HttpStatusCode.BadRequest);

  const bookings = await loadBookings();

  return bookings.filter(booking => booking.email === email);
}

export async function deleteBooking(id: string): Promise<void> {
  if (!id) throw new AppError("Id required", HttpStatusCode.BadRequest);

  const bookings = await loadBookings();

  const existedBooking = bookings.some(booking => booking.id === id);

  if (!existedBooking) throw new AppError("Booking not found", HttpStatusCode.NotFound);

  const updatedBookings = bookings.filter(booking => booking.id !== id);

  await saveBookings(updatedBookings);
}
