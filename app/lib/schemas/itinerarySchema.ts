import { z } from 'zod';

export const itinerarySchema = z.object({
  itinerary: z.array(
    z.object({
      day: z.number().describe('Day of the itinerary.'),
      duration: z
        .number()
        .describe('Duration of the time in this place in days.'),
      departure_city: z.string().describe('Name of the departure city.'),
      departure_city_iata_code: z
        .string()
        .describe('IATA code of the departure city.'),
      arrival_city: z.string().describe('Name of the arrival city.'),
      arrival_city_iata_code: z
        .string()
        .describe('IATA code of the arrival city.'),
      bestTravelOptions: z
        .array(
          z.object({
            option: z.string().describe('Type of travel option.'),
            duration: z.string().describe('Approximate duration of travel.'),
            price: z.string().describe('Approximate price of travel.'),
          })
        )
        .describe('Best travel options with details.'),
      arrival_date: z
        .string()
        .describe('Arrival date in the format YYYY-MM-DD.'),
      departure_date: z
        .string()
        .describe('Departure date in the format YYYY-MM-DD.'),
      reason: z
        .string()
        .describe('Thorough and detailed reason for visiting the city.'),
    })
  ),
  reasoning: z
    .string()
    .describe('Explanation of the reasoning behind the recommendations.'),
  formData: z
    .object({
      departure_city: z.string().describe('Name of the departure city.'),
      departure_city_iata_code: z
        .string()
        .describe('IATA code of the departure city.'),
      region: z.string().describe('Region to visit.'),
      citiesToVisit: z.array(z.string()).describe('List of cities to visit.'),
      citiesToAvoid: z.array(z.string()).describe('List of cities to avoid.'),
      numberOfAdults: z.number().describe('Number of adults.'),
      numberOfChildren: z.number().describe('Number of children.'),
      numberOfInfants: z.number().describe('Number of infants.'),
      travelDates: z
        .string()
        .describe('Travel dates in the format YYYY-MM-DD.'),
      extraConsiderations: z
        .string()
        .describe('Extra considerations for the trip.'),
    })
    .describe('All the data from the form.'),
});
