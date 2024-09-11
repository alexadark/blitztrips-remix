import { getJson } from 'serpapi';
import { writeFile } from 'fs/promises';
import path from 'path';
import {
  reorganizeFlightData,
  saveToJsonFile,
  filterAndPrioritizeFlights,
} from './helper-functions';

const API_KEY = process.env.SERPAPI_API_KEY;
const MAX_OUTBOUND_FLIGHTS = 5;
const MAX_RETURN_FLIGHTS = 5;

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
  dateCombinations: [string, string][],
  adults: number,
  children: number,
  infants: number
) {
  if (!API_KEY) {
    throw new Error('SERPAPI_API_KEY is not set in environment variables');
  }

  const departureIds = homeTownIataCodes.join(',');
  const arrivalIds = entryCityIataCodes.join(',');

  for (const dates of dateCombinations) {
    const result = await processDateCombination(
      dates,
      departureIds,
      arrivalIds,
      adults,
      children,
      infants
    );
    if (result) results.push(result);
  }

  await saveResultsToFile(results, 'roundtrip_flights.json');
  return { results };
}

async function processDateCombination(
  [outbound_date, return_date]: [string, string],
  departureIds: string,
  arrivalIds: string,
  adults: number,
  children: number,
  infants: number
) {
  const roundTripParams = {
    ...commonParams,
    adults,
    children,
    infants_in_seat: infants,
    departure_id: departureIds,
    arrival_id: arrivalIds,
    type: '1',
    outbound_date,
    return_date,
  };

  try {
    const outboundResults = await getJson(roundTripParams);
    console.log(`Got roundtrip outbound flights for ${outbound_date}`);
    const outboundGoogleFlightsUrl =
      outboundResults.search_metadata.google_flights_url;
    const typicalPriceRange =
      outboundResults.price_insights?.typical_price_range || null;
    const outboundFlights = outboundResults.best_flights;

    const outboundFlightsWithReturns = [];
    for (let i = 0; i < outboundFlights.length; i++) {
      const processedFlight = await processOutboundFlight(
        outboundFlights[i],
        roundTripParams,
        outboundGoogleFlightsUrl
      );
      outboundFlightsWithReturns.push(processedFlight);
      console.log(
        `Processed roundtrip outbound flight ${i + 1}/${
          outboundFlights.length
        } for ${outbound_date}`
      );
    }

    return {
      roundtrips: {
        outbound_date,
        return_date,
        typicalPriceRange,
        outboundGoogleFlightsUrl,
        outboundFlights: outboundFlightsWithReturns,
      },
    };
  } catch (error) {
    console.error('Error fetching flight data:', error);
    return null;
  }
}

async function processOutboundFlight(
  outboundFlight,
  roundTripParams,
  outboundGoogleFlightsUrl
) {
  const returnResults = await getJson({
    ...roundTripParams,
    departure_token: outboundFlight.departure_token,
  });

  const returnGoogleFlightsUrl =
    returnResults.search_metadata.google_flights_url;
  const allReturnFlights = [
    ...(returnResults.best_flights || []),
    ...(returnResults.other_flights || []),
  ];

  return {
    outboundFlight,
    outbound_google_flights_url: outboundGoogleFlightsUrl,
    return_google_flights_url: returnGoogleFlightsUrl,
    returnFlights: allReturnFlights.map((returnFlight) => ({
      returnFlight,
      totalPrice: returnFlight.price,
      totalDuration:
        outboundFlight.total_duration + returnFlight.total_duration,
    })),
  };
}

export async function getMultiCityFlights(
  homeTownIataCodes: string[],
  entryCityIataCodes: string[],
  departureCityIataCodes: string[],
  dateCombinations: [string, string][],
  adults: number,
  children: number,
  infants: number
) {
  if (!API_KEY) {
    throw new Error('SERPAPI_API_KEY is not set in environment variables');
  }

  const departureIds = homeTownIataCodes.join(',');
  const arrivalIds = entryCityIataCodes.join(',');
  const returnDepartureIds = departureCityIataCodes.join(',');
  // const results = [];

  for (const dates of dateCombinations) {
    const result = await processMultiCityDateCombination(
      dates,
      departureIds,
      arrivalIds,
      returnDepartureIds,
      adults,
      children,
      infants
    );
    if (result) results.push(result);
  }
  const reorganizedResults = reorganizeFlightData(results);
  await saveResultsToFile(reorganizedResults, 'final_new_flights.json');
  return { results: reorganizedResults };
}

async function processMultiCityDateCombination(
  [outbound_date, return_date]: [string, string],
  departureIds: string,
  arrivalIds: string,
  returnDepartureIds: string,
  adults: number,
  children: number,
  infants: number
) {
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

  const firstLegParams = {
    ...commonParams,
    adults,
    children,
    infants_in_seat: infants,
    type: '3',
    multi_city_json: JSON.stringify(multiCityJson),
  };

  try {
    const outboundResults = await getJson(firstLegParams);
    console.log(`Got multi-city outbound flights for ${outbound_date}`);
    const outboundGoogleFlightsUrl =
      outboundResults.search_metadata.google_flights_url;
    let outboundFlights = [
      ...outboundResults.best_flights,
      ...outboundResults.other_flights,
    ];

    outboundFlights = filterAndPrioritizeFlights(
      outboundFlights,
      outboundResults.price_insights?.typical_price_range || null
    );
    outboundFlights = outboundFlights.slice(0, MAX_OUTBOUND_FLIGHTS);

    const dateCombinationResults = {
      multiCity: {
        outbound_date,
        return_date,
        outboundGoogleFlightsUrl,
        outboundFlights: [],
      },
    };

    for (let i = 0; i < outboundFlights.length; i++) {
      const processedFlight = await processMultiCityOutboundFlight(
        outboundFlights[i],
        firstLegParams,
        outboundGoogleFlightsUrl
      );
      dateCombinationResults.multiCity.outboundFlights.push(processedFlight);
      console.log(
        `Processed multi-city outbound flight ${i + 1}/${
          outboundFlights.length
        } for ${outbound_date}`
      );
    }

    return dateCombinationResults;
  } catch (error) {
    console.error(
      `Error fetching multi-city flights for ${outbound_date} - ${return_date}:`,
      error
    );
    return null;
  }
}

async function processMultiCityOutboundFlight(
  outboundFlight,
  firstLegParams,
  outboundGoogleFlightsUrl
) {
  const returnFlights = await getJson({
    ...firstLegParams,
    departure_token: outboundFlight.departure_token,
  });

  const returnGoogleFlightsUrl =
    returnFlights.search_metadata.google_flights_url;

  const allReturnFlights = [
    ...(returnFlights.best_flights || []),
    ...(returnFlights.other_flights || []),
  ];

  return {
    outboundFlight,
    outbound_google_flights_url: outboundGoogleFlightsUrl,
    return_google_flights_url: returnGoogleFlightsUrl,
    returnFlights: allReturnFlights.map((returnFlight) => ({
      returnFlight,
      totalPrice: returnFlight.price,
      totalDuration:
        outboundFlight.total_duration + returnFlight.total_duration,
    })),
  };
}

async function saveResultsToFile(results, filename) {
  try {
    const resultsFilePath = path.join(process.cwd(), filename);
    await writeFile(resultsFilePath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${resultsFilePath}`);
  } catch (error) {
    console.error('Error saving results to file:', error);
  }
}
