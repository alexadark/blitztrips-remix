const FlightResult = ({ result }) => {
  const { outbound_date, return_date, roundtrips, multiCity } = result;

  const renderFlight = (flight, isOutbound) => {
    const leg = isOutbound ? flight.outbound[0] : flight.return[0];
    return (
      <div className="flight-leg">
        <img
          src={leg.airline_logo}
          alt={leg.airline}
          className="airline-logo"
        />
        <div className="flight-info">
          <div className="time">
            {leg.departure.time.split(' ')[1]} -{' '}
            {leg.arrival.time.split(' ')[1]}
          </div>
          <div className="airports">
            {leg.departure.airport} - {leg.arrival.airport}
          </div>
          <div className="airline-info">
            {leg.airline} • {leg.flight_number}
          </div>
          {leg.often_delayed_by_over_30_minutes && (
            <div className="delay-warning">Often delayed by 30+ min</div>
          )}
        </div>
      </div>
    );
  };

  const renderFlightOption = (flight, index) => {
    return (
      <div key={index} className="flight-option">
        {renderFlight(flight, true)}
        {renderFlight(flight, false)}
        <div className="flight-summary">
          <div className="total-duration">
            {Math.floor(flight.totalDuration / 60)}h {flight.totalDuration % 60}
            m
          </div>
          <div className="total-price">${flight.totalPrice}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flight-result">
      <h2>
        {outbound_date} - {return_date}
      </h2>
      <div className="roundtrips">
        <h3>Round Trips</h3>
        {roundtrips.flights.map((flight, index) =>
          renderFlightOption(flight, index)
        )}
      </div>
      <div className="multi-city">
        <h3>Multi-City</h3>
        {multiCity.flights.map((flight, index) =>
          renderFlightOption(flight, index)
        )}
      </div>
    </div>
  );
};

export const FlightResults = ({ results }) => {
  console.log('results', results);
  return (
    <div className="flight-results">
      {results?.map((result, index) => (
        <FlightResult key={index} result={result} />
      ))}
    </div>
  );
};
