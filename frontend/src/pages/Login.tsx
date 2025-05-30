import { useState, useEffect } from 'react';
import { Calendar, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useUserContext } from '../context/UserContext';
import '../styles/loginAnimation.css';
import logoSydev from '../assets/images/LogoSydev.png';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggedIn, isAdmin, currentUser } = useUserContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    try {
      console.log('Tentative de connexion...');
      await login(email, password);
      console.log('Connexion réussie');
      onLogin();
      // La redirection sera gérée par l'effet ci-dessous
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Email ou mot de passe incorrect.');
    }
  };

  // Effet pour gérer la redirection après connexion
  useEffect(() => {
    console.log('Effect de redirection - État actuel:', { isLoggedIn, isAdmin, currentUser });
    if (isLoggedIn && currentUser) {
      const redirectPath = currentUser.isAdmin ? '/admin/dashboard' : '/dashboard';
      console.log('Redirection vers:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [isLoggedIn, isAdmin, currentUser, navigate]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Animated Background */}
      <div className="login-background">
        <div className="background-grid-container">
          <div className="box-root flex-flex" style={{ gridArea: 'top / start / 8 / end' }}>
            <div className="box-root" style={{ backgroundImage: 'linear-gradient(white 0%, rgb(247, 250, 252) 33%)', flexGrow: 1 }}></div>
          </div>
          <div className="box-root flex-flex" style={{ gridArea: '4 / 2 / auto / 5' }}>
            <div className="box-root box-divider trans3s"></div>
          </div>
          <div className="box-root flex-flex" style={{ gridArea: '6 / start / auto / 2' }}>
            <div className="box-root box-blue-dark"></div>
          </div>
          <div className="box-root flex-flex" style={{ gridArea: '7 / start / auto / 4' }}>
            <div className="box-root box-blue animation-left-right"></div>
          </div>
          <div className="box-root flex-flex" style={{ gridArea: '8 / 4 / auto / 6' }}>
            <div className="box-root box-gray trans3s"></div>
          </div>
          <div className="box-root flex-flex" style={{ gridArea: '2 / 15 / auto / end' }}>
            <div className="box-root box-cyan trans4s"></div>
          </div>
          <div className="box-root flex-flex" style={{ gridArea: '3 / 14 / auto / end' }}>
            <div className="box-root box-blue animation-right-left"></div>
          </div>
          <div className="box-root flex-flex" style={{ gridArea: '4 / 17 / auto / 20' }}>
            <div className="box-root box-gray trans4s"></div>
          </div>
          <div className="box-root flex-flex" style={{ gridArea: '5 / 14 / auto / 17' }}>
            <div className="box-root box-divider trans3s"></div>
          </div>
        </div>
      </div>

      {/* Login Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <img
              src={logoSydev}
              alt="Logo Sydev"
              className="h-60 w-auto sm:h-48"
            />
          </div>
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 text-white p-3 rounded-lg inline-flex">
              <Calendar size={30} />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Gestion des Congés
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/90 backdrop-blur-sm py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 flex items-center">
                <AlertCircle size={20} className="mr-2" />
                <p>{error}</p>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="exemple@entreprise.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff size={16} className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye size={16} className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Se connecter
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
 