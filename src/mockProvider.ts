import { firestoreMock } from "./firestoreMock";
import { Booking } from "./types";

export interface AvailabilityCheckResult {
  available: boolean;
  reason?: string;
  pricePerPersonUSD?: number;
}

export class MockBookingProvider {
  /**
   * Checks availability for an experience.
   */
  async checkAvailability(
    experienceId: string,
    date: string,
    slot: string,
    partySize: number
  ): Promise<AvailabilityCheckResult> {
    console.log(`🔌 [MockProvider] Checking availability for ${experienceId} on ${date} at ${slot} for party of ${partySize}...`);

    const exp = await firestoreMock.experiences.get(experienceId);
    if (!exp) {
      return { available: false, reason: "Experience not found in provider catalog." };
    }

    // Verify slot is supported
    if (!exp.availability.slots.includes(slot)) {
      return {
        available: false,
        reason: `Invalid time slot. Available slots are: ${exp.availability.slots.join(", ")}`,
      };
    }

    // Verify party size limits
    if (partySize > exp.availability.maxCapacity) {
      return {
        available: false,
        reason: `Party size ${partySize} exceeds maximum slot capacity of ${exp.availability.maxCapacity}.`,
      };
    }

    // Fetch existing bookings for this experience/date/slot to calculate remaining capacity
    const bookings = await firestoreMock.bookings.list();
    const activeBookings = bookings.filter(
      (b) =>
        b.experienceId === experienceId &&
        b.bookingDate === date &&
        b.slot === slot &&
        b.status !== "cancelled"
    );

    const currentlyBooked = activeBookings.reduce((sum, b) => sum + b.partySize, 0);
    const remainingCapacity = exp.availability.maxCapacity - currentlyBooked;

    if (partySize > remainingCapacity) {
      return {
        available: false,
        reason: `Fully booked. Only ${remainingCapacity} spots remaining for this slot.`,
      };
    }

    return {
      available: true,
      pricePerPersonUSD: exp.priceUSD,
    };
  }

  /**
   * Creates a confirmed or pending booking.
   */
  async createBooking(
    userId: string,
    experienceId: string,
    date: string,
    slot: string,
    partySize: number
  ): Promise<Booking> {
    console.log(`🔌 [MockProvider] Staging booking for user ${userId}, experience ${experienceId}...`);

    const check = await this.checkAvailability(experienceId, date, slot, partySize);
    if (!check.available) {
      throw new Error(`Booking failed: ${check.reason}`);
    }

    const exp = await firestoreMock.experiences.get(experienceId);
    if (!exp) {
      throw new Error("Experience not found.");
    }

    const totalPrice = (check.pricePerPersonUSD || exp.priceUSD) * partySize;
    const bookingId = `bk_${Math.random().toString(36).substr(2, 9)}`;

    const booking: Booking = {
      id: bookingId,
      userId,
      experienceId,
      experienceName: exp.name,
      bookingDate: date,
      slot,
      partySize,
      totalPriceUSD: totalPrice,
      status: "confirmed", // Stage as confirmed directly for this mock
      createdAt: new Date().toISOString(),
    };

    await firestoreMock.bookings.set(bookingId, booking);
    console.log(`🔌 [MockProvider] Booking successfully created & saved: ${bookingId}`);

    return booking;
  }
}

export const mockBookingProvider = new MockBookingProvider();
