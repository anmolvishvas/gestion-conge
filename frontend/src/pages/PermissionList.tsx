import  React, { useState } from 'react';
import { Clock, Edit, Trash, Filter, AlertCircle } from 'lucide-react';
import { useLeaveContext } from '../context/LeaveContext';
import { useUserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatTime } from '../utils/formatters';
import { PermissionFilterType } from '../types';

const PermissionList = () => {
  const { filteredPermissions, activePermissionFilter, setPermissionFilter, deletePermission } = useLeaveContext();
  const { currentUser } = useUserContext();
  const navigate = useNavigate();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const userPermissions = filteredPermissions.filter(permission => 
    permission.userId === currentUser?.id
  );
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPermissionFilter(e.target.value as PermissionFilterType);
  };
  
  const handleEdit = (id: number) => {
    navigate(`/permission/edit/${id}`);
  };
  
  const confirmDelete = (id: number) => {
    setPermissionToDelete(id);
    setShowConfirmDelete(true);
  };
  
  const handleDelete = async () => {
    if (permissionToDelete) {
      try {
        await deletePermission(permissionToDelete);
        setShowConfirmDelete(false);
        setPermissionToDelete(null);
        setError(null);
      } catch (err) {
        setError('Une erreur est survenue lors de la suppression de la permission.');
        console.error('Error deleting permission:', err);
      }
    }
  };
  
  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setPermissionToDelete(null);
    setError(null);
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
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes Permissions</h1>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center">
            <Clock size={20} className="mr-2 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-900">Historique des permissions</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select 
              value={activePermissionFilter}
              onChange={handleFilterChange}
              className="text-sm bg-white border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les permissions</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="rejected">Rejetées</option>
            </select>
            
            <button
              onClick={() => navigate('/permission/ajouter')}
              className="btn btn-primary py-1.5 px-3"
            >
              Ajouter une permission
            </button>
          </div>
        </div>
        
        {userPermissions.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={48} className="mx-auto text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune permission trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              Vous n'avez pas encore de demande de permission correspondant à ce filtre.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/permission/ajouter')}
                className="btn btn-primary"
              >
                Ajouter une permission
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horaires
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raison
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remplacement
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
                {userPermissions.map((permission) => (
                  <React.Fragment key={permission.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {formatDate(permission.date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatTime(permission.startTime)} - {formatTime(permission.endTime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ({Math.floor(permission.durationMinutes / 60)}h{permission.durationMinutes % 60 > 0 ? permission.durationMinutes % 60 : ''})
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 line-clamp-2">
                          {permission.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {permission.replacementSlots.map((slot) => (
                            <div key={slot.id} className="mb-1 last:mb-0">
                              <div className="text-xs">
                                {formatDate(slot.date)}: {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getStatusBadgeClass(permission.status)}`}>
                          {permission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {permission.status === 'En attente' && (
                          <>
                            <button 
                              onClick={() => permission.id && handleEdit(permission.id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-2"
                              title="Modifier"
                            >
                              <Edit size={18} />
                            </button>
                            
                            <button 
                              onClick={() => permission.id && confirmDelete(permission.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash size={18} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
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
                        Êtes-vous sûr de vouloir supprimer cette demande de permission ? Cette action est irréversible.
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

export default PermissionList;
 