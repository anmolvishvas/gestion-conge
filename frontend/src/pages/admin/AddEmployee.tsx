import  { useState } from 'react';
import { User, Save, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminContext } from '../../context/AdminContext';
import { User as UserType } from '../../types';

const AddEmployee = () => {
  const navigate = useNavigate();
  const { addUser } = useAdminContext();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [trigram, setTrigram] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [paidLeaveBalance, setPaidLeaveBalance] = useState(25);
  const [sickLeaveBalance, setSickLeaveBalance] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!firstName || !lastName || !email || !phone || !trigram || !password || !startDate) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format d\'email invalide.');
      return;
    }
    
    const trigramRegex = /^[A-Z]{3}$/;
    if (!trigramRegex.test(trigram)) {
      setError('Le trigramme doit contenir exactement 3 lettres majuscules.');
      return;
    }
    
    const newUser: Omit<UserType, 'id'> = {
      firstName,
      lastName,
      email,
      phone,
      trigram,
      password,
      status,
      paidLeaveBalance,
      sickLeaveBalance,
      startDate,
      endDate: endDate || null,
      isAdmin
    };
    
    addUser(newUser);
    navigate('/admin/employees');
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajouter un employé</h1>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <User size={20} className="mr-2 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-900">Informations de l'employé</h2>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 flex items-center">
              <AlertCircle size={20} className="mr-2" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigramme
              </label>
              <input
                type="text"
                value={trigram}
                onChange={(e) => setTrigram(e.target.value.toUpperCase())}
                className="form-input"
                maxLength={3}
                placeholder="Ex: ABC"
                required
              />
              <p className="mt-1 text-xs text-gray-500">3 lettres majuscules</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="form-input"
                required
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle administrateur
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Cet utilisateur a des privilèges d'administrateur
                </span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations sur les congés</h3>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solde de congés payés
                </label>
                <input
                  type="number"
                  value={paidLeaveBalance}
                  onChange={(e) => setPaidLeaveBalance(parseInt(e.target.value))}
                  className="form-input"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solde de congés maladie
                </label>
                <input
                  type="number"
                  value={sickLeaveBalance}
                  onChange={(e) => setSickLeaveBalance(parseInt(e.target.value))}
                  className="form-input"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dates d'emploi</h3>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'entrée en poste
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de démission
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
                <p className="mt-1 text-xs text-gray-500">Laissez vide si l'employé est toujours en poste</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            
            <button
              type="submit"
              className="btn btn-primary flex items-center"
            >
              <Save size={16} className="mr-1.5" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
 