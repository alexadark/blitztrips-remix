import type { ActionFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { tavilySearch } from '~/lib/tavily';
import { itinerarySchema } from '~/lib/schemas';
import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import ItineraryForm from '~/components/ItineraryForm';
import { generateDateCombinations } from '~/lib/helper-functions';
import { useActionData } from '@remix-run/react';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  console.log('formData', formData);

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
    </div>
  );
}
