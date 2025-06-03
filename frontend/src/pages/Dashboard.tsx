import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Clock, User, Calendar as CalendarIcon, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { useLeaveContext } from '../context/LeaveContext';
import { useUserContext } from '../context/UserContext';
import { formatDate } from '../utils/formatters';
import { Leave, Permission } from '../types';
import openspaceImage from '../assets/images/Image (2).jpg';

interface DashboardState {
  isLoading: boolean;
  error: string | null;
  recentLeaves: Leave[];
  recentPermissions: Permission[];
  currentPage: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserContext();
  const { leaves, permissions, setLeaveFilter } = useLeaveContext();
  
  const [state, setState] = useState<DashboardState>({
    isLoading: true,
    error: null,
    recentLeaves: [],
    recentPermissions: [],
    currentPage: 1
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(state.recentLeaves.length / itemsPerPage);

  useEffect(() => {
    if (!currentUser) return;

    const fetchRecentData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const userLeaves = leaves.filter(leave => 
          leave.userId === currentUser.id || 
          (typeof leave.user === 'string' && leave.user === `/api/users/${currentUser.id}`) ||
          leave.user?.id === currentUser.id
        );
        
        const sortedLeaves = [...userLeaves].sort((a, b) => {
          const dateA = new Date(a.startDate);
          const dateB = new Date(b.startDate);
          return dateB.getTime() - dateA.getTime();
        });
        
        const userPermissions = permissions.filter(permission =>
          permission.userId === currentUser.id ||
          (typeof permission.user === 'string' && permission.user === `/api/users/${currentUser.id}`) ||
          permission.user?.id === currentUser.id
        );
        
        const sortedPermissions = [...userPermissions].sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        
        setState(prev => ({
          ...prev,
          recentLeaves: sortedLeaves.slice(0, 10),
          recentPermissions: sortedPermissions.slice(0, 5),
          isLoading: false
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: 'Erreur lors du chargement des données',
          isLoading: false
        }));
        console.error('Error fetching data:', err);
      }
    };

    fetchRecentData();
  }, [currentUser, leaves, permissions]);

  useEffect(() => {
    setState(prev => ({ ...prev, currentPage: 1 }));
  }, [state.recentLeaves]);

  const handleFilterChange = (filter: string) => {
    setLeaveFilter(filter as any);
    navigate('/conge/liste');
  };

  const setCurrentPage = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const paginatedLeaves = state.recentLeaves.slice(
    (state.currentPage - 1) * itemsPerPage,
    state.currentPage * itemsPerPage
  );

  const paidLeaves = leaves.filter(leave => leave.type === 'Congé payé' && leave.userId === currentUser?.id);
  const sickLeaves = leaves.filter(leave => leave.type === 'Congé maladie' && leave.userId === currentUser?.id);
  const pendingLeaves = leaves.filter(leave => leave.status === 'En attente' && leave.userId === currentUser?.id);
  const rejectedLeaves = leaves.filter(leave => leave.status === 'Rejeté' && leave.userId === currentUser?.id);
  const userPermissions = permissions.filter(permission => permission.userId === currentUser?.id);

  const paidLeaveDaysTaken = paidLeaves
    .filter(leave => leave.status === 'Approuvé')
    .reduce((total, leave) => total + Number(leave.totalDays), 0);
  
  const sickLeaveDaysTaken = sickLeaves
    .filter(leave => leave.status === 'Approuvé')
    .reduce((total, leave) => total + Number(leave.totalDays), 0);

  const totalPaidLeaveDaysAvailable = currentUser?.paidLeaveBalance || 0;
  const totalSickLeaveDaysAvailable = currentUser?.sickLeaveBalance || 0;

  const recentLeaves = [...leaves]
    .filter(leave => leave.userId === currentUser?.id)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3);

  const handleStatCardClick = (type: string) => {
    if (type === 'paid') {
      setLeaveFilter('paid');
    } else if (type === 'sick') {
      setLeaveFilter('sick');
    } else if (type === 'pending') {
      setLeaveFilter('pending');
    } else if (type === 'rejected') {
      setLeaveFilter('rejected');
    }
    navigate('/conge/liste');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
      </div>

      <div className="mb-8">
        <div className="rounded-lg overflow-hidden">
          <img 
            className="w-full h-48 object-cover"
            src={openspaceImage}
            alt="Notre espace de travail"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Congés Payés" 
          value={paidLeaveDaysTaken} 
          available={totalPaidLeaveDaysAvailable}
          icon={<Calendar size={22} className="text-white" />} 
          color="bg-blue-600"
          onClick={() => handleStatCardClick('paid')}
        />
        <StatCard 
          title="Congés Maladie" 
          value={sickLeaveDaysTaken} 
          available={totalSickLeaveDaysAvailable}
          icon={<AlertCircle size={22} className="text-white" />} 
          color="bg-amber-500"
          onClick={() => handleStatCardClick('sick')}
        />
        <StatCard 
          title="Permissions Prises" 
          value={userPermissions.length} 
          icon={<Clock size={22} className="text-white" />} 
          color="bg-emerald-500"
          onClick={() => navigate('/permission/liste')}
        />
        <StatCard 
          title="Demandes en Attente" 
          value={pendingLeaves.length} 
          icon={<User size={22} className="text-white" />} 
          color="bg-purple-500"
          onClick={() => handleStatCardClick('pending')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Congés récents</h2>
            <button 
              onClick={() => navigate('/conge/liste')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Voir tous
            </button>
          </div>
          <div className="p-4">
            {state.recentLeaves.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedLeaves.map((leave) => (
                    <div 
                      key={leave.id} 
                      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                            leave.type === 'Congé payé' ? 'bg-blue-100 text-blue-600' :
                            leave.type === 'Congé maladie' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <CalendarIcon size={20} />
                          </div>
                          <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            leave.status === 'Approuvé' ? 'bg-green-100 text-green-800' :
                            leave.status === 'En attente' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {leave.status}
                          </div>
                        </div>
                        
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{leave.type}</h3>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                          </p>
                          {leave.reason && (
                            <p className="flex items-center">
                              <FileText size={14} className="mr-1" />
                              {leave.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, state.currentPage - 1))}
                      disabled={state.currentPage === 1}
                      className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          state.currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, state.currentPage + 1))}
                      disabled={state.currentPage === totalPages}
                      className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center">
                <Calendar size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Aucun congé récent</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Actions rapides</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer" onClick={() => navigate('/conge/ajouter')}>
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-blue-500 text-white rounded-md">
                    <Calendar size={20} />
                  </div>
                  <h3 className="ml-3 text-md font-medium text-blue-800">Demander un congé</h3>
                </div>
                <p className="text-sm text-blue-700">Créez une nouvelle demande de congé payé ou maladie</p>
              </div>
              
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer" onClick={() => navigate('/permission/ajouter')}>
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-emerald-500 text-white rounded-md">
                    <Clock size={20} />
                  </div>
                  <h3 className="ml-3 text-md font-medium text-emerald-800">Demander une permission</h3>
                </div>
                <p className="text-sm text-emerald-700">Créez une nouvelle demande de permission de courte durée</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-md font-medium text-gray-800 mb-2">Solde de congés</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Congés payés restants:</span>
                  <span className="text-sm font-medium text-blue-600">{totalPaidLeaveDaysAvailable - paidLeaveDaysTaken} / {totalPaidLeaveDaysAvailable} jours</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${((totalPaidLeaveDaysAvailable - paidLeaveDaysTaken) / totalPaidLeaveDaysAvailable) * 100}%` }}></div>
                </div>
                
                <div className="flex justify-between mt-3">
                  <span className="text-sm text-gray-600">Congés maladie restants:</span>
                  <span className="text-sm font-medium text-amber-600">{totalSickLeaveDaysAvailable - sickLeaveDaysTaken} / {totalSickLeaveDaysAvailable} jours</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${((totalSickLeaveDaysAvailable - sickLeaveDaysTaken) / totalSickLeaveDaysAvailable) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
 