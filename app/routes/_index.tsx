import type { ActionFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import ItineraryForm from '~/components/ItineraryForm';
import { FlightResults } from '~/components/FlightResults';
import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getRoundTripFlights, getMultiCityFlights } from '~/lib/getFlights';
import {
  generateDateCombinations,
  formatDuration,
  formatDateTime,
} from '~/lib/helper-functions';
import { format } from 'date-fns';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get('_action');

  if (action === 'generateitinerary') {
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

    // Convert epoch strings to Date objects in UTC
    const startDate = new Date(parseInt(startDateStr, 10));
    const endDate = new Date(parseInt(endDateStr, 10));

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
    const multiCityFlights = await getMultiCityFlights(
      cityCodes.homeTownIataCodes,
      cityCodes.entryCityIataCodes,
      cityCodes.departureCityIataCodes,
      dateCombinations,
      numAdults,
      children,
      infants
    );
    const length = dateCombinations.length;
    const finalResults = multiCityFlights?.results?.slice(-length);

    return json({
      action: 'generateitinerary',
      finalResults,
      // ... other search-related data ...
      // travelDates,
      // dateCombinations,
    });
  } else if (action === 'chooseflights') {
    const selectedFlights = formData.getAll('selectedFlights');
    console.log('selectedFlights', selectedFlights);

    // Process selected flights
    const processedFlights = selectedFlights.map((selection) => {
      const [dateIndex, flightType, flightIndex] = (selection as string).split(
        '-'
      );
      return { dateIndex, flightType, flightIndex };
    });

    // Console log the selected flights
    console.log('Selected Flights:', processedFlights);

    return json({
      action: 'chooseflights',
      selectedFlights: processedFlights,
      message: `${processedFlights.length} flight(s) selected successfully`,
    });
  }

  return json({ error: 'Invalid action' });
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
      <Form method="post">
        <input type="hidden" name="_action" value="generateitinerary" />
        <ItineraryForm />
      </Form>

      {data?.finalResults && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Flight Results</h2>
          <FlightResults results={data.finalResults} />
        </div>
      )}

      {data?.selectedFlights && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          <h3 className="font-bold">Selected Flights:</h3>
          <pre className="mt-2 whitespace-pre-wrap">
            {JSON.stringify(data.selectedFlights, null, 2)}
          </pre>
        </div>
      )}

      {data?.message && (
        <div className="mt-4 p-4 bg-blue-100 text-blue-700 rounded">
          {data.message}
        </div>
      )}
    </div>
  );
}
