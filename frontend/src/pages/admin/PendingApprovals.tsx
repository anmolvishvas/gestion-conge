import  { useState, useEffect } from 'react';
import { Clock, Calendar, Check, X, ChevronDown, Eye, Download } from 'lucide-react';
import { useLeaveContext } from '../../context/LeaveContext';
import { useAdminContext } from '../../context/AdminContext';
import { formatDate, formatTime } from '../../utils/formatters';
import { leaveService } from '../../services/leaveService';
import { Leave } from '../../types';
import React from 'react';

const PendingApprovals = () => {
  const { 
    leaves, 
    permissions, 
    approveLeaveBatch, 
    rejectLeaveBatch, 
    approvePermissionBatch, 
    rejectPermissionBatch,
    isLoading: contextLoading
  } = useLeaveContext();
  const { users } = useAdminContext();
  const [selectedLeaves, setSelectedLeaves] = useState<number[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [showLeaveSection, setShowLeaveSection] = useState(true);
  const [showPermissionSection, setShowPermissionSection] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{action: 'approve' | 'reject', type: 'leave' | 'permission'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState<Leave | null>(null);
  
  const [sortField, setSortField] = useState<'date' | 'name' | 'duration'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const pendingLeaves = leaves
    .filter((leave): leave is Leave & { id: number } => 
      leave.status === 'En attente' && typeof leave.id === 'number'
    );
    
  const filteredAndSortedPermissions = permissions
    .filter(permission => {
      if (permission.status !== 'En attente') return false;
      
      if (!searchTerm) return true;
      
      const user = users.find(u => u.id === permission.userId);
      const searchLower = searchTerm.toLowerCase();
      
      return (
        user?.firstName?.toLowerCase().includes(searchLower) ||
        user?.lastName?.toLowerCase().includes(searchLower) ||
        user?.email?.toLowerCase().includes(searchLower) ||
        user?.trigram?.toLowerCase().includes(searchLower) ||
        permission.reason.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const userA = users.find(u => u.id === a.userId);
      const userB = users.find(u => u.id === b.userId);
      
      if (sortField === 'name') {
        const nameA = `${userA?.lastName} ${userA?.firstName}`.toLowerCase();
        const nameB = `${userB?.lastName} ${userB?.firstName}`.toLowerCase();
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      
      if (sortField === 'duration') {
        return sortDirection === 'asc'
          ? a.durationMinutes - b.durationMinutes
          : b.durationMinutes - a.durationMinutes;
      }
      
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  
  const getUserName = (userId: number | undefined) => {
    if (!userId) return 'Utilisateur inconnu';
    const user = users.find(user => user.id === userId);
    return user ? `${user.lastName} ${user.firstName}` : 'Utilisateur inconnu';
  };
  
  const handleLeaveSelect = (leaveId: number) => {
    if (selectedLeaves.includes(leaveId)) {
      setSelectedLeaves(selectedLeaves.filter(id => id !== leaveId));
    } else {
      setSelectedLeaves([...selectedLeaves, leaveId]);
    }
  };
  
  const handlePermissionSelect = (permissionId: number) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permissionId));
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    }
  };
  
  const handleSelectAllLeaves = () => {
    if (selectedLeaves.length === pendingLeaves.length) {
      setSelectedLeaves([]);
    } else {
      setSelectedLeaves(pendingLeaves.map(leave => leave.id));
    }
  };
  
  const handleSelectAllPermissions = () => {
    if (selectedPermissions.length === filteredAndSortedPermissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(
        filteredAndSortedPermissions
          .map(permission => permission.id)
          .filter((id): id is number => id !== undefined)
      );
    }
  };
  
  const confirmLeaveAction = (action: 'approve' | 'reject') => {
    setConfirmAction({ action, type: 'leave' });
  };
  
  const confirmPermissionAction = (action: 'approve' | 'reject') => {
    setConfirmAction({ action, type: 'permission' });
  };
  
  const executeAction = async () => {
    if (!confirmAction || isLoading) return;
    
    const { action, type } = confirmAction;
    setIsLoading(true);
    
    try {
      if (type === 'leave') {
        if (action === 'approve') {
          await approveLeaveBatch(selectedLeaves);
        } else {
          await rejectLeaveBatch(selectedLeaves);
        }
        setSelectedLeaves([]);
      } else {
        if (action === 'approve') {
          await approvePermissionBatch(selectedPermissions);
        } else {
          await rejectPermissionBatch(selectedPermissions);
        }
        setSelectedPermissions([]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'action:', error);
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };
  
  const cancelAction = () => {
    setConfirmAction(null);
  };

  const handleShowDetails = (leave: Leave) => {
    setSelectedLeaveDetails(leave);
    setShowDetailsModal(true);
  };
  
  const handleDownloadCertificate = async (leaveId: number) => {
    try {
      await leaveService.downloadCertificate(leaveId);
    } catch (error) {
      console.error('Erreur lors du téléchargement du certificat:', error);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Demandes en attente</h1>
      </div>
      
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmation</h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmAction.action === 'approve' ? 'Approuver' : 'Rejeter'} {' '}
              {confirmAction.type === 'leave' 
                ? `${selectedLeaves.length} demande(s) de congé` 
                : `${selectedPermissions.length} demande(s) de permission`} ?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="btn btn-secondary"
                disabled={isLoading || contextLoading}
              >
                Annuler
              </button>
              <button
                onClick={executeAction}
                disabled={isLoading || contextLoading}
                className={`btn ${confirmAction.action === 'approve' ? 'btn-success' : 'btn-danger'} ${(isLoading || contextLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading || contextLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    En cours...
                  </span>
                ) : (
                  confirmAction.action === 'approve' ? 'Approuver' : 'Rejeter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div 
            className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between cursor-pointer"
            onClick={() => setShowLeaveSection(!showLeaveSection)}
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 text-white rounded-md">
                <Calendar size={20} />
              </div>
              <h2 className="ml-3 text-lg font-medium text-gray-900">Demandes de congés en attente ({pendingLeaves.length})</h2>
            </div>
            <ChevronDown size={20} className={`text-gray-500 transform transition-transform ${showLeaveSection ? 'rotate-180' : ''}`} />
          </div>
          
          {showLeaveSection && (
            <>
              {pendingLeaves.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Aucune demande de congé en attente</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedLeaves.length === pendingLeaves.length && pendingLeaves.length > 0}
                        onChange={handleSelectAllLeaves}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        {selectedLeaves.length} sur {pendingLeaves.length} sélectionné(s)
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => confirmLeaveAction('approve')}
                        disabled={selectedLeaves.length === 0 || isLoading}
                        className={`btn ${selectedLeaves.length === 0 || isLoading ? 'bg-gray-300 cursor-not-allowed' : 'btn-success'}`}
                      >
                        <Check size={16} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'En cours...' : 'Approuver'}
                      </button>
                      <button
                        onClick={() => confirmLeaveAction('reject')}
                        disabled={selectedLeaves.length === 0}
                        className={`btn ${selectedLeaves.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'btn-danger'}`}
                      >
                        <X size={16} className="mr-1" />
                        Rejeter
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {pendingLeaves.map((leave) => (
                        <div key={leave.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <input
                                type="checkbox"
                                checked={selectedLeaves.includes(leave.id)}
                                onChange={() => handleLeaveSelect(leave.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                leave.type === 'Congé payé' ? 'bg-blue-100 text-blue-800' :
                                leave.type === 'Congé maladie' ? 'bg-amber-100 text-amber-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {leave.type}
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <h3 className="text-sm font-medium text-gray-900">{getUserName(leave.userId)}</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                              </p>
                            </div>
                            
                            <div className="mb-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar size={14} className="mr-1" />
                                <span>{leave.totalDays} jour{Number(leave.totalDays) > 1 ? 's' : ''}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{leave.reason}</p>
                            </div>
                            
                            {leave.type === 'Congé maladie' && leave.certificate && (
                              <div className="mb-3 pt-2 border-t border-gray-100">
                                <button
                                  onClick={() => handleDownloadCertificate(leave.id)}
                                  className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                                >
                                  <Download size={14} className="mr-1" />
                                  Télécharger le certificat médical
                                </button>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                              <button
                                onClick={() => handleShowDetails(leave)}
                                className="text-xs text-gray-600 hover:text-gray-900 flex items-center"
                              >
                                <Eye size={14} className="mr-1" />
                                Détails
                              </button>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedLeaves([leave.id]);
                                    confirmLeaveAction('approve');
                                  }}
                                  className="p-1 text-green-600 hover:text-green-800"
                                  title="Approuver"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedLeaves([leave.id]);
                                    confirmLeaveAction('reject');
                                  }}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Rejeter"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      <div>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div 
            className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between cursor-pointer"
            onClick={() => setShowPermissionSection(!showPermissionSection)}
          >
            <div className="flex items-center">
              <div className="p-2 bg-emerald-500 text-white rounded-md">
                <Clock size={20} />
              </div>
              <h2 className="ml-3 text-lg font-medium text-gray-900">
                Demandes de permissions en attente ({filteredAndSortedPermissions.length})
              </h2>
            </div>
            <ChevronDown size={20} className={`text-gray-500 transform transition-transform ${showPermissionSection ? 'rotate-180' : ''}`} />
          </div>
          
          {showPermissionSection && (
            <>
              {filteredAndSortedPermissions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Aucune demande de permission en attente</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                          checked={selectedPermissions.length === filteredAndSortedPermissions.length && filteredAndSortedPermissions.length > 0}
                        onChange={handleSelectAllPermissions}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                        <span className="text-sm text-gray-600">
                          {selectedPermissions.length} sur {filteredAndSortedPermissions.length} sélectionné(s)
                      </span>
                        
                        <div className="flex items-center space-x-2">
                          <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value as 'date' | 'name' | 'duration')}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="date">Trier par date</option>
                            <option value="name">Trier par nom</option>
                            <option value="duration">Trier par durée</option>
                          </select>
                          <button
                            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2 text-gray-500 hover:text-gray-700"
                          >
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                      
                    <div className="flex space-x-2">
                      <button
                        onClick={() => confirmPermissionAction('approve')}
                        disabled={selectedPermissions.length === 0}
                        className={`btn ${selectedPermissions.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'btn-success'}`}
                      >
                        <Check size={16} className="mr-1" />
                        Approuver
                      </button>
                      <button
                        onClick={() => confirmPermissionAction('reject')}
                        disabled={selectedPermissions.length === 0}
                        className={`btn ${selectedPermissions.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'btn-danger'}`}
                      >
                        <X size={16} className="mr-1" />
                        Rejeter
                      </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredAndSortedPermissions.map((permission) => (
                        <div key={permission.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <input
                                type="checkbox"
                                checked={permission.id ? selectedPermissions.includes(permission.id) : false}
                                onChange={() => permission.id && handlePermissionSelect(permission.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                                Permission
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <div className="flex items-center justify-between">
                                <div>
                              <h3 className="text-sm font-medium text-gray-900">{getUserName(permission.userId)}</h3>
                                  <p className="text-xs text-gray-500">{users.find(u => u.id === permission.userId)?.email}</p>
                                  <p className="text-xs text-gray-500">{users.find(u => u.id === permission.userId)?.trigram}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-medium text-gray-900">{formatDate(permission.date)}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(permission.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock size={14} className="mr-1" />
                                <span>{formatTime(permission.startTime)} - {formatTime(permission.endTime)}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {permission.durationMinutes >= 60 ? (
                                  <>
                                    {Math.floor(permission.durationMinutes / 60)}h
                                    {permission.durationMinutes % 60 > 0 && `${permission.durationMinutes % 60}min`}
                                  </>
                                ) : (
                                  `${permission.durationMinutes}min`
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{permission.reason}</p>
                            </div>
                            
                            {permission.replacementSlots.length > 0 && (
                              <div className="mb-3 pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Remplacements :</p>
                                {permission.replacementSlots.map((slot, index) => (
                                  <div key={index} className="text-xs text-gray-600">
                                    {formatDate(slot.date)}: {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
                              {permission.id && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedPermissions([permission.id!]);
                                      confirmPermissionAction('approve');
                                    }}
                                    className="p-1 text-green-600 hover:text-green-800"
                                    title="Approuver"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPermissions([permission.id!]);
                                      confirmPermissionAction('reject');
                                    }}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Rejeter"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showDetailsModal && selectedLeaveDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="bg-gradient-to-b from-blue-50 to-white px-4 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Détails de la demande de congé
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Demande de {getUserName(selectedLeaveDetails.userId)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedLeaveDetails.type === 'Congé payé' ? 'bg-blue-100 text-blue-800' :
                        selectedLeaveDetails.type === 'Congé maladie' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedLeaveDetails.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Période totale</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedLeaveDetails.totalDays} jour{Number(selectedLeaveDetails.totalDays) > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Date de début</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedLeaveDetails.startDate).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Date de fin</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedLeaveDetails.endDate).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                      <p className="text-sm text-gray-500 mb-2">Motif de la demande</p>
                      <p className="text-sm text-gray-900">{selectedLeaveDetails.reason}</p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900">Détail des journées</h4>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {selectedLeaveDetails.halfDayOptions.map((option) => {
                            const date = new Date(option.date);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            
                            return (
                              <div 
                                key={option.date} 
                                className={`bg-white rounded-lg border ${
                                  isWeekend ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
                                } shadow-sm p-3 relative overflow-hidden`}
                              >
                                {isWeekend && (
                                  <div className="absolute top-0 right-0 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-bl">
                                    Weekend
                                  </div>
                                )}
                                <div className="flex items-start mb-2">
                                  <Calendar className="h-4 w-4 text-gray-400 mt-1 mr-2" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 capitalize">
                                      {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {date.toLocaleDateString('fr-FR', { 
                                        day: 'numeric',
                                        month: 'long'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  option.type === 'FULL' ? 'bg-green-100 text-green-800' :
                                  option.type === 'AM' ? 'bg-blue-100 text-blue-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {option.type === 'FULL' ? 'Journée complète' : 
                                   option.type === 'AM' ? 'Matin' : 'Après-midi'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {selectedLeaveDetails.type === 'Congé maladie' && selectedLeaveDetails.certificate && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">Certificat médical</p>
                          <button
                            onClick={() => selectedLeaveDetails.id && handleDownloadCertificate(selectedLeaveDetails.id)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
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
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
 