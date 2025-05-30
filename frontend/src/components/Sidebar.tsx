import  { Calendar, Clock, Home, ChevronDown, Users, CalendarDays, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  setCurrentPage: (page: string) => void;
  currentPage: string;
  isAdmin: boolean;
}

const Sidebar = ({ isOpen, setCurrentPage, isAdmin }: SidebarProps) => {
  const location = useLocation();
  const [congeOpen, setCongeOpen] = useState(true);
  const [permissionOpen, setPermissionOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);
  const [holidaysOpen, setHolidaysOpen] = useState(true);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <aside 
      className={`fixed top-0 left-0 z-20 w-64 h-screen pt-16 transition-transform border-r border-gray-200 bg-white ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="h-full flex flex-col justify-between pb-4 overflow-y-auto">
        <div className="px-3 pt-4">
          <ul className="space-y-2 font-medium">
            <li>
              <Link 
                to="/dashboard"
                className={`sidebar-link ${isActive('/dashboard') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                onClick={() => setCurrentPage('dashboard')}
              >
                <Home size={18} className="mr-2" />
                <span>Tableau de bord</span>
              </Link>
            </li>
            
            <li>
              <button 
                type="button" 
                className={`sidebar-link w-full flex items-center justify-between ${
                  location.pathname.includes('/holidays') ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setHolidaysOpen(!holidaysOpen)}
              >
                <div className="flex items-center">
                  <CalendarDays size={18} className="mr-2" />
                  <span>Jours fériés</span>
                </div>
                <ChevronDown size={16} className={`transform transition-transform ${holidaysOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {holidaysOpen && (
                <ul className="py-2 space-y-1 pl-9">
                  <li>
                    <Link 
                      to="/holidays/calendar"
                      className={`text-sm sidebar-link py-1.5 ${isActive('/holidays/calendar') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                    >
                      Calendrier
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            
            <li>
              <button 
                type="button" 
                className={`sidebar-link w-full flex items-center justify-between ${
                  location.pathname.includes('/conge') ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setCongeOpen(!congeOpen)}
              >
                <div className="flex items-center">
                  <Calendar size={18} className="mr-2" />
                  <span>Congé</span>
                </div>
                <ChevronDown size={16} className={`transform transition-transform ${congeOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {congeOpen && (
                <ul className="py-2 space-y-1 pl-9">
                  <li>
                    <Link 
                      to="/conge/ajouter"
                      className={`text-sm sidebar-link py-1.5 ${isActive('/conge/ajouter') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                    >
                      Ajouter un congé
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/conge/liste"
                      className={`text-sm sidebar-link py-1.5 ${isActive('/conge/liste') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                    >
                      Voir mes congés
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            
            <li>
              <button 
                type="button" 
                className={`sidebar-link w-full flex items-center justify-between ${
                  location.pathname.includes('/permission') ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setPermissionOpen(!permissionOpen)}
              >
                <div className="flex items-center">
                  <Clock size={18} className="mr-2" />
                  <span>Permission</span>
                </div>
                <ChevronDown size={16} className={`transform transition-transform ${permissionOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {permissionOpen && (
                <ul className="py-2 space-y-1 pl-9">
                  <li>
                    <Link 
                      to="/permission/ajouter"
                      className={`text-sm sidebar-link py-1.5 ${isActive('/permission/ajouter') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                    >
                      Ajouter une permission
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/permission/liste"
                      className={`text-sm sidebar-link py-1.5 ${isActive('/permission/liste') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                    >
                      Voir mes permissions
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            
            {isAdmin && (
              <li className="pt-2 border-t border-gray-200 mt-2">
                <button 
                  type="button" 
                  className={`sidebar-link w-full flex items-center justify-between ${
                    location.pathname.includes('/admin') ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setAdminOpen(!adminOpen)}
                >
                  <div className="flex items-center">
                    <Users size={18} className="mr-2" />
                    <span>Administration</span>
                  </div>
                  <ChevronDown size={16} className={`transform transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {adminOpen && (
                  <ul className="py-2 space-y-1 pl-9">
                    <li>
                      <Link 
                        to="/admin/dashboard"
                        className={`text-sm sidebar-link py-1.5 ${isActive('/admin/dashboard') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        Dashboard Admin
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/admin/employees"
                        className={`text-sm sidebar-link py-1.5 ${isActive('/admin/employees') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        Employés
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/admin/employees/add"
                        className={`text-sm sidebar-link py-1.5 ${isActive('/admin/employees/add') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        Ajouter un employé
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/admin/holidays"
                        className={`text-sm sidebar-link py-1.5 ${isActive('/admin/holidays') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        Jours fériés
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/admin/leaves"
                        className={`text-sm sidebar-link py-1.5 ${isActive('/admin/leaves') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        Récapitulatif congés
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/admin/leaves/carryover"
                        className={`text-sm sidebar-link py-1.5 ${isActive('/admin/leaves/carryover') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        Report des congés
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/admin/employee-absences"
                        className={`text-sm sidebar-link py-1.5 ${isActive('/admin/employee-absences') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        Détails des absences
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/admin/presence"
                        className={`text-sm sidebar-link py-1.5 ${isActive('/admin/presence') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        Présence quotidienne
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/admin/approvals"
                        className={`text-sm sidebar-link py-1.5 ${isActive('/admin/approvals') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        Demandes en attente
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            )}
          </ul>
        </div>
        
        <div className="px-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <h5 className="mb-2 text-sm font-medium text-blue-900">Besoin d'aide ?</h5>
            <p className="text-xs text-blue-800">
              Si vous avez des questions sur l'utilisation de cette application, n'hésitez pas à contacter l'administrateur système.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
 