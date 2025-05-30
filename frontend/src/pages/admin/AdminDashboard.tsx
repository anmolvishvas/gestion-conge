import  { Users, Calendar, Clock, CheckSquare } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { Link } from 'react-router-dom';
import openspaceImage from '../../assets/images/Image (2).jpg';

const AdminDashboard = () => {
  const { stats } = useAdminContext();
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-5 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500 text-white">
                <Users size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Employés</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</p>
                <p className="text-sm text-gray-600">
                  <span className="text-green-600 font-medium">{stats.activeEmployees}</span> actifs
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <Link 
              to="/admin/employees"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              Voir tous les employés
              <svg className="w-5 h-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-5 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-500 text-white">
                <Calendar size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Congés en attente</h3>
                <p className="text-3xl font-bold text-amber-600">{stats.pendingLeaves}</p>
                <p className="text-sm text-gray-600">demandes à traiter</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <Link 
              to="/admin/approvals"
              className="text-amber-600 hover:text-amber-800 text-sm font-medium flex items-center"
            >
              Traiter les demandes
              <svg className="w-5 h-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-5 bg-red-50 border-b border-red-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-500 text-white">
                <Users size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Employés absents</h3>
                <p className="text-3xl font-bold text-red-600">{stats.todayAbsent}</p>
                <p className="text-sm text-gray-600">aujourd'hui</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <Link 
              to="/admin/presence"
              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
            >
              Voir la présence
              <svg className="w-5 h-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-5 bg-green-50 border-b border-green-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500 text-white">
                <CheckSquare size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Taux de présence</h3>
                <p className="text-3xl font-bold text-green-600">
                  {stats.activeEmployees && (stats.activeEmployees - stats.todayAbsent) > 0
                    ? Math.round(((stats.activeEmployees - stats.todayAbsent) / stats.activeEmployees) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-600">des employés présents</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <Link 
              to="/admin/leaves"
              className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
            >
              Voir le récapitulatif
              <svg className="w-5 h-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Actions administratives</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/employees/add" className="block">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition duration-150">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-blue-500 text-white rounded-md">
                    <Users size={18} />
                  </div>
                  <h3 className="ml-3 text-md font-medium text-blue-800">Ajouter un employé</h3>
                </div>
                <p className="text-sm text-blue-700">Créer un nouveau compte d'employé</p>
              </div>
            </Link>
            
            <Link to="/admin/approvals" className="block">
              <div className="p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition duration-150">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-green-500 text-white rounded-md">
                    <CheckSquare size={18} />
                  </div>
                  <h3 className="ml-3 text-md font-medium text-green-800">Approuver demandes</h3>
                </div>
                <p className="text-sm text-green-700">Traiter les demandes en attente</p>
              </div>
            </Link>
            
            <Link to="/admin/leaves" className="block">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 transition duration-150">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-amber-500 text-white rounded-md">
                    <Calendar size={18} />
                  </div>
                  <h3 className="ml-3 text-md font-medium text-amber-800">Gestion des congés</h3>
                </div>
                <p className="text-sm text-amber-700">Voir le récapitulatif des congés</p>
              </div>
            </Link>
            
            <Link to="/admin/presence" className="block">
              <div className="p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition duration-150">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-red-500 text-white rounded-md">
                    <Clock size={18} />
                  </div>
                  <h3 className="ml-3 text-md font-medium text-red-800">Présence quotidienne</h3>
                </div>
                <p className="text-sm text-red-700">Voir la présence des employés</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
 