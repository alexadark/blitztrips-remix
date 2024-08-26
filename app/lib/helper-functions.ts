export function generateDateCombinations(
  startDate: Date,
  endDate: Date,
  tripDuration: number
): [Date, Date][] {
  const combinations: [Date, Date][] = [];
  let currentDate = new Date(startDate);

  while (
    currentDate <=
    new Date(endDate.getTime() - tripDuration * 24 * 60 * 60 * 1000)
  ) {
    const departureDate = new Date(currentDate);
    const returnDate = new Date(
      departureDate.getTime() + tripDuration * 24 * 60 * 60 * 1000
    );

    if (returnDate <= endDate) {
      combinations.push([departureDate, returnDate]);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return combinations;
}

export const formatDuration = (minutes?: number) => {
  if (typeof minutes !== 'number' || isNaN(minutes)) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const formatDateTime = (dateTimeString?: string) => {
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
