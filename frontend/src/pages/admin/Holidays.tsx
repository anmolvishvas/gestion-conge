import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, ChevronDown } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { holidayService, Holiday as HolidayType, ApiResponse } from '../../services/holidayService';
import { toast } from 'react-toastify';

const Holidays = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [holidayName, setHolidayName] = useState('');
  const [holidays, setHolidays] = useState<HolidayType[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [selectedFilterMonth, setSelectedFilterMonth] = useState<string>('all');
  const [selectedFilterYear, setSelectedFilterYear] = useState<number>(new Date().getFullYear());

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const years = Array.from(
    { length: 11 },
    (_, i) => new Date().getFullYear() - 5 + i
  );

  useEffect(() => {
    loadHolidays();
  }, [currentYear]);

  const loadHolidays = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await holidayService.getHolidaysForYearRaw(currentYear);
      setApiResponse(response);
      setHolidays(response.member || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      setError(message);
      toast.error('Erreur lors du chargement des jours fériés');
      console.error('Error loading holidays:', error);
      setHolidays([]);
      setApiResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateToLocalISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddHoliday = async () => {
    if (selectedDate && holidayName) {
      try {
        setIsLoading(true);
        const newHoliday = await holidayService.addHoliday({
          name: holidayName,
          date: formatDateToLocalISOString(selectedDate),
          description: null,
          isRecurringYearly: false
        });
        
        await loadHolidays();
        setHolidayName('');
        setSelectedDate(null);
        toast.success('Jour férié ajouté avec succès');
      } catch (error) {
        toast.error('Erreur lors de l\'ajout du jour férié');
        console.error('Error adding holiday:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    try {
      setIsLoading(true);
      await holidayService.deleteHoliday(id);
      await loadHolidays();
      toast.success('Jour férié supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression du jour férié');
      console.error('Error deleting holiday:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderMonth = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    weekDays.forEach((day, index) => {
      days.push(
        <div key={`header-${day}`} 
             className={`h-8 flex items-center justify-center font-medium text-sm
               ${index === 0 || index === 6 ? 'text-red-500' : 'text-gray-600'}`}>
          {day}
        </div>
      );
    });
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDateToLocalISOString(date);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isHoliday = holidays.some(h => h.date.split('T')[0] === dateString);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-12 rounded-lg border ${
            isSelected
              ? 'bg-blue-100 border-blue-500'
              : isHoliday
              ? 'bg-red-50 border-red-200'
              : isWeekend
              ? 'bg-gray-50 border-gray-200'
              : 'hover:bg-gray-50 border-gray-200'
          }`}
          disabled={isLoading}
        >
          <div className="flex flex-col items-center">
            <span className={`text-sm ${
              isHoliday 
                ? 'text-red-600 font-medium' 
                : isWeekend 
                ? 'text-red-500' 
                : ''
            }`}>
              {day}
            </span>
            {isHoliday && (
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-0.5"></div>
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthFromDate = (dateString: string): number => {
    return new Date(dateString).getMonth();
  };

  const getYearFromDate = (dateString: string): number => {
    return new Date(dateString).getFullYear();
  };

  const getMonthYear = (dateString: string): string => {
    const date = new Date(dateString);
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const sortAndGroupHolidays = (holidaysList: HolidayType[]) => {
    return holidaysList
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, holiday) => {
        const monthYear = getMonthYear(holiday.date);
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(holiday);
        return acc;
      }, {} as Record<string, HolidayType[]>);
  };

  const filteredHolidays = holidays.filter(holiday => {
    const holidayYear = getYearFromDate(holiday.date);
    const holidayMonth = getMonthFromDate(holiday.date);
    
    const yearMatch = holidayYear === selectedFilterYear;
    const monthMatch = selectedFilterMonth === 'all' || holidayMonth === parseInt(selectedFilterMonth);
    
    return yearMatch && monthMatch;
  });

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadHolidays}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des jours fériés</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {months[currentMonth]} {currentYear}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg"
              >
                ←
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg"
              >
                →
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {renderMonth(currentYear, currentMonth)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {months[(currentMonth + 1) % 12]} {currentMonth === 11 ? currentYear + 1 : currentYear}
            </h2>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {renderMonth(
              currentMonth === 11 ? currentYear + 1 : currentYear,
              (currentMonth + 1) % 12
            )}
          </div>
        </div>
      </div>

      <div className="w-96 flex flex-col h-[calc(100vh-5rem)] sticky top-20">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un jour férié</h2>
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date sélectionnée
              </label>
              <div className="text-gray-900">
                {selectedDate ? selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Aucune date sélectionnée'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du jour férié
              </label>
              <input
                type="text"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez le nom du jour férié"
              />
            </div>
            <button
              onClick={handleAddHoliday}
              disabled={!selectedDate || !holidayName || isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Liste des jours fériés</h2>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={selectedFilterYear}
                  onChange={(e) => setSelectedFilterYear(Number(e.target.value))}
                  className="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            <div className="relative">
              <select
                value={selectedFilterMonth}
                onChange={(e) => setSelectedFilterMonth(e.target.value)}
                className="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">Tous les mois</option>
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredHolidays.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun jour férié enregistré</p>
            ) : selectedFilterMonth === 'all' ? (
              Object.entries(sortAndGroupHolidays(filteredHolidays)).map(([monthYear, monthHolidays]) => (
                <div key={monthYear} className="space-y-2 mb-4">
                  <h3 className="text-sm font-medium text-gray-500 bg-gray-50 py-2 px-4 rounded-lg sticky top-0 z-20">
                    {monthYear}
                  </h3>
                  <div className="space-y-2">
                    {monthHolidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{holiday.name}</p>
                          <p className="text-sm text-gray-500">{formatDate(holiday.date)}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                {filteredHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{holiday.name}</p>
                      <p className="text-sm text-gray-500">{formatDate(holiday.date)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Holidays; 