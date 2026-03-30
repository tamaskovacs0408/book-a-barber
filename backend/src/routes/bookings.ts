import { Router } from "express";
import {
  createBooking,
  deleteBooking,
  getBookingsByEmail,
  loadBookings,
} from "../services/bookingService.js";
import { AppError, HttpStatusCode } from "../lib/utils.js";

const router = Router();

/**
 * @openapi
 * /api/booking:
 *   post:
 *     summary: Create a new booking
 *     tags:
 *       - Bookings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - barberId
 *               - date
 *               - time
 *             properties:
 *               email:
 *                 type: string
 *               barberId:
 *                 type: string
 *               date:
 *                 type: string
 *               time:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created
 *       400:
 *         description: Invalid input or past date
 *       409:
 *         description: Time slot already booked
 *       500:
 *         description: Internal server error
 */
router.post("/", async (req, res) => {
  const { email, barberId, date, time } = req.body;

  const newBooking = await createBooking({ email, barberId, date, time });

  res.status(201).json(newBooking);
});

/**
 * @openapi
 * /api/booking:
 *   get:
 *     summary: Get bookings by email or barber
 *     description: |
 *       Returns bookings based on query parameters.
 *
 *       - If `email` is provided, returns all bookings for the given email.
 *       - If `barberId` is provided, returns all bookings for that barber.
 *       - If both `barberId` and `date` are provided, returns bookings for that barber on the given date.
 *
 *       At least one of `email` or `barberId` must be provided.
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: query
 *         name: email
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: barberId
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   email:
 *                     type: string
 *                   barberId:
 *                     type: string
 *                   date:
 *                     type: string
 *                   time:
 *                     type: string
 *       400:
 *         description: Missing or invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get("/", async (req, res) => {
  const { email, barberId, date } = req.query;

  if (email) {
    const bookings = await getBookingsByEmail(email as string);

    return res.status(200).json(bookings);
  }

  if (barberId) {
    const bookings = await loadBookings();
    const filteredBookings = bookings.filter(
      booking =>
        booking.barberId === barberId && (!date || booking.date === date)
    );

    return res.status(200).json(filteredBookings);
  }

  return res.status(400).json({ message: "Email or barberId query parameter is required"})
});

/**
 * @openapi
 * /api/booking/{id}:
 *   delete:
 *     summary: Delete a booking by ID
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Booking deleted
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Id required", HttpStatusCode.BadRequest);
    }

    await deleteBooking(id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
