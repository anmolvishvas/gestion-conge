import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminContext } from '../../context/AdminContext';
import { User } from '../../types';
import { ArrowLeft, Save } from 'lucide-react';

const EditEmployee = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, updateUser } = useAdminContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    trigram: '',
    status: 'active',
    paidLeaveBalance: 0,
    sickLeaveBalance: 0,
  });

  useEffect(() => {
    if (id) {
      const user = users.find(u => u.id === parseInt(id));
      if (user) {
        setFormData({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          trigram: user.trigram,
          status: user.status,
          paidLeaveBalance: user.paidLeaveBalance,
          sickLeaveBalance: user.sickLeaveBalance,
          isAdmin: user.isAdmin,
        });
      }
    }
  }, [id, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
  
    setIsLoading(true);
    setError(null);
  
    try {
      const existingUser = users.find(u => u.id === parseInt(id));
      if (!existingUser) throw new Error("Utilisateur introuvable");
  
      const updatedUser: User = {
        ...existingUser, 
        ...formData,
      };
  
      await updateUser(parseInt(id), updatedUser);
      navigate('/admin/employees');
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour de l\'employé');
    } finally {
      setIsLoading(false);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else if (name === 'trigram') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase().slice(0, 3)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/employees')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-1" />
          Retour à la liste
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">Modifier un employé</h1>
        <p className="text-sm text-gray-600 mt-1">Modifiez les informations de l'employé</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigramme
              </label>
              <input
                type="text"
                name="trigram"
                value={formData.trigram}
                onChange={handleInputChange}
                maxLength={3}
                className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solde congés payés
              </label>
              <input
                type="number"
                name="paidLeaveBalance"
                value={formData.paidLeaveBalance}
                onChange={handleInputChange}
                min="0"
                step="0.5"
                className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solde congés maladie
              </label>
              <input
                type="number"
                name="sickLeaveBalance"
                value={formData.sickLeaveBalance}
                onChange={handleInputChange}
                min="0"
                step="0.5"
                className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle
              </label>
              <select
                name="isAdmin"
                value={formData.isAdmin ? 'true' : 'false'}
                onChange={handleInputChange}
                className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="false">Employé</option>
                <option value="true">Administrateur</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loader mr-2"></span>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-1.5" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee; 