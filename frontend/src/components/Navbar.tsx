import  { useNavigate } from 'react-router-dom';
import { User, Menu as MenuIcon, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useUserContext } from '../context/UserContext';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const navigate = useNavigate();
  const { currentUser, logout, isAdmin } = useUserContext();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    logout();
    toggleUserMenu();
    navigate('/login');
  };
  
  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30">
      <div className="px-3 py-3 lg:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              type="button"
              className="text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 p-2"
            >
              <MenuIcon size={20} />
            </button>
            <div className="flex items-center ml-2 md:ml-0">
              <span className="self-center text-xl font-bold whitespace-nowrap text-blue-600">
                Gestion des Congés
              </span>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:flex mr-4 space-x-1">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="flex items-center px-4 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  Administration
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                Dashboard
              </button>
            </div>
            
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center text-sm rounded-full focus:ring-4 focus:ring-gray-200 p-1"
                >
                  <div className="bg-blue-100 text-blue-600 rounded-full p-1.5">
                    <User size={20} />
                  </div>
                  <span className="ml-2 hidden md:inline-block font-medium text-gray-700">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </span>
                  <ChevronDown size={16} className="ml-1 text-gray-500" />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm text-gray-700">Connecté en tant que</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentUser?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2 text-gray-500" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
 