import { Holiday } from '../types/Holiday';

export const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

export const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
    const dateString = date.toISOString().split('T')[0];
    return holidays.some(holiday => holiday.date.split('T')[0] === dateString);
};

export const calculateWorkingDays = (
    startDate: Date,
    endDate: Date,
    holidays: Holiday[],
    halfDayOptions: Record<string, boolean> = {}
): number => {
    let days = 0;
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(0, 0, 0, 0);

    while (currentDate <= endDateTime) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        if (!isWeekend(currentDate) && !isHoliday(currentDate, holidays)) {
            // Check if it's a half day
            if (halfDayOptions[dateString]) {
                days += 0.5;
            } else {
                days += 1;
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
}; 