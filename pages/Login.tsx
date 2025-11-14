
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('davidmattheus2@gmail.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const success = await auth.login(email, password);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('E-mail ou senha inválidos.');
      }
    } else {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setLoading(false);
        return;
      }
      const success = await auth.register(name, email, password);
      if (success) {
        navigate('/setup-farm', { replace: true });
      } else {
        setError('Este e-mail já está em uso.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-agro-light-green">
      <div className="w-full max-w-md p-8 m-4 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <img src="https://i.imgur.com/TtmFLNL.png" alt="AgroSync Logo" className="w-auto h-24 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-agro-gray-800">Bem-vindo ao AgroSync</h1>
          <p className="text-agro-gray-600">{isLogin ? 'Faça login para continuar' : 'Crie sua conta para começar'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-sm font-bold text-gray-600 block">Nome</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
            </div>
          )}
          <div>
            <label className="text-sm font-bold text-gray-600 block">E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 block">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
          </div>
          {!isLogin && (
            <div>
              <label className="text-sm font-bold text-gray-600 block">Confirme a Senha</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <button type="submit" disabled={loading} className="w-full py-3 mt-4 text-white bg-agro-green rounded-md font-semibold hover:bg-opacity-90 transition-colors disabled:bg-opacity-50 flex items-center justify-center">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <div className="text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-agro-green hover:underline">
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
