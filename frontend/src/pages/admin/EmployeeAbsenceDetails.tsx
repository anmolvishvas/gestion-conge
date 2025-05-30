import { useState, useEffect } from 'react';
import { Calendar, Clock, Download, Search, Filter, ChevronDown } from 'lucide-react';
import { User, Leave, Permission } from '../../types';
import { leaveService } from '../../services/leaveService';
import { formatDate, formatTime } from '../../utils/formatters';
import { API_URL } from '../../services/api';

const EmployeeAbsenceDetails = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [allLeaves, setAllLeaves] = useState<Leave[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [displayedLeaves, setDisplayedLeaves] = useState<Leave[]>([]);
  const [displayedPermissions, setDisplayedPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved'>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Fetch employees list
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_URL}/users`);
        const data = await response.json();
        const sortedEmployees = (data.member || []).sort((a: User, b: User) => 
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        );
        setEmployees(sortedEmployees);
      } catch (err) {
        setError('Erreur lors du chargement des employés');
        console.error('Error fetching employees:', err);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch user's absences when selected
  useEffect(() => {
    const fetchUserAbsences = async () => {
      if (!selectedUserId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get selected month dates
        const [year, month] = selectedMonth.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);

        // Fetch leaves and permissions for the selected user
        const [leavesResponse, permissionsResponse] = await Promise.all([
          fetch(`${API_URL}/leaves?user=/api/users/${selectedUserId}`),
          fetch(`${API_URL}/permissions?user=/api/users/${selectedUserId}`)
        ]);

        const leavesData = await leavesResponse.json();
        const permissionsData = await permissionsResponse.json();

        // Filter leaves for selected month
        const selectedMonthLeaves = (leavesData.member || []).filter((leave: Leave) => {
          const leaveDate = new Date(leave.startDate);
          return leaveDate >= firstDay && leaveDate <= lastDay;
        });

        // Filter permissions for selected month
        const selectedMonthPermissions = (permissionsData.member || []).filter((permission: Permission) => {
          const permissionDate = new Date(permission.date);
          return permissionDate >= firstDay && permissionDate <= lastDay;
        });

        setAllLeaves(selectedMonthLeaves);
        setAllPermissions(selectedMonthPermissions);
      } catch (err) {
        setError('Erreur lors du chargement des absences');
        console.error('Error fetching absences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAbsences();
  }, [selectedUserId, selectedMonth]);

  // Apply status filter
  useEffect(() => {
    if (statusFilter === 'approved') {
      setDisplayedLeaves(allLeaves.filter(leave => leave.status === 'Approuvé'));
      setDisplayedPermissions(allPermissions.filter(permission => permission.status === 'Approuvé'));
    } else {
      setDisplayedLeaves(allLeaves);
      setDisplayedPermissions(allPermissions);
    }
  }, [statusFilter, allLeaves, allPermissions]);

  const handleDownloadCertificate = async (leaveId: number) => {
    try {
      await leaveService.downloadCertificate(leaveId);
    } catch (err) {
      setError('Erreur lors du téléchargement du certificat');
      console.error('Error downloading certificate:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section with enhanced styling */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Détails des absences
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Consultez et gérez les congés et permissions des employés
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 rounded-xl border-2 border-blue-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Filters Section with enhanced styling */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Sélectionner un employé
                </label>
                <div className="relative group">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                    className="block w-full pl-4 pr-10 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="">Tous les employés</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.trigram})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Filtrer par statut
                </label>
                <div className="relative group">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'approved')}
                    className="block w-full pl-4 pr-10 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="approved">Approuvés uniquement</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display with enhanced styling */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-l-4 border-red-400 p-4 animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State with enhanced styling */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent shadow-lg"></div>
          </div>
        ) : selectedUserId ? (
          <div className="space-y-6">
            {/* Leaves Section with enhanced styling */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-200 hover:shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Congés du mois
                </h2>
              </div>
              <div className="p-6">
                {displayedLeaves.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Aucun congé pour ce mois</p>
                    <p className="text-sm text-gray-400 mt-1">Les congés approuvés apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedLeaves.map((leave) => (
                      <div key={leave.id} 
                           className="group relative bg-white rounded-xl border-2 border-gray-100 p-4 hover:border-blue-200 transition-all duration-200 hover:shadow-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center mb-3 space-x-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200
                                ${leave.type === 'Congé payé' ? 'bg-green-100 text-green-800 group-hover:bg-green-200' : 
                                  leave.type === 'Congé sans solde' ? 'bg-yellow-100 text-yellow-800 group-hover:bg-yellow-200' : 
                                  'bg-red-100 text-red-800 group-hover:bg-red-200'}`}>
                                {leave.type}
                              </span>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200
                                ${leave.status === 'Approuvé' ? 'bg-green-100 text-green-800 group-hover:bg-green-200' : 
                                  leave.status === 'Rejeté' ? 'bg-red-100 text-red-800 group-hover:bg-red-200' : 
                                  'bg-gray-100 text-gray-800 group-hover:bg-gray-200'}`}>
                                {leave.status}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              Du {formatDate(leave.startDate)} au {formatDate(leave.endDate)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Durée: {leave.totalDays} jour(s)
                            </p>
                            {leave.reason && (
                              <p className="text-sm text-gray-600 mt-1">
                                Motif: {leave.reason}
                              </p>
                            )}
                          </div>
                          {leave.certificate && (
                            <button
                              onClick={() => leave.id && handleDownloadCertificate(leave.id)}
                              className="flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200 group-hover:bg-blue-50"
                            >
                              <Download size={16} className="mr-2" />
                              Certificat
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Permissions Section with enhanced styling */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-200 hover:shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Permissions et remplacements
                </h2>
              </div>
              <div className="p-6">
                {displayedPermissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Aucune permission pour ce mois</p>
                    <p className="text-sm text-gray-400 mt-1">Les permissions approuvées apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {displayedPermissions.map((permission) => (
                      <div key={permission.id} 
                           className="group relative bg-white rounded-xl border-2 border-gray-100 p-4 hover:border-purple-200 transition-all duration-200 hover:shadow-md">
                        <div>
                          <div className="flex items-center mb-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200
                              ${permission.status === 'Approuvé' ? 'bg-green-100 text-green-800 group-hover:bg-green-200' : 
                                permission.status === 'Rejeté' ? 'bg-red-100 text-red-800 group-hover:bg-red-200' : 
                                'bg-gray-100 text-gray-800 group-hover:bg-gray-200'}`}>
                              {permission.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            Le {formatDate(permission.date)} de {formatTime(permission.startTime)} à {formatTime(permission.endTime)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Motif: {permission.reason}
                          </p>
                          
                          {permission.replacementSlots.length > 0 && (
                            <div className="mt-4 pl-4 border-l-2 border-purple-200 group-hover:border-purple-300 transition-colors duration-200">
                              <p className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-2">
                                Remplacements:
                              </p>
                              {permission.replacementSlots.map((slot, index) => (
                                <p key={index} className="text-sm text-gray-600 mb-1">
                                  Le {formatDate(slot.date)} de {formatTime(slot.startTime)} à {formatTime(slot.endTime)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center transform transition-all duration-200 hover:shadow-xl">
            <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">
              Veuillez sélectionner un employé pour voir ses absences
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Les congés et permissions du mois sélectionné seront affichés ici
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAbsenceDetails; 