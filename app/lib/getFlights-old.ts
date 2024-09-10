import { getJson } from 'serpapi';
import { format } from 'date-fns';
import {
  reorganizeFlightData,
  saveToJsonFile,
  filterAndPrioritizeFlights,
} from './helper-functions';
import pLimit from 'p-limit';

const API_KEY = process.env.SERPAPI_API_KEY;
const MAX_OUTBOUND_FLIGHTS = 5; // Limit the number of outbound flights to process
const CONCURRENCY_LIMIT = 3; // Limit concurrent API calls

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
  const limit = pLimit(CONCURRENCY_LIMIT);

  results = await Promise.all(
    dateCombinations.map((dates) =>
      limit(() =>
        processDateCombination(
          dates,
          departureIds,
          arrivalIds,
          adults,
          children,
          infants
        )
      )
    )
  );

  return { results: results.filter(Boolean) };
}

async function processDateCombination(
  [departureDate, returnDate]: [Date, Date],
  departureIds: string,
  arrivalIds: string,
  adults: number,
  children: number,
  infants: number
) {
  const outbound_date = format(departureDate, 'yyyy-MM-dd');
  const return_date = format(returnDate, 'yyyy-MM-dd');
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
    const outboundGoogleFlightsUrl =
      outboundResults.search_metadata.google_flights_url;
    const typicalPriceRange =
      outboundResults.price_insights?.typical_price_range || null;
    const outboundFlights = outboundResults.best_flights;

    const outboundFlightsWithReturns = await Promise.all(
      outboundFlights.map((outboundFlight) =>
        processOutboundFlight(
          outboundFlight,
          roundTripParams,
          outboundGoogleFlightsUrl
        )
      )
    );

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
  const returnDepartureIds = departureCityIataCodes.join(',');
  const limit = pLimit(CONCURRENCY_LIMIT);

  const multiCityResults = await Promise.all(
    dateCombinations.map((dates) =>
      limit(() =>
        processMultiCityDateCombination(
          dates,
          departureIds,
          arrivalIds,
          returnDepartureIds,
          adults,
          children,
          infants
        )
      )
    )
  );
  results.push(...multiCityResults);
  // This line filters out any falsy values (null, undefined, etc.) from the results array.
  // It's likely unnecessary if we're sure all results are valid, and may hide potential issues.
  // Consider removing this line if all results should be valid, or add explicit error handling.
  const filteredResults = results.filter(Boolean);

  // Save raw results to file
  await saveToJsonFile(filteredResults, 'rawFlights.json');

  // Reorganize flight data
  const reorganizedResults = reorganizeFlightData(filteredResults);

  return { results: reorganizedResults };
}

async function processMultiCityDateCombination(
  [departureDate, returnDate]: [Date, Date],
  departureIds: string,
  arrivalIds: string,
  returnDepartureIds: string,
  adults: number,
  children: number,
  infants: number
) {
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
    let outboundFlights = [
      ...outboundResults.best_flights,
      ...outboundResults.other_flights,
    ];
    // console.log('outboundFlights', outboundFlights);
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

    const processedOutboundFlights = await Promise.all(
      outboundFlights.map((outboundFlight) =>
        processMultiCityOutboundFlight(
          outboundFlight,
          firstLegParams,
          outboundGoogleFlightsUrl
        )
      )
    );

    dateCombinationResults.multiCity.outboundFlights = processedOutboundFlights;

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
