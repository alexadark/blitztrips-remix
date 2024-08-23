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

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Invalid date:', date);
    return 'Invalid Date';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
