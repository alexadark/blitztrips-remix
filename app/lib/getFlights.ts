import { getJson } from 'serpapi';
import fs from 'fs/promises';
import path from 'path';
import { formatDate } from './helper-functions';

const API_KEY = process.env.SERPAPI_API_KEY;

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
  let typicalPriceRange: [number, number] | null = null;

  const departureIds = homeTownIataCodes.join(',');
  const arrivalIds = entryCityIataCodes.join(',');

  for (const [departureDate, returnDate] of dateCombinations) {
    try {
      // Fetch outbound flights
      const outboundResults = await getJson({
        api_key: API_KEY,
        engine: 'google_flights',
        departure_id: departureIds,
        arrival_id: arrivalIds,
        outbound_date: formatDate(departureDate),
        return_date: formatDate(returnDate),
        type: '1', // Round trip
        adults: adults.toString(),
        children: children.toString(),
        infants_in_seat: infants.toString(),
        hl: 'en',
        currency: 'USD',
      });

      // Save outbound results to a JSON file
      await saveToJsonFile(
        outboundResults,
        `outbound_results_${formatDate(departureDate)}.json`
      );

      const outboundGoogleFlightsUrl =
        outboundResults.search_metadata.google_flights_url;

      // Store the typical price range if available
      if (
        outboundResults.price_insights &&
        outboundResults.price_insights.typical_price_range
      ) {
        typicalPriceRange = outboundResults.price_insights.typical_price_range;
      }

      if (
        outboundResults.best_flights &&
        outboundResults.best_flights.length > 0
      ) {
        for (const outboundFlight of outboundResults.best_flights) {
          // Fetch return flights using the departure_token
          const returnResults = await getJson({
            api_key: API_KEY,
            engine: 'google_flights',
            departure_id: departureIds, // Swap departure and arrival for return flight
            arrival_id: arrivalIds,
            outbound_date: formatDate(departureDate), // Use return date as outbound
            return_date: formatDate(returnDate), // Use departure date as return
            type: '1', // Round trip
            adults: adults.toString(),
            children: children.toString(),
            infants_in_seat: infants.toString(),
            hl: 'en',
            currency: 'USD',
            departure_token: outboundFlight.departure_token,
          });

          // Save return results to a JSON file
          await saveToJsonFile(
            returnResults,
            `return_results_${formatDate(returnDate)}_${
              outboundFlight.departure_token
            }.json`
          );

          const returnGoogleFlightsUrl =
            returnResults.search_metadata.google_flights_url;

          if (
            returnResults.best_flights &&
            returnResults.best_flights.length > 0
          ) {
            for (const returnFlight of returnResults.best_flights) {
              results.push({
                outbound: outboundFlight,
                return: returnFlight,
                totalPrice: returnFlight.price, // Use the price from the return flight
                totalDuration:
                  outboundFlight.total_duration + returnFlight.total_duration,
                outbound_google_flights_url: outboundGoogleFlightsUrl,
                return_google_flights_url: returnGoogleFlightsUrl,
              });
            }
          }
        }
      } else {
        console.log(
          `No flights found for ${departureIds} to ${arrivalIds} on ${formatDate(
            departureDate
          )} - ${formatDate(returnDate)}`
        );
      }
    } catch (error) {
      console.error('Error fetching flight data:', error);
      // You might want to implement a retry mechanism or skip this combination
    }
  }

  // Save the final results to a JSON file
  await saveToJsonFile({ results, typicalPriceRange }, 'final_results.json');

  return { results, typicalPriceRange };
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
        api_key: API_KEY,
        engine: 'google_flights',
        hl: 'en',
        currency: 'USD',
        type: '3', // Multi-city
        adults: adults,
        children: children,
        infants_in_seat: infants,
        multi_city_json: JSON.stringify(multiCityJson),
      };

      const firstLegResults = await getJson(firstLegParams);

      // Store the typical price range if available
      if (
        firstLegResults.price_insights &&
        firstLegResults.price_insights.typical_price_range
      ) {
        typicalPriceRange = firstLegResults.price_insights.typical_price_range;
      }

      await saveToJsonFile(
        firstLegResults,
        `raw_multi_city_results_first_leg_${formatDate(
          departureDate
        )}_${formatDate(returnDate)}.json`
      );

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
            results.push({
              outbound: firstLegFlight,
              return: secondLegFlight,
              totalPrice: secondLegFlight.price, // Use the price from the second leg
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
