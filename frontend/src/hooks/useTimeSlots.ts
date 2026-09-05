"use client";

import { useEffect, useState, useMemo } from "react";
import {
    generateSlots,
    isSunday,
    isToday,
    toMinutes,
    getNowMinutes,
} from "@/lib/utils";
import type { Booking } from "@/types/booking";

const OPEN_TIME = 7;
const CLOSE_TIME = 20;

export function useTimeSlots(barberId: string, date: string) {
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState("");
    const [isHoliday, setIsHoliday] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const availableSlots = useMemo(() => {
        if (isHoliday || isSunday(date)) return [];

        const allSlots = generateSlots(OPEN_TIME, CLOSE_TIME);

        let freeSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

        if (isToday(date)) {
            const now = getNowMinutes();
            freeSlots = freeSlots.filter(
                (freeSlot) =>
                    toMinutes(freeSlot) > now &&
                    toMinutes(freeSlot) - now >= 30,
            );
        }

        return freeSlots;
    }, [isHoliday, date, bookedSlots]);

    useEffect(() => {
        setSelectedTime("");
    }, [date]);

    useEffect(() => {
        if (!barberId || !date) return;

        async function fetchBookedSlots() {
            try {
                setIsLoading(true);
                setError(null);

                const res = await fetch(
                    `/api/availability?barberId=${encodeURIComponent(barberId)}${
                        date ? `&date=${encodeURIComponent(date)}` : ""
                    }`,
                );

                if (!res.ok) {
                    throw new Error("Failed to load availability");
                }

                const data: {
                    slots: Booking[];
                    isHoliday: boolean;
                } = await res.json();

                setIsHoliday(data.isHoliday);

                if (data.isHoliday) {
                    setBookedSlots([]);
                    setError("Closed on holidays");
                    return;
                }

                if (isSunday(date)) {
                    setBookedSlots([]);
                    setError("Closed on Sunday");
                    return;
                }

                const alreadyBooked = data.slots.map(
                    (booking: Booking) => booking.time,
                );
                setBookedSlots(alreadyBooked);
            } catch (err) {
                console.error(err);
                setError("Unable to retrieve slots.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchBookedSlots();
    }, [barberId, date]);

    useEffect(() => {
        if (isToday(date) && availableSlots.length === 0) {
            setError("There are no available slots for today.");
        }
    }, [date, availableSlots]);

    return {
        availableSlots,
        bookedSlots,
        selectedTime,
        setSelectedTime,
        isLoading,
        error,
    };
}
