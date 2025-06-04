import { useState, useEffect } from 'react';
import { Calendar, Clock, Download, Search, Filter, ChevronDown, X } from 'lucide-react';
import { User, Leave, Permission, HalfDayOption } from '../../types';
import { leaveService } from '../../services/leaveService';
import { formatDate, formatTime } from '../../utils/formatters';
import { API_URL } from '../../services/api';

interface LeaveModalProps {
  leave: Leave;
  onClose: () => void;
  onDownload?: (leaveId: number) => void;
}

interface PermissionModalProps {
  permission: Permission;
  onClose: () => void;
}

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
    ${status === 'Approuvé' ? 'bg-green-100 text-green-800' : 
      status === 'Rejeté' ? 'bg-red-100 text-red-800' : 
      'bg-gray-100 text-gray-800'}`}>
    {status}
  </span>
);

const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
    <h3 className="text-sm font-medium text-gray-700">{title}</h3>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) => (
  <div className="px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-500 transition-colors p-1 hover:bg-gray-100 rounded-full"
      >
        <X size={20} />
      </button>
    </div>
  </div>
);

const LeaveModal = ({ leave, onClose, onDownload }: LeaveModalProps) => {
  const getHalfDayText = (option: HalfDayOption) => {
    switch (option.type) {
      case 'AM': return 'Matin';
      case 'PM': return 'Après-midi';
      case 'FULL': return 'Journée complète';
      default: return '';
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (leave.id && onDownload) {
      onDownload(leave.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[90vh] flex flex-col">
        <ModalHeader
          title="Détails du congé"
          subtitle={`Demande créée le ${formatDate(leave.createdAt || '')}`}
          onClose={onClose}
        />
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900">
                  {leave.user?.firstName} {leave.user?.lastName}
                </h3>
                <p className="text-sm text-gray-500">{leave.user?.trigram}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${leave.type === 'Congé payé' ? 'bg-green-100 text-green-800' : 
                  leave.type === 'Congé sans solde' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}`}>
                {leave.type}
              </span>
              <StatusBadge status={leave.status} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Période du congé</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Du :</span>
                    <span className="ml-2">{formatDate(leave.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Au :</span>
                    <span className="ml-2">{formatDate(leave.endDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Durée totale :</span>
                    <span className="ml-2">{leave.totalDays} jour(s)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {leave.halfDayOptions && leave.halfDayOptions.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Options demi-journées</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {leave.halfDayOptions.map((option, index) => (
                  <div key={index} 
                    className="bg-white rounded-lg p-3 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 mb-1">
                        {formatDate(option.date)}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          option.type === 'AM' ? 'bg-orange-400' :
                          option.type === 'PM' ? 'bg-indigo-400' :
                          'bg-green-400'
                        }`} />
                        <span className="text-sm text-purple-600">
                          {getHalfDayText(option)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leave.reason && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Motif du congé</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{leave.reason}</p>
            </div>
          )}

          {leave.certificate && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Download className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Certificat médical</h3>
                    <p className="text-sm text-gray-600 mt-1">Un certificat médical a été fourni pour ce congé</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center px-4 py-2 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-all duration-200"
                >
                  <Download size={16} className="mr-2" />
                  Télécharger
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PermissionModal = ({ permission, onClose }: PermissionModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[90vh] flex flex-col">
        <ModalHeader
          title="Détails de la permission"
          subtitle={`Permission pour le ${formatDate(permission.date)}`}
          onClose={onClose}
        />
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900">
                  {permission.user?.firstName} {permission.user?.lastName}
                </h3>
                <p className="text-sm text-gray-500">{permission.user?.trigram}</p>
              </div>
            </div>
            <StatusBadge status={permission.status} />
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Horaires de la permission</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Date :</span>
                    <span className="ml-2">{formatDate(permission.date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Période :</span>
                    <span className="ml-2">{formatTime(permission.startTime)} - {formatTime(permission.endTime)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Durée :</span>
                    <span className="ml-2">
                      {permission.durationMinutes >= 60 ? (
                        <>
                          {Math.floor(permission.durationMinutes / 60)}h
                          {permission.durationMinutes % 60 > 0 && `${permission.durationMinutes % 60}min`}
                        </>
                      ) : (
                        `${permission.durationMinutes}min`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Motif de la permission</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{permission.reason}</p>
          </div>

          {permission.replacementSlots && permission.replacementSlots.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Clock className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Détails des remplacements</h3>
              </div>
              
              <div className="space-y-4">
                {permission.replacementSlots.map((slot, index) => (
                  <div key={index} 
                    className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{formatDate(slot.date)}</span>
                          <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                          <span className="text-sm text-gray-600">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Durée : {slot.durationMinutes >= 60 ? (
                            <>
                              {Math.floor(slot.durationMinutes / 60)}h
                              {slot.durationMinutes % 60 > 0 && `${slot.durationMinutes % 60}min`}
                            </>
                          ) : (
                            `${slot.durationMinutes}min`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Durée totale des remplacements :</span>
                    <span className="text-emerald-600 font-semibold">
                      {permission.replacementSlots.reduce((total, slot) => total + slot.durationMinutes, 0) >= 60 ? (
                        <>
                          {Math.floor(permission.replacementSlots.reduce((total, slot) => total + slot.durationMinutes, 0) / 60)}h
                          {permission.replacementSlots.reduce((total, slot) => total + slot.durationMinutes, 0) % 60 > 0 && 
                            `${permission.replacementSlots.reduce((total, slot) => total + slot.durationMinutes, 0) % 60}min`}
                        </>
                      ) : (
                        `${permission.replacementSlots.reduce((total, slot) => total + slot.durationMinutes, 0)}min`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

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

  useEffect(() => {
    const fetchUserAbsences = async () => {
      if (!selectedUserId) return;

      setIsLoading(true);
      setError(null);

      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);

        const [leavesResponse, permissionsResponse] = await Promise.all([
          fetch(`${API_URL}/leaves?user=/api/users/${selectedUserId}`),
          fetch(`${API_URL}/permissions?user=/api/users/${selectedUserId}`)
        ]);

        const leavesData = await leavesResponse.json();
        const permissionsData = await permissionsResponse.json();

        const selectedMonthLeaves = (leavesData.member || []).filter((leave: Leave) => {
          const leaveDate = new Date(leave.startDate);
          return leaveDate >= firstDay && leaveDate <= lastDay;
        });

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
      setError(null);
      await leaveService.downloadCertificate(leaveId);
    } catch (err) {
      setError('Erreur lors du téléchargement du certificat');
      console.error('Error downloading certificate:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent shadow-lg"></div>
          </div>
        ) : selectedUserId ? (
          <div className="space-y-6">
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
                           onClick={() => setSelectedLeave(leave)}
                           className="group relative bg-white rounded-xl border-2 border-gray-100 p-4 hover:border-blue-200 transition-all duration-200 hover:shadow-md cursor-pointer">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                if (leave.id) handleDownloadCertificate(leave.id);
                              }}
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
                           onClick={() => setSelectedPermission(permission)}
                           className="group relative bg-white rounded-xl border-2 border-gray-100 p-4 hover:border-purple-200 transition-all duration-200 hover:shadow-md cursor-pointer">
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
      
      {selectedLeave && (
        <LeaveModal
          leave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
          onDownload={handleDownloadCertificate}
        />
      )}

      {selectedPermission && (
        <PermissionModal
          permission={selectedPermission}
          onClose={() => setSelectedPermission(null)}
        />
      )}
    </div>
  );
};

export default EmployeeAbsenceDetails; 