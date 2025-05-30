import { HalfDayOption, HalfDayType } from '../types';
import { calculateWorkingDays } from './dateUtils';
import { Holiday } from '../types/Holiday';
import { eachDayOfInterval, isWeekend } from 'date-fns';
import { HALF_DAY_TYPES } from '../constants/halfDayTypes';

/**
 * Formate une date au format YYYY-MM-DD en format local (DD/MM/YYYY)
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Formate une heure au format HH:mm
 */
export const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    // Si l'heure est au format ISO, on extrait juste HH:mm
    if (timeString.includes('T')) {
        return timeString.split('T')[1].substring(0, 5);
    }
    // Si l'heure est déjà au format HH:mm
    return timeString;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (remainingMinutes === 0) {
    return hours === 1 ? `${hours} heure` : `${hours} heures`;
  } else {
    return `${hours}h${remainingMinutes}`;
  }
};

export const calculateTotalDays = (startDate: string, endDate: string, halfDayOptions: any[]): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let totalDays = 0;
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dateString = currentDate.toISOString().split('T')[0];
    const option = halfDayOptions.find(opt => opt.date === dateString);
    
    if (option) {
      if (option.type === 'FULL') {
        totalDays += 1;
      } else if (option.type === 'AM' || option.type === 'PM') {
        totalDays += 0.5;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return totalDays;
};

export const getDatesBetween = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
};

const isHolidayDate = (date: string, holidays: Holiday[] | string[]): boolean => {
  if (holidays.length === 0) return false;
  
  if (typeof holidays[0] === 'string') {
    return (holidays as string[]).includes(date);
  }
  
  return (holidays as Holiday[]).some(holiday => holiday.date?.split('T')[0] === date);
};

export const calculateLeaveDuration = (
  startDate: string,
  endDate: string,
  halfDayOptions: HalfDayOption[],
  holidays: Holiday[] | string[]
): number => {
  if (!startDate || !endDate) return 0;

  const days = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate)
  });

  let totalDays = 0;
  days.forEach(day => {
    const dayStr = day.toISOString().split('T')[0];
    
    // Vérifier si c'est un jour férié
    const isHolidayDay = isHolidayDate(dayStr, holidays);

    // Vérifier si c'est un weekend
    const isWeekendDay = isWeekend(day);

    // Ne compter que les jours qui ne sont ni fériés ni weekends
    if (!isWeekendDay && !isHolidayDay) {
      const halfDay = halfDayOptions.find(option => option.date === dayStr);
      if (halfDay) {
        switch (halfDay.type) {
          case HALF_DAY_TYPES.FULL:
            totalDays += 1;
            break;
          case HALF_DAY_TYPES.AM:
          case HALF_DAY_TYPES.PM:
            totalDays += 0.5;
            break;
          case HALF_DAY_TYPES.NONE:
            // Ne pas compter ce jour
            break;
        }
      } else {
        // Si pas d'option spécifique, compter comme journée complète
        totalDays += 1;
      }
    }
  });

  return totalDays;
};

export const calculateDurationInMinutes = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes > startTotalMinutes ? endTotalMinutes - startTotalMinutes : 0;
};

export const isInSameWeek = (date1: string, date2: string): boolean => {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Get the first day of the week (Monday) for both dates
  const day1 = d1.getDay() || 7; // Convert Sunday (0) to 7
  const day2 = d2.getDay() || 7;
  
  // Get date of Monday for first date
  const monday1 = new Date(d1);
  monday1.setDate(d1.getDate() - day1 + 1);
  
  // Get date of Monday for second date
  const monday2 = new Date(d2);
  monday2.setDate(d2.getDate() - day2 + 1);
  
  // Compare the dates of the Mondays (ignoring time)
  return monday1.toDateString() === monday2.toDateString();
};
 