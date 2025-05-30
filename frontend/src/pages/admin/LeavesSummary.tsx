import  { Calendar, Users, FileText, Search, ChevronDown, ArrowRightLeft } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import equipeImage from '../../assets/images/equipe.jpg';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const LeavesSummary = () => {
  const { getEmployeeLeaveSummary } = useAdminContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  
  // Générer la liste des années (de l'année actuelle à 5 ans en arrière)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  
  const allEmployeeLeaveSummary = getEmployeeLeaveSummary(selectedYear)
    .sort((a, b) => (a?.firstName || '').localeCompare(b?.firstName || '', 'fr-FR'));
  
  const filteredEmployees = searchQuery.trim() === '' 
    ? allEmployeeLeaveSummary
    : allEmployeeLeaveSummary.filter(employee => {
        if (!employee) return false;
        
        const searchLower = searchQuery.toLowerCase().trim();
        const firstName = (employee.firstName || '').toLowerCase();
        const lastName = (employee.lastName || '').toLowerCase();
        const email = (employee.email || '').toLowerCase();
        
        return firstName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               email.includes(searchLower);
      });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Récapitulatif des congés</h1>
        <Link
          to="/admin/leaves/carryover"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <ArrowRightLeft size={18} className="mr-2" />
          Gérer les reports
        </Link>
      </div>
      
      <div className="mb-8">
        <div className="rounded-lg overflow-hidden">
          <img 
            className="w-full h-48 object-cover"
            src={equipeImage}
            alt="Notre équipe"
          />
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 text-white rounded-md">
              <FileText size={20} />
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">Tableau récapitulatif des congés</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar size={16} />
                {selectedYear}
                <ChevronDown size={16} />
              </button>
              
              {showYearDropdown && (
                <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu">
                    {years.map(year => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setShowYearDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          year === selectedYear
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        role="menuitem"
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
          
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
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th scope="col" colSpan={3} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Congés pris {selectedYear}
                </th>
                <th scope="col" colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Congés restants {selectedYear}
                </th>
              </tr>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payé
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maladie
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sans solde
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payé
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maladie
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-blue-800">{employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{employee.leaves?.paid?.taken || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{employee.leaves?.sick?.taken || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{employee.leaves?.unpaid?.taken || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{employee.leaves?.paid?.remaining || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{employee.leaves?.sick?.remaining || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeavesSummary;
 