import { useState, useEffect } from 'react';
import { Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { leaveService } from '../../services/leaveService';

interface HolidayListState {
  holidays: string[];
  isLoading: boolean;
  error: string | null;
}

const HolidayList = () => {
  const [state, setState] = useState<HolidayListState>({
    holidays: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchHolidays = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const holidayDates = await leaveService.getHolidays();
        setState(prev => ({ 
          ...prev, 
          holidays: holidayDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Liste des jours fériés</h1>
          <p className="mt-2 text-sm text-gray-600">
            Consultez la liste complète des jours fériés de l'année en cours
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
          {state.isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Chargement des jours fériés...</p>
            </div>
          ) : state.holidays.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-sm text-gray-600">Aucun jour férié n'a été trouvé</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {state.holidays.map((date) => (
                  <li key={date} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })}
                        </p>
                        <p className="text-sm text-gray-500">
                          Jour férié
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Férié
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HolidayList; 