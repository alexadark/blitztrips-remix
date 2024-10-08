import React from 'react';
import { Form } from '@remix-run/react';

// Define types
type Leg = {
  airline: string;
  airline_logo: string;
  flight_number: string;
  departure: {
    time: string;
    airport: string;
  };
  arrival: {
    time: string;
    airport: string;
  };
  often_delayed_by_over_30_minutes: boolean;
};

type Flight = {
  outbound: Leg[];
  return: Leg[];
  totalDuration: number;
  totalPrice: number;
};

type Result = {
  outbound_date: string;
  return_date: string;
  roundtrips: {
    flights: Flight[];
  };
  multiCity: {
    flights: Flight[];
  };
};

type FlightResultsProps = {
  results: Result[];
};

const FlightOption: React.FC<{
  flight: Flight;
  dateIndex: number;
  flightIndex: number;
  flightType: 'roundtrips' | 'multiCity';
}> = ({ flight, dateIndex, flightIndex, flightType }) => {
  const renderLeg = (leg: Leg) => (
    <div className="flex items-center justify-between p-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center space-x-4">
        <img
          src={leg.airline_logo}
          alt={leg.airline}
          className="w-8 h-8 rounded-full"
        />
        <div>
          <p className="text-lg font-semibold">
            {leg.departure.time.split(' ')[1]} -{' '}
            {leg.arrival.time.split(' ')[1]}
          </p>
          <p className="text-sm text-gray-500">
            {leg.departure.airport} - {leg.arrival.airport}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold">
          {Math.floor(leg.duration / 60)}h {leg.duration % 60}m
        </p>
        <p className="text-sm text-gray-500">
          {leg.airline} • {leg.flight_number}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Option {flightIndex + 1}</h3>
        <input
          type="checkbox"
          name="selectedFlights"
          value={`${dateIndex}-${flightType}-${flightIndex}`}
          className="w-5 h-5 text-blue-600"
        />
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold">Outbound</h4>
        {flight.outbound.map((leg, i) => (
          <div key={i}>{renderLeg(leg)}</div>
        ))}
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold">Return</h4>
        {flight.return.map((leg, i) => (
          <div key={i}>{renderLeg(leg)}</div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t">
        <p className="text-lg font-semibold">
          Total Duration: {Math.floor(flight.totalDuration / 60)}h{' '}
          {flight.totalDuration % 60}m
        </p>
        <p className="text-xl font-bold text-blue-600">
          ${flight.totalPrice.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

const FlightResult: React.FC<{ result: Result; dateIndex: number }> = ({
  result,
  dateIndex,
}) => {
  const { outbound_date, return_date, roundtrips, multiCity } = result;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {outbound_date} - {return_date}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Round Trips</h3>
          {roundtrips.flights.map((flight, index) => (
            <FlightOption
              key={index}
              flight={flight}
              dateIndex={dateIndex}
              flightIndex={index}
              flightType="roundtrips"
            />
          ))}
        </div>
        {multiCity.flights.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Multi-City</h3>
            {multiCity.flights.map((flight, index) => (
              <FlightOption
                key={index}
                flight={flight}
                dateIndex={dateIndex}
                flightIndex={index}
                flightType="multiCity"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const FlightResults: React.FC<FlightResultsProps> = ({ results }) => {
  return (
    <Form method="post" className="space-y-8">
      <input type="hidden" name="_action" value="chooseflights" />
      {results.map((result, index) => (
        <FlightResult key={index} result={result} dateIndex={index} />
      ))}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Book Selected Flights
        </button>
      </div>
    </Form>
  );
};
