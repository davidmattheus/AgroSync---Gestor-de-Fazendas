
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarmData } from '../context/FarmDataContext';
import { CornIcon } from '../components/ui/Icons';

const FarmSetup: React.FC = () => {
    const [farmName, setFarmName] = useState('Cerrado Verde');
    const { setFarmName: saveFarmName } = useFarmData();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (farmName.trim()) {
            saveFarmName(farmName.trim());
            navigate('/dashboard', { replace: true });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-agro-light-green">
            <div className="w-full max-w-lg p-8 m-4 space-y-6 bg-white rounded-2xl shadow-lg">
                <div className="text-center">
                    <div className="inline-block p-3 mb-4 bg-agro-green rounded-full">
                        <CornIcon className="text-white" size={32}/>
                    </div>
                    <h1 className="text-3xl font-bold text-agro-gray-800">Configure sua Fazenda</h1>
                    <p className="mt-2 text-agro-gray-600">Para começar, dê um nome à sua fazenda. Você poderá gerenciar todas as suas operações a partir daqui.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="farmName" className="text-sm font-bold text-gray-600 block">Nome da Fazenda</label>
                        <input 
                            id="farmName"
                            type="text" 
                            value={farmName} 
                            onChange={e => setFarmName(e.target.value)} 
                            required 
                            className="w-full p-3 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" 
                            placeholder="Ex: Fazenda Santa Maria"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={!farmName.trim()}
                        className="w-full py-3 mt-4 text-white bg-agro-green rounded-md font-semibold hover:bg-opacity-90 transition-colors disabled:bg-opacity-50"
                    >
                        Salvar e Continuar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FarmSetup;