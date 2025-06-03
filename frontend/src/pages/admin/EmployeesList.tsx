import { useState, useEffect } from 'react';
import { User, Edit, Trash, Plus, Search, Filter, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminContext } from '../../context/AdminContext';
import { useUserContext } from '../../context/UserContext';
import { User as UserType } from '../../types';

const EmployeesList = () => {
  const navigate = useNavigate();
  const { users, deleteUser } = useAdminContext();
  const { isLoggedIn, currentUser } = useUserContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getFilteredUsers = () => {
    if (!users) return [];
    
    return users.filter(user => {
      if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false;
      }
      
      if (searchQuery.trim() !== '') {
        const searchLower = searchQuery.toLowerCase().trim();
        return (
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.trigram.toLowerCase().includes(searchLower) ||
          user.phone.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    }).sort((a, b) => a.firstName.localeCompare(b.firstName, 'fr-FR'));
  };
  
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    } else if (!currentUser?.isAdmin) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, currentUser, navigate]);
  
  const handleEdit = (id: number) => {
    navigate(`/admin/employees/edit/${id}`);
  };
  
  const confirmDelete = (id: number) => {
    setUserToDelete(id);
    setShowConfirmDelete(true);
  };
  
  const handleDelete = async () => {
    if (userToDelete) {
      setIsLoading(true);
      setError(null);
      try {
        await deleteUser(userToDelete);
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Une erreur est survenue lors de la suppression de l\'employé');
      } finally {
        setIsLoading(false);
        setShowConfirmDelete(false);
        setUserToDelete(null);
      }
    }
  };
  
  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setUserToDelete(null);
  };
  
  if (!isLoggedIn || !currentUser?.isAdmin) {
    return null;
  }

  const filteredUsers = getFilteredUsers();
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Liste des Employés</h1>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center">
            <User size={20} className="mr-2 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-900">Employés</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un employé..."
                className="border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div className="flex items-center">
              <Filter size={16} className="text-gray-500 mr-2" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
            
            <button
              onClick={() => navigate('/admin/employees/add')}
              className="btn btn-primary flex items-center py-2"
            >
              <Plus size={16} className="mr-1.5" />
              Ajouter un employé
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des employés...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun employé trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucun employé ne correspond à votre recherche.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/admin/employees/add')}
                className="btn btn-primary flex items-center mx-auto"
              >
                <Plus size={16} className="mr-1.5" />
                Ajouter un employé
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trigramme
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Congés
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Depuis le {new Date(user.startDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.trigram}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isAdmin ? 'Administrateur' : 'Employé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Payés: {user.paidLeaveBalance} jours
                      </div>
                      <div className="text-sm text-gray-500">
                        Maladie: {user.sickLeaveBalance} jours
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(user.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </button>
                      
                      <button 
                        onClick={() => confirmDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
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
                        Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible et supprimera également toutes ses demandes de congés.
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
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default EmployeesList;
 