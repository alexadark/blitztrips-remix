export function generateDateCombinations(
  startDate: Date,
  endDate: Date,
  tripDuration: number
): [Date, Date][] {
  const combinations: [Date, Date][] = [];
  let currentDate = new Date(startDate);

  while (
    currentDate <=
    new Date(endDate.getTime() - tripDuration * 24 * 60 * 60 * 1000)
  ) {
    const departureDate = new Date(currentDate);
    const returnDate = new Date(
      departureDate.getTime() + tripDuration * 24 * 60 * 60 * 1000
    );

    if (returnDate <= endDate) {
      combinations.push([departureDate, returnDate]);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return combinations;
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
    entry[tripType] = {
      outbound_google_flights_url: item[tripType].outboundGoogleFlightsUrl,
      return_google_flights_url:
        item[tripType].outboundFlights[0].return_google_flights_url,
      flights: [],
    };

    item[tripType].outboundFlights.forEach((outboundFlight) => {
      outboundFlight.returnFlights.forEach((returnFlight) => {
        const cleanedOutbound = cleanFlightData(
          outboundFlight.outboundFlight.flights
        );
        const cleanedReturn = cleanFlightData(
          returnFlight.returnFlight.flights
        );

        entry[tripType].flights.push({
          outbound: cleanedOutbound,
          return: cleanedReturn,
          totalPrice: returnFlight.totalPrice,
          totalDuration:
            outboundFlight.outboundFlight.total_duration +
            returnFlight.returnFlight.total_duration,
        });
      });
    });

    // Filter flights
    const directFlights = entry[tripType].flights.filter(
      (flight) => flight.outbound.length === 1 && flight.return.length === 1
    );

    if (directFlights.length > 0) {
      entry[tripType].flights = directFlights;
    }

    // Sort flights by total price
    entry[tripType].flights.sort((a, b) => a.totalPrice - b.totalPrice);

    // Keep only the top 5 flights
    entry[tripType].flights = entry[tripType].flights.slice(0, 5);

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

// Helper function to save data to a JSON file
export async function saveToJsonFile(data: any, filename: string) {
  const filePath = path.join(process.cwd(), 'flight_data', filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved results to ${filePath}`);
}
