import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { Form } from '@remix-run/react';

const ItineraryForm: React.FC = () => {
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);

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

          <div className="form-control">
            <label className="label" htmlFor="travelDates">
              <span className="label-text">Travel Dates</span>
            </label>
            <DateRange
              editableDateInputs={true}
              onChange={(item) => setDateRange([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
            />
            <input
              type="hidden"
              name="travelDates"
              value={`${dateRange[0].startDate.getTime()} to ${dateRange[0].endDate.getTime()}`}
            />
          </div>

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

export default ItineraryForm;
