import { promises as fs } from 'fs';
import path from 'path';

export function generateDateCombinations(
  startDate: string,
  endDate: string,
  tripDuration: number
): [string, string][] {
  const combinations: [string, string][] = [];
  let currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);

  while (
    currentDate <=
    new Date(endDateObj.getTime() - tripDuration * 24 * 60 * 60 * 1000)
  ) {
    const departureDate = formatDate(currentDate);
    const returnDate = formatDate(
      new Date(currentDate.getTime() + tripDuration * 24 * 60 * 60 * 1000)
    );

    if (new Date(returnDate) <= endDateObj) {
      combinations.push([departureDate, returnDate]);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return combinations;
}

// Helper function to format Date to "YYYY-MM-DD" string
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const formatDuration = (minutes?: number) => {
  if (typeof minutes !== 'number' || isNaN(minutes)) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const formatDateTime = (dateTimeString?: string) => {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

export function reorganizeFlightData(data) {
  const resultMap = new Map();

  // const length = data.length;

  data.forEach((item) => {
    const tripType = item.roundtrips ? 'roundtrips' : 'multiCity';
    const { outbound_date, return_date } = item[tripType];
    const key = `${outbound_date}_${return_date}`;

    if (!resultMap.has(key)) {
      resultMap.set(key, {
        outbound_date,
        return_date,
        roundtrips: null,
        multiCity: null,
      });
    }

    const entry = resultMap.get(key);

    // Always process the data, overwriting any existing data
    entry[tripType] = {
      outbound_google_flights_url: item[tripType].outboundGoogleFlightsUrl,
      flights: processFlights(item[tripType]),
    };

    if (tripType === 'roundtrips') {
      entry[tripType].typicalPriceRange = item[tripType].typicalPriceRange;
    }
  });

  return Array.from(resultMap.values());
}

function cleanFlightData(flights) {
  return flights.map((flight) => ({
    departure: {
      airport: flight.departure_airport.id,
      time: flight.departure_airport.time,
    },
    arrival: {
      airport: flight.arrival_airport.id,
      time: flight.arrival_airport.time,
    },
    duration: flight.duration,
    airline: flight.airline,
    airline_logo: flight.airline_logo,
    flight_number: flight.flight_number,
    ...(flight.often_delayed_by_over_30_min && {
      often_delayed_by_over_30_minutes: true,
    }),
  }));
}

function processFlights(tripData) {
  const flights =
    tripData.outboundFlights?.flatMap((outboundFlight) =>
      (outboundFlight.returnFlights || []).map((returnFlight) => ({
        outbound: cleanFlightData(outboundFlight.outboundFlight.flights),
        return: cleanFlightData(returnFlight.returnFlight.flights),
        totalPrice: returnFlight.totalPrice,
        totalDuration:
          outboundFlight.outboundFlight.total_duration +
          returnFlight.returnFlight.total_duration,
      }))
    ) || [];

  const directFlights = flights.filter(
    (flight) => flight.outbound.length === 1 && flight.return.length === 1
  );

  return (directFlights.length > 0 ? directFlights : flights)
    .sort((a, b) => a.totalPrice - b.totalPrice)
    .slice(0, 5);
}

export async function saveToJsonFile(
  data: unknown,
  filename: string
): Promise<void> {
  const filePath = path.join(process.cwd(), 'flight_data', filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved results to ${filePath}`);
}

export function filterAndPrioritizeFlights(flights, typicalPriceRange) {
  if (!flights || !Array.isArray(flights) || flights.length === 0) {
    console.warn('No flights data available to filter and prioritize');
    return [];
  }

  const directFlights = flights.filter(
    (flight) => flight.legs && flight.legs.length === 1
  );
  const flightsWithLayovers = flights.filter(
    (flight) => flight.legs && flight.legs.length > 1
  );

  let prioritizedFlights = directFlights.length > 0 ? directFlights : flights;

  if (
    typicalPriceRange &&
    Array.isArray(typicalPriceRange) &&
    typicalPriceRange.length === 2
  ) {
    const [minPrice, maxPrice] = typicalPriceRange.map((price) =>
      parseFloat(price.replace(/[^0-9.]/g, ''))
    );
    const filteredFlights = prioritizedFlights.filter((flight) => {
      if (!flight.price) return false;
      const flightPrice = parseFloat(flight.price.replace(/[^0-9.]/g, ''));
      return (
        !isNaN(flightPrice) &&
        flightPrice >= minPrice &&
        flightPrice <= maxPrice
      );
    });
    prioritizedFlights =
      filteredFlights.length > 0 ? filteredFlights : prioritizedFlights;
  }

  return prioritizedFlights;
}

export function removeDateTimezone(date) {
  // Create a new Date object using only the year, month, and day
  const dateWithoutTimezone = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  // Convert to ISO string and remove the time portion
  return dateWithoutTimezone.toISOString().split('T')[0];
}
