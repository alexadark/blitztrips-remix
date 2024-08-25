import { getJson } from 'serpapi';
import fs from 'fs/promises';
import path from 'path';
import { formatDate } from './helper-functions';
import { generateId } from 'ai';

const API_KEY = process.env.SERPAPI_API_KEY;

const commonParams = {
  api_key: API_KEY,
  engine: 'google_flights',
  hl: 'en',
  currency: 'USD',
};

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

  const results = [];
  let overallTypicalPriceRange: [number, number] | null = null;

  const departureIds = homeTownIataCodes.join(',');
  const arrivalIds = entryCityIataCodes.join(',');

  for (const [departureDate, returnDate] of dateCombinations) {
    const roundTripParams = {
      ...commonParams,
      adults: adults,
      children: children,
      infants_in_seat: infants,
      departure_id: departureIds,
      arrival_id: arrivalIds,
      type: '1', // Round trip
      outbound_date: formatDate(departureDate),
      return_date: formatDate(returnDate),
    };
    try {
      // Fetch outbound flights
      const outboundResults = await getJson(roundTripParams);

      // Save outbound results to a JSON file
      await saveToJsonFile(
        outboundResults,
        `outbound_results_${formatDate(departureDate)}.json`
      );

      const outboundGoogleFlightsUrl =
        outboundResults.search_metadata.google_flights_url;

      // Store the typical price range if available
      const typicalPriceRange =
        outboundResults.price_insights?.typical_price_range || null;
      if (
        typicalPriceRange &&
        (!overallTypicalPriceRange ||
          typicalPriceRange[0] < overallTypicalPriceRange[0])
      ) {
        overallTypicalPriceRange = typicalPriceRange;
      }

      const dateCombinationResults = {
        departureDate,
        returnDate,
        typicalPriceRange,
        outboundGoogleFlightsUrl,
        outboundFlights: [],
      };

      // Filter and sort outbound flights
      const allOutboundFlights = [
        ...(outboundResults.best_flights || []),
        ...(outboundResults.other_flights || []),
      ];
      const filteredOutboundFlights = allOutboundFlights
        .filter((flight) => !flight.layovers || flight.layovers.length === 0)
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);

      for (const outboundFlight of filteredOutboundFlights) {
        // Fetch return flights for each outbound flight using the departure_token
        const returnResults = await getJson({
          ...roundTripParams,
          departure_token: outboundFlight.departure_token,
        });

        // Save return results to a JSON file
        await saveToJsonFile(
          returnResults,
          `return_results_${formatDate(returnDate)}_${generateId()}.json`
        );

        const returnGoogleFlightsUrl =
          returnResults.search_metadata.google_flights_url;

        // Combine and filter return flights
        const allReturnFlights = [
          ...(returnResults.best_flights || []),
          ...(returnResults.other_flights || []),
        ];
        const filteredReturnFlights = allReturnFlights
          .filter(
            (flight) =>
              flight.price >= typicalPriceRange[0] &&
              flight.price <= typicalPriceRange[1] &&
              (!flight.layovers || flight.layovers.length === 0)
          )
          .sort((a, b) => a.price - b.price)
          .slice(0, 5);

        dateCombinationResults.outboundFlights.push({
          outbound: outboundFlight,
          returnFlights: filteredReturnFlights.map((returnFlight) => ({
            return: returnFlight,
            totalPrice: returnFlight.price,
            totalDuration:
              outboundFlight.total_duration + returnFlight.total_duration,
            outbound_google_flights_url: outboundGoogleFlightsUrl,
            return_google_flights_url: returnGoogleFlightsUrl,
          })),
        });
      }

      results.push(dateCombinationResults);
    } catch (error) {
      console.error('Error fetching flight data:', error);
      // You might want to implement a retry mechanism or skip this combination
    }
  }

  // Save the final results to a JSON file
  const fileName = 'final_round_trip_results.json';
  const filePath = path.join(process.cwd(), 'flight_data', fileName);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify({ results, overallTypicalPriceRange }, null, 2)
  );

  console.log(`Saved final round-trip results to ${filePath}`);

  return { results, overallTypicalPriceRange };
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

  const results = [];
  let typicalPriceRange: [number, number] | null = null;

  const departureIds = homeTownIataCodes.join(',');
  const arrivalIds = entryCityIataCodes.join(',');
  const returnDepartureIds = departureCityIataCodes.join(',');

  for (const [departureDate, returnDate] of dateCombinations) {
    const multiCityJson = [
      {
        departure_id: departureIds,
        arrival_id: arrivalIds,
        date: formatDate(departureDate),
      },
      {
        departure_id: returnDepartureIds,
        arrival_id: departureIds,
        date: formatDate(returnDate),
      },
    ];

    try {
      // First leg
      const firstLegParams = {
        ...commonParams,
        adults: adults,
        children: children,
        infants_in_seat: infants,
        type: '3', // Multi-city
        multi_city_json: JSON.stringify(multiCityJson),
      };

      const firstLegResults = await getJson(firstLegParams);

      // Store the typical price range if available
      typicalPriceRange =
        firstLegResults.price_insights?.typical_price_range || null;

      await saveToJsonFile(
        firstLegResults,
        `raw_multi_city_results_first_leg_${formatDate(
          departureDate
        )}_${formatDate(returnDate)}.json`
      );

      const dateCombinationResults = [];

      for (const firstLegFlight of firstLegResults.best_flights) {
        // Second leg
        const secondLegParams = {
          ...firstLegParams,
          departure_token: firstLegFlight.departure_token,
        };

        const secondLegResults = await getJson(secondLegParams);

        // Save second leg raw results
        await saveToJsonFile(
          secondLegResults,
          `raw_multi_city_results_second_leg_${formatDate(
            departureDate
          )}_${formatDate(returnDate)}.json`
        );

        // Combine first and second leg flights
        if (
          secondLegResults.best_flights &&
          secondLegResults.best_flights.length > 0
        ) {
          for (const secondLegFlight of secondLegResults.best_flights) {
            dateCombinationResults.push({
              outbound: firstLegFlight,
              return: secondLegFlight,
              totalPrice: secondLegFlight.price,
              totalDuration:
                firstLegFlight.total_duration + secondLegFlight.total_duration,
              outbound_google_flights_url:
                firstLegResults.search_metadata.google_flights_url,
              return_google_flights_url:
                secondLegResults.search_metadata.google_flights_url,
            });
          }
        }
      }

      results.push({
        departureDate,
        returnDate,
        typicalPriceRange,
        outboundGoogleFlightsUrl:
          firstLegResults.search_metadata.google_flights_url,
        flightPairs: dateCombinationResults,
      });
    } catch (error) {
      console.error(
        `Error fetching multi-city flights for ${formatDate(
          departureDate
        )} - ${formatDate(returnDate)}:`,
        error
      );
    }
  }

  // Save results with typicalPriceRange
  await saveToJsonFile(
    { results, typicalPriceRange },
    'multi_city_results.json'
  );

  console.log('All raw results and combined results saved.');

  return { results, typicalPriceRange };
}

// Helper function to save data to a JSON file
async function saveToJsonFile(data: any, filename: string) {
  const filePath = path.join(process.cwd(), 'flight_data', filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved results to ${filePath}`);
}
