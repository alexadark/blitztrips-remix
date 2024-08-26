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
        entry[tripType].flights.push({
          outbound: outboundFlight.outboundFlight,
          return: returnFlight.returnFlight,
          totalPrice: returnFlight.totalPrice,
          totalDuration:
            outboundFlight.outboundFlight.total_duration +
            returnFlight.returnFlight.total_duration,
        });
      });
    });

    // Calculate average duration and remove significantly longer flights
    const avgDuration =
      entry[tripType].flights.reduce(
        (sum, flight) => sum + flight.totalDuration,
        0
      ) / entry[tripType].flights.length;
    const durationThreshold = avgDuration * 1.2; // Flights 50% longer than average are considered significantly longer
    entry[tripType].flights = entry[tripType].flights.filter(
      (flight) => flight.totalDuration <= durationThreshold
    );

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
