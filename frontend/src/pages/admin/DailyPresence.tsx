import { Users, UserCheck, UserX, Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import openspaceImage from '../../assets/images/openspace.jpg';
import { User } from '../../types/index';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ITEMS_PER_PAGE = 8; // 2 colonnes x 4 lignes

const DailyPresence = () => {
  const { getPresentEmployees, getAbsentEmployees } = useAdminContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [presentPage, setPresentPage] = useState(1);
  const [absentPage, setAbsentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [presentEmployees, setPresentEmployees] = useState<User[]>([]);
  const [absentEmployees, setAbsentEmployees] = useState<User[]>([]);
  
  // Update employee lists when date or search changes
  useEffect(() => {
    const allPresentEmployees = getPresentEmployees(selectedDate);
    const allAbsentEmployees = getAbsentEmployees(selectedDate);
    
    // Reset pagination when date changes
    setPresentPage(1);
    setAbsentPage(1);
    
    // Apply search filter if exists
    const filteredPresent = filterEmployees(allPresentEmployees);
    const filteredAbsent = filterEmployees(allAbsentEmployees);
    
    setPresentEmployees(filteredPresent);
    setAbsentEmployees(filteredAbsent);
  }, [selectedDate, searchQuery, getPresentEmployees, getAbsentEmployees]);
  
  const filterEmployees = (employees: User[]) => {
    let filtered = employees;
    if (searchQuery.trim()) {
    const searchLower = searchQuery.toLowerCase().trim();
      filtered = employees.filter(employee => 
      employee.firstName.toLowerCase().includes(searchLower) ||
      employee.lastName.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower)
    );
    }
    
    // Tri alphabétique par prénom
    return filtered.sort((a, b) => a.firstName.localeCompare(b.firstName));
  };
  
  const getPaginatedEmployees = (employees: User[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return employees.slice(start, start + ITEMS_PER_PAGE);
  };
  
  const presentPages = Math.ceil(presentEmployees.length / ITEMS_PER_PAGE);
  const absentPages = Math.ceil(absentEmployees.length / ITEMS_PER_PAGE);
  
  const paginatedPresentEmployees = getPaginatedEmployees(presentEmployees, presentPage);
  const paginatedAbsentEmployees = getPaginatedEmployees(absentEmployees, absentPage);
  
  const formattedDate = new Date(selectedDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const renderPagination = (currentPage: number, totalPages: number, setPage: (page: number) => void) => (
    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between items-center">
        <button
          onClick={() => setPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} className="mr-1" />
          Précédent
        </button>
        <span className="text-sm text-gray-700">
          Page <span className="font-medium">{currentPage}</span> sur <span className="font-medium">{totalPages || 1}</span>
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Suivant
          <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
    </div>
  );
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Présence Quotidienne</h1>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Calendar size={24} />
            </div>
            <p className="ml-3 text-xl font-semibold text-blue-600 capitalize">
              {formattedDate}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="form-input rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              onClick={goToToday}
              className="px-3 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors duration-200 text-sm font-medium"
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-6 rounded-lg overflow-hidden">
        <img 
          className="w-full h-48 object-cover"
          src={openspaceImage}
          alt="Équipe professionnelle"
        />
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un employé..."
            className="block w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex items-center">
            <div className="p-2 bg-green-500 text-white rounded-md">
              <UserCheck size={20} />
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">Employés présents ({presentEmployees.length})</h2>
          </div>
          
          {paginatedPresentEmployees.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Aucun employé présent pour cette date.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                {paginatedPresentEmployees.map((employee, index) => (
                  <div key={employee.id} className={`p-4 ${index % 2 === 0 ? 'pr-4' : 'pl-4'} ${Math.floor(index / 2) < 3 ? 'border-b border-gray-200' : ''}`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-green-800">{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {renderPagination(presentPage, presentPages, setPresentPage)}
            </>
          )}
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex items-center">
            <div className="p-2 bg-red-500 text-white rounded-md">
              <UserX size={20} />
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">Employés absents ({absentEmployees.length})</h2>
          </div>
          
          {paginatedAbsentEmployees.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Aucun employé absent pour cette date.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                {paginatedAbsentEmployees.map((employee, index) => (
                  <div key={employee.id} className={`p-4 ${index % 2 === 0 ? 'pr-4' : 'pl-4'} ${Math.floor(index / 2) < 3 ? 'border-b border-gray-200' : ''}`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-red-800">{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {renderPagination(absentPage, absentPages, setAbsentPage)}
            </>
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex items-center">
          <div className="p-2 bg-blue-500 text-white rounded-md">
            <Users size={20} />
          </div>
          <h2 className="ml-3 text-lg font-medium text-gray-900">Statistiques de présence</h2>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Taux de présence</h3>
              <div className="text-3xl font-bold text-blue-600">
                {presentEmployees.length + absentEmployees.length > 0 
                  ? Math.round((presentEmployees.length / (presentEmployees.length + absentEmployees.length)) * 100) 
                  : 0}%
              </div>
              <p className="text-sm text-gray-500 mt-1">des employés sont présents pour cette date</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Employés présents</h3>
              <div className="text-3xl font-bold text-green-600">
                {presentEmployees.length}
              </div>
              <p className="text-sm text-gray-500 mt-1">sur {presentEmployees.length + absentEmployees.length} employés</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Employés absents</h3>
              <div className="text-3xl font-bold text-red-600">
                {absentEmployees.length}
              </div>
              <p className="text-sm text-gray-500 mt-1">sur {presentEmployees.length + absentEmployees.length} employés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPresence;
 