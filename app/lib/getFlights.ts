import { getJson } from 'serpapi';

import { format } from 'date-fns';
import { reorganizeFlightData, saveToJsonFile } from './helper-functions';

const API_KEY = process.env.SERPAPI_API_KEY;

const commonParams = {
  api_key: API_KEY,
  engine: 'google_flights',
  hl: 'en',
  currency: 'USD',
};
let results = [];
export async function getRoundTripFlights(
  homeTownIataCodes: string[],
  entryCityIataCodes: string[],
  dateCombinations: [Date, Date][],
  adults: number,
  children: number,
  infants: number
) {
  if (!API_KEY) {
    throw new Error('SERPAPI_API_KEY is not set in environment variables');
  }

  const departureIds = homeTownIataCodes.join(',');
  const arrivalIds = entryCityIataCodes.join(',');

  //Loop around each date combination
  for (const [departureDate, returnDate] of dateCombinations) {
    const outbound_date = format(departureDate, 'yyyy-MM-dd');
    const return_date = format(returnDate, 'yyyy-MM-dd');
    const roundTripParams = {
      ...commonParams,
      adults: adults,
      children: children,
      infants_in_seat: infants,
      departure_id: departureIds,
      arrival_id: arrivalIds,
      type: '1', // Round trip
      outbound_date,
      return_date,
    };
    try {
      // Fetch outbound flights
      const outboundResults = await getJson(roundTripParams);

      const outboundGoogleFlightsUrl =
        outboundResults.search_metadata.google_flights_url;

      // Store the typical price range if available
      const typicalPriceRange =
        outboundResults.price_insights?.typical_price_range || null;

      // Filter and sort outbound flights
      const outboundFlights = outboundResults.best_flights;

      const dateCombinationResults = {
        roundtrips: {
          outbound_date,
          return_date,
          typicalPriceRange,
          outboundGoogleFlightsUrl,
          outboundFlights: [],
        },
      };

      for (const outboundFlight of outboundFlights) {
        // Fetch return flights for each outbound flight using the departure_token
        const returnResults = await getJson({
          ...roundTripParams,
          departure_token: outboundFlight.departure_token,
        });

        const returnGoogleFlightsUrl =
          returnResults.search_metadata.google_flights_url;

        // Combine and filter return flights
        const allReturnFlights = [
          ...(returnResults.best_flights || []),
          ...(returnResults.other_flights || []),
        ];

        //Push the outbound flight and his return flights to the date combination results, the outboundFlights will be an array of objects with the outbound flight and his return flights
        dateCombinationResults.roundtrips.outboundFlights.push({
          outboundFlight,
          outbound_google_flights_url: outboundGoogleFlightsUrl,
          return_google_flights_url: returnGoogleFlightsUrl,
          returnFlights: allReturnFlights.map((returnFlight) => ({
            returnFlight,
            totalPrice: returnFlight.price,
            totalDuration:
              outboundFlight.total_duration + returnFlight.total_duration,
          })),
        });
      }

      results.push(dateCombinationResults);
    } catch (error) {
      console.error('Error fetching flight data:', error);
      // You might want to implement a retry mechanism or skip this combination
    }
  }

  return { results };
}

export async function getMultiCityFlights(
  homeTownIataCodes: string[],
  entryCityIataCodes: string[],
  departureCityIataCodes: string[],
  dateCombinations: [Date, Date][],
  adults: number,
  children: number,
  infants: number
) {
  if (!API_KEY) {
    throw new Error('SERPAPI_API_KEY is not set in environment variables');
  }

  // const results = [];

  const departureIds = homeTownIataCodes.join(',');
  const arrivalIds = entryCityIataCodes.join(',');
  const returnDepartureIds = departureCityIataCodes.join(',');

  for (const [departureDate, returnDate] of dateCombinations) {
    const outbound_date = format(departureDate, 'yyyy-MM-dd');
    const return_date = format(returnDate, 'yyyy-MM-dd');
    const multiCityJson = [
      {
        departure_id: departureIds,
        arrival_id: arrivalIds,
        date: outbound_date,
      },
      {
        departure_id: returnDepartureIds,
        arrival_id: departureIds,
        date: return_date,
      },
    ];
    // First leg
    const firstLegParams = {
      ...commonParams,
      adults,
      children,
      infants_in_seat: infants,
      type: '3', // Multi-city
      multi_city_json: JSON.stringify(multiCityJson),
    };

    try {
      const outboundResults = await getJson(firstLegParams);

      const outboundGoogleFlightsUrl =
        outboundResults.search_metadata.google_flights_url;

      const outboundFlights = outboundResults.best_flights;

      const dateCombinationResults = {
        multiCity: {
          outbound_date,
          return_date,
          outboundGoogleFlightsUrl,
          outboundFlights: [],
        },
      };

      for (const outboundFlight of outboundFlights) {
        // Second leg = Fetch return flights for each outbound flight using the departure_token
        const returnFlights = await getJson({
          ...firstLegParams,
          departure_token: outboundFlight.departure_token,
        });

        const returnGoogleFlightsUrl =
          returnFlights.search_metadata.google_flights_url;

        // Combine and filter return flights
        const allReturnFlights = [
          ...(returnFlights.best_flights || []),
          ...(returnFlights.other_flights || []),
        ];

        dateCombinationResults.multiCity.outboundFlights.push({
          outboundFlight,
          outbound_google_flights_url: outboundGoogleFlightsUrl,
          return_google_flights_url: returnGoogleFlightsUrl,
          returnFlights: allReturnFlights.map((returnFlight) => ({
            returnFlight,
            totalPrice: returnFlight.price,
            totalDuration:
              outboundFlight.total_duration + returnFlight.total_duration,
          })),
        });
      }

      results.push(dateCombinationResults);
    } catch (error) {
      console.error(
        `Error fetching multi-city flights for ${format(
          departureDate,
          'yyyy-MM-dd'
        )} - ${format(returnDate, 'yyyy-MM-dd')}:`,
        error
      );
    }
  }

  // Save raw results to file
  await saveToJsonFile(results, 'rawFlights.json');

  // Reorganize flight data
  results = reorganizeFlightData(results);

  return { results };
}
