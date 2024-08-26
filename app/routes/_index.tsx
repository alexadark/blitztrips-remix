import type { ActionFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { tavilySearch } from '~/lib/tavily';
import { itinerarySchema } from '~/lib/schemas';
import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import ItineraryForm from '~/components/ItineraryForm';
import { generateDateCombinations } from '~/lib/helper-functions';
import { format } from 'date-fns';
import { useActionData } from '@remix-run/react';
import fs from 'fs/promises';
import { getRoundTripFlights, getMultiCityFlights } from '~/lib/getFlights';
// import { FlightResults } from '~/components/FlightResults';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const homeTown = formData.get('homeTown') as string;
  const entryCity = formData.get('entryCity') as string;
  const departureCity = formData.get('departureCity') as string;
  const travelDates = formData.get('travelDates') as string;
  const numAdults = Math.max(
    0,
    parseInt(formData.get('numAdults') as string, 10) || 0
  );
  const budget = parseFloat(formData.get('budget') as string);
  const children = Math.max(
    0,
    parseInt(formData.get('children') as string, 10) || 0
  );
  const infants = Math.max(
    0,
    parseInt(formData.get('infants') as string, 10) || 0
  );

  const tripDuration = parseInt(formData.get('tripDuration') as string, 10);

  const [startDateStr, endDateStr] = travelDates.split(' to ');

  // Convert string dates to Date objects
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Generate date combinations
  const dateCombinations = generateDateCombinations(
    startDate,
    endDate,
    tripDuration
  );

  const { object: cityCodes } = await generateObject({
    system: `you're an airport search engine and you know all the airport codes for all the world`,
    prompt: `get all the airport codes, don't omit any airport code, for each one of the following cities: ${homeTown}, ${entryCity}, ${departureCity}, display them as an array, and nothing else for ex: homeTown:[ 'JFK', 'LGA', 'EWR'], entryCity: ['CDG', 'ORY', 'BVA'], departureCity: ['FCO,'CIA']`,
    model: openai('gpt-4o-mini'),
    temperature: 0,
    schema: z.object({
      homeTownIataCodes: z.array(z.string()),
      entryCityIataCodes: z.array(z.string()),
      departureCityIataCodes: z.array(z.string()),
    }),
  });

  console.log('cityCodes', cityCodes);

  // Call getRoundTripFlights function
  const roundTripFlights = await getRoundTripFlights(
    cityCodes.homeTownIataCodes,
    cityCodes.entryCityIataCodes,
    dateCombinations,
    numAdults,
    children,
    infants
  );

  // Add multi-city flight search
  const finalResults = await getMultiCityFlights(
    cityCodes.homeTownIataCodes,
    cityCodes.entryCityIataCodes,
    cityCodes.departureCityIataCodes,
    dateCombinations,
    numAdults,
    children,
    infants
  );

  const flightResults = {
    dateCombinations: dateCombinations.map(([dep, ret]) => [
      format(dep, 'yyyy-MM-dd'),
      format(ret, 'yyyy-MM-dd'),
    ]),
    // roundTripFlights,
    finalResults,
  };

  // Save results to a file
  try {
    const logContent = JSON.stringify(finalResults, null, 2);
    await fs.writeFile('flight_search_results.json', logContent);
    console.log(
      'Flight search results have been saved to flight_search_results.json'
    );
  } catch (error) {
    console.error('Error writing flight search results to file:', error);
  }

  return json({
    homeTown,
    entryCity,
    departureCity,
    travelDates,
    numAdults,
    budget,
    children,
    infants,
    tripDuration,
    startDate,
    endDate,
    dateCombinations,
    cityCodes,
    flightResults,
  });
};

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export default function Index() {
  const data = useActionData();
  console.log('data', data);

  return (
    <div className="font-sans p-4">
      <ItineraryForm />
      {/* <FlightResults
        roundTripFlights={data?.flightResults?.roundTripFlights}
        multiCityFlights={data?.flightResults?.multiCityFlights}
      /> */}
      {data?.flightResults && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Flight Results</h2>
          <pre className="bg-gray-100">
            {JSON.stringify(data.flightResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
