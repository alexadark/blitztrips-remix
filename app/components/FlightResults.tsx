import React from 'react';

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

const FlightOption: React.FC<{ flight: Flight; index: number }> = ({
  flight,
  index,
}) => {
  const renderLeg = (leg: Leg, isOutbound: boolean) => (
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
    <div className="space-y-4 border border-gray-200 rounded-lg p-4">
      <h3 className="text-xl font-bold">Option {index + 1}</h3>
      <div className="space-y-2">
        <h4 className="text-lg font-semibold">Outbound</h4>
        {renderLeg(flight.outbound[0], true)}
      </div>
      <div className="space-y-2">
        <h4 className="text-lg font-semibold">Return</h4>
        {renderLeg(flight.return[0], false)}
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold">${flight.totalPrice}</p>
        <p className="text-sm text-gray-500">round trip</p>
      </div>
    </div>
  );
};

const FlightResult: React.FC<{ result: Result }> = ({ result }) => {
  const { outbound_date, return_date, roundtrips, multiCity } = result;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {outbound_date} - {return_date}
      </h2>
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Round Trips</h3>
        {roundtrips.flights.map((flight, index) => (
          <FlightOption key={index} flight={flight} index={index} />
        ))}
      </div>
      {multiCity.flights.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Multi-City</h3>
          {multiCity.flights.map((flight, index) => (
            <FlightOption key={index} flight={flight} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FlightResults: React.FC<FlightResultsProps> = ({ results }) => {
  return (
    <div className="space-y-12">
      {results?.map((result, index) => (
        <FlightResult key={index} result={result} />
      ))}
    </div>
  );
};
