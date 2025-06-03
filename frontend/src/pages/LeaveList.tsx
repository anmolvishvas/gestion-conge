import  { useState, useEffect } from 'react';
import { Calendar, FileText, Download, Edit, Trash, Filter, AlertCircle, Eye, Clock, Check, X } from 'lucide-react';
import { useLeaveContext } from '../context/LeaveContext';
import { useUserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/formatters';
import { LeaveFilterType, Leave } from '../types';
import { leaveService } from '../services/leaveService';

const LeaveList = () => {
  const { filteredLeaves, activeLeaveFilter, setLeaveFilter, deleteLeave, getLeaveById, updateLeave } = useLeaveContext();
  const { currentUser } = useUserContext();
  const navigate = useNavigate();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

  const userLeaves = filteredLeaves.filter(leave => {
    if (!currentUser) return false;
    
    const isUserLeave = leave.userId === currentUser.id || 
      (typeof leave.user === 'string' && leave.user === `/api/users/${currentUser.id}`) ||
      leave.user?.id === currentUser.id;

    return isUserLeave;
  });


  useEffect(() => {
  }, [filteredLeaves]);

  const handleFilterChange = (filter: LeaveFilterType) => {
    setLeaveFilter(filter);
  };
  
  const handleEdit = (leave: Leave) => {
    if (!leave.id) return;
    navigate(`/conge/edit/${leave.id}`);
  };
  
  const confirmDelete = (leave: Leave) => {
    if (!leave.id) return;
    setLeaveToDelete(leave.id);
    setShowConfirmDelete(true);
  };
  
  const handleDelete = () => {
    if (leaveToDelete) {
      deleteLeave(leaveToDelete);
      setShowConfirmDelete(false);
      setLeaveToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setLeaveToDelete(null);
  };
  
  const handleDownloadCertificate = async (leave: Leave) => {
    if (!leave.id) return;
    
    try {
      setIsDownloading(true);
      await leaveService.downloadCertificate(leave.id);
    } catch (error) {
      console.error('Erreur lors du téléchargement du certificat:', error);
      alert('Erreur lors du téléchargement du certificat');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleShowDetails = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approuvé':
        return 'badge-success';
      case 'En attente':
        return 'badge-pending';
      case 'Rejeté':
        return 'badge-danger';
      default:
        return '';
    }
  };
  
  const getLeaveTypeClass = (type: string) => {
    switch (type) {
      case 'Congé payé':
        return 'bg-blue-100 text-blue-800';
      case 'Congé maladie':
        return 'bg-amber-100 text-amber-800';
      case 'Congé sans solde':
        return 'bg-gray-100 text-gray-800';
      default:
        return '';
    }
  };
  
  const formatDateString = (date: string) => {
    if (!date) return '';
    const [dateOnly] = date.split('T');
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  };

  const getFilterTagClass = (filter: LeaveFilterType) => {
    const isActive = filter === activeLeaveFilter;
    
    switch (filter) {
      case 'paid':
        return `${isActive 
          ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-indigo-50'} 
          border-2 transition-colors duration-200`;
      case 'sick':
        return `${isActive 
          ? 'bg-red-100 text-red-800 border-red-200' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50'} 
          border-2 transition-colors duration-200`;
      case 'unpaid':
        return `${isActive 
          ? 'bg-amber-100 text-amber-800 border-amber-200' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-amber-50'} 
          border-2 transition-colors duration-200`;
      case 'pending':
        return `${isActive 
          ? 'bg-blue-100 text-blue-800 border-blue-200' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50'} 
          border-2 transition-colors duration-200`;
      case 'approved':
        return `${isActive 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'} 
          border-2 transition-colors duration-200`;
      case 'rejected':
        return `${isActive 
          ? 'bg-gray-100 text-gray-800 border-gray-200' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'} 
          border-2 transition-colors duration-200`;
      default:
        return `${isActive 
          ? 'bg-purple-100 text-purple-800 border-purple-200' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-purple-50'} 
          border-2 transition-colors duration-200`;
    }
  };

  const getFilterIcon = (filter: LeaveFilterType) => {
    switch (filter) {
      case 'paid':
        return <Calendar size={16} />;
      case 'sick':
        return <AlertCircle size={16} />;
      case 'unpaid':
        return <Clock size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'approved':
        return <Check size={16} />;
      case 'rejected':
        return <X size={16} />;
      default:
        return <Filter size={16} />;
    }
  };

  const filterOptions: { value: LeaveFilterType; label: string }[] = [
    { value: 'all', label: 'Tous les congés' },
    { value: 'pending', label: 'En attente' },
    { value: 'approved', label: 'Approuvés' },
    { value: 'rejected', label: 'Rejetés' },
    { value: 'paid', label: 'Congés payés' },
    { value: 'sick', label: 'Congés maladie' },
    { value: 'unpaid', label: 'Congés sans solde' }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes Congés</h1>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <Calendar size={20} className="mr-2 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Historique des congés</h2>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${getFilterTagClass(option.value)}`}
                >
                  {getFilterIcon(option.value)}
                  {option.label}
                </button>
              ))}
              
              <button
                onClick={() => navigate('/conge/ajouter')}
                className="btn btn-primary py-1.5 px-3 ml-2"
              >
                Ajouter un congé
              </button>
            </div>
          </div>
        </div>
        
        {userLeaves.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun congé trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucune demande de congé ne correspond à votre filtre actuel.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/conge/ajouter')}
                className="btn btn-primary"
              >
                Ajouter un congé
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raison
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userLeaves.map((leave: Leave) => (
                  <tr key={leave.id || Math.random()} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getLeaveTypeClass(leave.type)}`}>
                        {leave.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Du {formatDateString(leave.startDate)} au {formatDateString(leave.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {leave.totalDays} jour{Number(leave.totalDays) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 line-clamp-2">
                        {leave.reason || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusBadgeClass(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {leave.type === 'Congé maladie' && leave.certificate && (
                        <button 
                          onClick={() => handleDownloadCertificate(leave)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                          title="Télécharger le certificat médical"
                          disabled={isDownloading}
                        >
                          <Download size={18} className={isDownloading ? 'animate-spin' : ''} />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleShowDetails(leave)}
                        className="text-gray-600 hover:text-gray-900 mr-2"
                        title="Voir les détails"
                      >
                        <Eye size={18} />
                      </button>

                      {leave.status === 'En attente' && (
                        <>
                          <button 
                            onClick={() => handleEdit(leave)}
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                            title="Modifier"
                          >
                            <Edit size={18} />
                          </button>
                          
                          <button 
                            onClick={() => confirmDelete(leave)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {showDetailsModal && selectedLeave && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-indigo-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                    Détails du congé
                  </h3>
                  <span className={`badge ${getStatusBadgeClass(selectedLeave.status)}`}>
                    {selectedLeave.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center text-sm text-indigo-600">
                  <span className={`badge ${getLeaveTypeClass(selectedLeave.type)} mr-2`}>
                    {selectedLeave.type}
                  </span>
                  <span>
                    Du {formatDate(selectedLeave.startDate)} au {formatDate(selectedLeave.endDate)}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedLeave.halfDayOptions.map((option) => (
                    <div key={option.date} 
                      className={`flex flex-col p-3 rounded-lg border ${
                        option.type === 'NONE' 
                          ? 'bg-red-50 border-red-100' 
                          : option.type === 'FULL'
                            ? 'bg-indigo-50 border-indigo-100'
                            : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          option.type === 'NONE'
                            ? 'bg-red-400'
                            : option.type === 'FULL'
                              ? 'bg-indigo-400'
                              : option.type === 'AM'
                                ? 'bg-amber-400'
                                : 'bg-green-400'
                        }`} />
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(option.date).toLocaleDateString('fr-FR', { 
                            weekday: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className={`text-sm font-medium px-3 py-1 rounded-full text-center ${
                          option.type === 'NONE' 
                            ? 'bg-red-100 text-red-700' 
                            : option.type === 'FULL'
                              ? 'bg-indigo-100 text-indigo-700'
                              : option.type === 'AM'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                        }`}>
                          {option.type === 'FULL' ? 'Journée complète' : 
                           option.type === 'AM' ? 'Matin' : 
                           option.type === 'PM' ? 'Après-midi' :
                           option.type === 'NONE' ? 'Non applicable' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Durée totale</span>
                    <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      {selectedLeave.totalDays} jour{Number(selectedLeave.totalDays) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {selectedLeave.reason && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-sm font-medium text-gray-600 block mb-2">Motif</span>
                      <p className="text-sm text-gray-900 italic">"{selectedLeave.reason}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg border-2 border-gray-300 
                  bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                  transition-colors duration-200 sm:w-auto"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle size={24} className="text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirmer la suppression
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir supprimer cette demande de congé ? Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveList;
 