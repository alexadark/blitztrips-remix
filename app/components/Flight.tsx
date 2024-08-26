import { formatDateTime, formatDuration } from '~/lib/helper-functions';

formatDateTime;
interface Airport {
  name?: string;
  id?: string;
  time?: string;
}

interface Flight {
  departure_airport?: Airport;
  arrival_airport?: Airport;
  duration?: number;
  airline?: string;
  flight_number?: string;
  airline_logo?: string;
  price?: number;
  totalDuration?: number;
  often_delayed_by_over_30_minutes?: boolean;
}

const Flight = ({ flight }: { flight: Flight }) => {
  const {
    departure_airport,
    arrival_airport,
    duration,
    airline,
    flight_number,
    airline_logo,
    price,
    totalDuration,
    often_delayed_by_over_30_minutes,
  } = flight;
  return (
    <div className="flex justify-between">
      <div>
        <img
          src={airline_logo}
          alt={airline || 'Airline'}
          className="w-8 h-8 mr-2"
        />
        <div>{flight_number}</div>
      </div>
      <div>
        <div className="flex font-bold">
          <div>{formatDateTime(departure_airport?.time)} - </div>
          <div>{formatDateTime(arrival_airport?.time)}</div>
        </div>
        {often_delayed_by_over_30_minutes && (
          <div className="text-red-500">Often Delayed by over 30 minutes</div>
        )}
      </div>
      <div>
        <div>{departure_airport?.id}</div>
        <div>{arrival_airport?.id}</div>
      </div>
      <div>
        <div>{formatDuration(duration)}</div>
        <div>{formatDuration(totalDuration)}</div>
      </div>
      <div>
        <div>${price}</div>
      </div>
    </div>
  );
};

export default Flight;
