import React from 'react';

interface Airport {
  name?: string;
  id?: string;
  time?: string;
}

interface FlightDetails {
  departure_airport?: Airport;
  arrival_airport?: Airport;
  duration?: number;
  airline?: string;
  flight_number?: string;
  airline_logo?: string;
}

interface Flight {
  flights: FlightDetails[];
  totalPrice?: number;
  totalDuration?: number;
}

interface FlightOption {
  outbound?: Flight;
  return?: Flight;
  totalPrice?: number;
  totalDuration?: number;
  outbound_google_flights_url?: string;
  return_google_flights_url?: string;
}

interface MultiCityFlight {
  flights: FlightDetails[];
  totalPrice?: number;
  totalDuration?: number;
  google_flights_url?: string;
}

interface MultiCityFlightOption {
  flights: MultiCityFlight[];
  totalPrice?: number;
  totalDuration?: number;
}

interface FlightResultsProps {
  roundTripFlights?: {
    results: FlightOption[];
    typicalPriceRange: [number, number] | null;
  };
  multiCityFlights?: {
    results: MultiCityFlightOption[];
    typicalPriceRange: [number, number] | null;
  };
}

const formatDuration = (minutes?: number) => {
  if (typeof minutes !== 'number' || isNaN(minutes)) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatDateTime = (dateTimeString?: string) => {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

const FlightSegment: React.FC<{
  flight?: Flight | MultiCityFlight;
  type: string;
}> = ({ flight, type }) => {
  if (!flight || !flight.flights || flight.flights.length === 0) {
    return <div>{type} flight information not available</div>;
  }

  return (
    <div className="mb-4">
      <h4 className="text-lg font-semibold">{type} Flight</h4>
      {flight.flights.map((flightDetails, index) => (
        <div key={index} className="mb-2">
          <div className="flex items-center mb-2">
            {flightDetails.airline_logo && (
              <img
                src={flightDetails.airline_logo}
                alt={flightDetails.airline || 'Airline'}
                className="w-8 h-8 mr-2"
              />
            )}
            <span>
              {flightDetails.airline || 'N/A'} -{' '}
              {flightDetails.flight_number || 'N/A'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">
                {flightDetails.departure_airport?.id || 'N/A'}
              </p>
              <p>{formatDateTime(flightDetails.departure_airport?.time)}</p>
            </div>
            <div>
              <p className="font-semibold">
                {flightDetails.arrival_airport?.id || 'N/A'}
              </p>
              <p>{formatDateTime(flightDetails.arrival_airport?.time)}</p>
            </div>
          </div>
          <p className="mt-2">
            Duration: {formatDuration(flightDetails.duration)}
          </p>
        </div>
      ))}
    </div>
  );
};

export const FlightResults: React.FC<FlightResultsProps> = ({
  roundTripFlights,
  multiCityFlights,
}) => {
  if (
    (!roundTripFlights || roundTripFlights.results.length === 0) &&
    (!multiCityFlights || multiCityFlights.results.length === 0)
  ) {
    return <div>No flight results available.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto flight-results">
      <h2 className="mb-4 text-2xl font-bold">Flight Search Results</h2>
      {(roundTripFlights?.typicalPriceRange ||
        multiCityFlights?.typicalPriceRange) && (
        <p className="mb-6 text-lg">
          Typical Price Range: $
          {roundTripFlights?.typicalPriceRange?.[0] ||
            multiCityFlights?.typicalPriceRange?.[0]}{' '}
          - $
          {roundTripFlights?.typicalPriceRange?.[1] ||
            multiCityFlights?.typicalPriceRange?.[1]}
        </p>
      )}
      {roundTripFlights &&
        roundTripFlights.results.map((flightOption, index) => (
          <div
            key={index}
            className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-md"
          >
            <h3 className="mb-4 text-xl font-semibold">
              Flight Option {index + 1}
            </h3>
            <p className="mb-2 text-lg font-bold">
              Total Price: ${flightOption.totalPrice?.toFixed(2) || 'N/A'}
            </p>
            <p className="mb-4">
              Total Duration: {formatDuration(flightOption.totalDuration)}
            </p>
            <p className="mb-4">
              <a
                href={flightOption.outbound_google_flights_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-500"
              >
                Outbound flight url
              </a>
            </p>

            <FlightSegment flight={flightOption.outbound} type="Outbound" />
            <p className="mb-4">
              <a
                href={flightOption.return_google_flights_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-500"
              >
                Return flight url
              </a>
            </p>

            <FlightSegment flight={flightOption.return} type="Return" />
          </div>
        ))}
      {multiCityFlights &&
        multiCityFlights.results.map((flightOption, index) => (
          <div
            key={index}
            className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-md"
          >
            <h3 className="mb-4 text-xl font-semibold">
              Multi-City Flight Option {index + 1}
            </h3>
            <p className="mb-2 text-lg font-bold">
              Total Price: ${flightOption.totalPrice?.toFixed(2) || 'N/A'}
            </p>
            <p className="mb-4">
              Total Duration: {formatDuration(flightOption.totalDuration)}
            </p>
            {flightOption.flights.map((flight, flightIndex) => (
              <React.Fragment key={flightIndex}>
                <p className="mb-4">
                  <a
                    href={flight.google_flights_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-500"
                  >
                    Flight {flightIndex + 1} URL
                  </a>
                </p>
                <FlightSegment
                  flight={flight}
                  type={`Flight ${flightIndex + 1}`}
                />
              </React.Fragment>
            ))}
          </div>
        ))}
    </div>
  );
};
