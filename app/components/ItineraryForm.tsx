import React, { useState, useEffect } from 'react';
import { Form } from '@remix-run/react';
import 'react-datepicker/dist/react-datepicker.css';

const ItineraryForm: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(2024, 10, 1)
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date(2024, 10, 14));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDate = (date: Date | null) => {
    return date ? date.toISOString().split('T')[0] : '';
  };

  return (
    <>
      <Form method="post" className="shadow-xl card bg-base-200">
        <div className="card-body">
          <h2 className="mb-6 card-title">Create Your Itinerary!!</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="form-control">
              <label className="label" htmlFor="homeTown">
                <span className="label-text">Home Town</span>
              </label>
              <input
                type="text"
                id="homeTown"
                name="homeTown"
                required
                defaultValue="New York"
                className="input input-bordered"
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="entryCity">
                <span className="label-text">Entry City</span>
              </label>
              <input
                type="text"
                id="entryCity"
                name="entryCity"
                required
                defaultValue="Madrid"
                className="input input-bordered"
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="departureCity">
                <span className="label-text">Departure City</span>
              </label>
              <input
                type="text"
                id="departureCity"
                name="departureCity"
                required
                defaultValue="Rome"
                className="input input-bordered"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="form-control">
              <label className="label" htmlFor="regionToVisit">
                <span className="label-text">Region to Visit</span>
              </label>
              <input
                type="text"
                id="regionToVisit"
                name="regionToVisit"
                required
                defaultValue="Spain, Italy, Portugal"
                className="input input-bordered"
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="budget">
                <span className="label-text">Budget</span>
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                min={0}
                required
                defaultValue={15000}
                className="input input-bordered"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 ">
            <div className="form-control">
              <label className="label" htmlFor="tripDuration">
                <span className="label-text">Trip Duration (days)</span>
              </label>
              <input
                type="number"
                id="tripDuration"
                name="tripDuration"
                min={1}
                required
                defaultValue={12}
                className="input input-bordered"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label" htmlFor="numAdults">
                <span className="label-text">Adults</span>
              </label>
              <input
                type="number"
                id="numAdults"
                name="numAdults"
                min={1}
                defaultValue={1}
                required
                className="input input-bordered"
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="numChildren">
                <span className="label-text">Children (2-11)</span>
              </label>
              <input
                type="number"
                id="numChildren"
                name="numChildren"
                min={0}
                defaultValue={0}
                className="input input-bordered"
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="numInfants">
                <span className="label-text">Infants (0-2)</span>
              </label>
              <input
                type="number"
                id="numInfants"
                name="numInfants"
                min={0}
                defaultValue={0}
                className="input input-bordered"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="form-control">
              <label className="label" htmlFor="citiesToVisit">
                <span className="label-text">Cities to Visit</span>
              </label>
              <input
                type="text"
                id="citiesToVisit"
                name="citiesToVisit"
                defaultValue="Madrid, Lisbon, Rome and any city of interest"
                className="input input-bordered"
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="citiesToAvoid">
                <span className="label-text">Cities to Avoid</span>
              </label>
              <input
                type="text"
                id="citiesToAvoid"
                name="citiesToAvoid"
                defaultValue="barcelona"
                className="input input-bordered"
              />
            </div>
          </div>

          {isClient ? (
            <>
              <div className="form-control">
                <label className="label" htmlFor="startDate">
                  <span className="label-text">Start Date</span>
                </label>
                <DatePickerWrapper
                  selected={startDate}
                  onChange={(date: Date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="yyyy-MM-dd"
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="endDate">
                  <span className="label-text">End Date</span>
                </label>
                <DatePickerWrapper
                  selected={endDate}
                  onChange={(date: Date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat="yyyy-MM-dd"
                  className="input input-bordered"
                />
              </div>
            </>
          ) : (
            <div>Loading date picker...</div>
          )}

          <input
            type="hidden"
            name="travelDates"
            value={`${startDate} to ${endDate}`}
          />

          <div className="form-control">
            <label className="label" htmlFor="extraConsiderations">
              <span className="label-text">Extra Considerations</span>
            </label>
            <textarea
              id="extraConsiderations"
              name="extraConsiderations"
              rows={3}
              defaultValue="we love hiking"
              className="textarea textarea-bordered"
            />
          </div>
          <input type="hidden" name="_action" value="generateitinerary" />

          <div className="mt-6 form-control">
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>
        </div>
      </Form>
    </>
  );
};

const DatePickerWrapper = (props: any) => {
  const [DatePicker, setDatePicker] = useState<any>(null);

  useEffect(() => {
    import('react-datepicker').then((module) => {
      setDatePicker(() => module.default);
    });
  }, []);

  if (!DatePicker) {
    return null;
  }

  return <DatePicker {...props} />;
};

export default ItineraryForm;
