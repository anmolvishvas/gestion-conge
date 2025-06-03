import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isToday, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { leaveService } from '../../services/leaveService';
import { Holiday, Leave } from '../../types';
import { useUserContext } from '../../context/UserContext';
import { useLeaveContext } from '../../context/LeaveContext';

interface HolidayCalendarState {
  holidays: Holiday[];
  selectedMonth: Date;
  isLoading: boolean;
  error: string | null;
  showMonthPicker: boolean;
}

const HolidayCalendar = () => {
  const { currentUser } = useUserContext();
  const { leaves } = useLeaveContext();
  const [state, setState] = useState<HolidayCalendarState>({
    holidays: [],
    selectedMonth: new Date(),
    isLoading: true,
    error: null,
    showMonthPicker: false
  });

  const userLeaves = leaves.filter(leave => 
    leave.userId === currentUser?.id && 
    leave.status !== 'Rejeté'
  );

  const getLeaveForDate = (date: Date) => {
    return userLeaves.find(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const currentDate = new Date(date);
      return currentDate >= startDate && currentDate <= endDate;
    });
  };

  useEffect(() => {
    const fetchHolidays = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const holidays = await leaveService.getHolidays();
        setState(prev => ({ 
          ...prev, 
          holidays: holidays,
          isLoading: false 
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: 'Erreur lors du chargement des jours fériés',
          isLoading: false
        }));
        console.error('Error fetching holidays:', err);
      }
    };
    fetchHolidays();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const days = getDaysInMonth(state.selectedMonth);
  const startingDayIndex = startOfMonth(state.selectedMonth).getDay();

  const previousMonth = () => {
    setState(prev => ({
      ...prev,
      selectedMonth: new Date(prev.selectedMonth.getFullYear(), prev.selectedMonth.getMonth() - 1)
    }));
  };

  const nextMonth = () => {
    setState(prev => ({
      ...prev,
      selectedMonth: new Date(prev.selectedMonth.getFullYear(), prev.selectedMonth.getMonth() + 1)
    }));
  };

  const toggleMonthPicker = () => {
    setState(prev => ({ ...prev, showMonthPicker: !prev.showMonthPicker }));
  };

  const selectMonth = (month: number) => {
    setState(prev => ({
      ...prev,
      selectedMonth: new Date(prev.selectedMonth.getFullYear(), month),
      showMonthPicker: false
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Calendrier des jours fériés et congés</h1>
          <p className="mt-2 text-sm text-gray-600">
            Consultez les jours fériés et vos congés
          </p>
        </div>

        {state.error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-sm text-red-700">{state.error}</p>
            </div>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              <div className="relative">
                <button
                  onClick={toggleMonthPicker}
                  className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
                >
                  {format(state.selectedMonth, 'MMMM yyyy', { locale: fr })}
                </button>
                
                {state.showMonthPicker && (
                  <div className="absolute top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    {Array.from({ length: 12 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => selectMonth(i)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                          state.selectedMonth.getMonth() === i ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {format(new Date(2024, i), 'MMMM', { locale: fr })}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <ChevronRight size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="bg-gray-50 py-3 text-center">
                  <span className="text-sm font-medium text-gray-500">{day}</span>
                </div>
              ))}

              {Array.from({ length: startingDayIndex === 0 ? 6 : startingDayIndex - 1 }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-white h-24 p-1" />
              ))}
              
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const holiday = state.holidays.find(h => format(parseISO(h.date), 'yyyy-MM-dd') === dateStr);
                const leave = getLeaveForDate(day);
                const isHoliday = !!holiday;
                
                let bgColorClass = '';
                let textColorClass = '';
                let eventLabel = '';

                if (isHoliday) {
                  bgColorClass = 'bg-red-100';
                  textColorClass = 'text-red-800';
                  eventLabel = holiday.name;
                } else if (leave) {
                  switch (leave.status) {
                    case 'Approuvé':
                      bgColorClass = 'bg-green-100';
                      textColorClass = 'text-green-800';
                      eventLabel = `${leave.type} - Approuvé`;
                      break;
                    case 'En attente':
                      bgColorClass = 'bg-yellow-100';
                      textColorClass = 'text-yellow-800';
                      eventLabel = `${leave.type} - En attente`;
                      break;
                  }
                }
                
                return (
                  <div
                    key={dateStr}
                    className={`bg-white h-24 p-2 relative ${
                      isToday(day) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between">
                        <span className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-full text-sm
                          ${isToday(day) ? 'bg-blue-600 text-white' : ''}
                          ${bgColorClass} ${textColorClass}
                        `}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      {eventLabel && (
                        <div className="mt-1">
                          <span className={`text-xs font-medium ${bgColorClass} ${textColorClass} px-2 py-1 rounded`}>
                            {eventLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Jour férié</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Aujourd'hui</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Congé approuvé</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Congé en attente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayCalendar; 