import { useState, useEffect } from 'react';
import { ArrowRight, Info, Save, Loader2, Check } from 'lucide-react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { leaveBalanceService } from '../../services/leaveBalanceService';

interface UserBalance {
    userId: number;
    name: string;
    remainingDays: number;
    carriedOverDays: number;
    newCarryOver: number;
    balanceId: number;
}

const LeaveCarryover = () => {
    const [users, setUsers] = useState<UserBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [year] = useState(new Date().getFullYear());
    const [saving, setSaving] = useState(false);
    const [updatingUser, setUpdatingUser] = useState<number | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userService.getAll();
            const usersWithBalance = await Promise.all(
                response.map(async (user: User) => {
                    const balance = await leaveBalanceService.getUserBalance(user.id, year - 1);
                    
                    if (!balance || !balance.id) {
                        return null;
                    }

                    const actualRemainingDays = balance.remainingPaidLeave + 
                        (balance.carriedOverFromPreviousYear || 0) - 
                        (balance.carriedOverToNextYear || 0);

                    return {
                        userId: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        remainingDays: actualRemainingDays,
                        carriedOverDays: balance.carriedOverToNextYear,
                        newCarryOver: balance.carriedOverToNextYear,
                        balanceId: balance.id
                    };
                })
            );
            
            const validUsers = usersWithBalance
                .filter((user): user is UserBalance => user !== null)
                .sort((a, b) => a.name.localeCompare(b.name));
            
            setUsers(validUsers);
                
        } catch (err) {
            setError('Erreur lors du chargement des données');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCarryOverChange = (userId: number, value: number) => {
        setUsers(users.map(user => {
            if (user.userId === userId) {
                return {
                    ...user,
                    newCarryOver: Math.min(Math.max(0, value), user.remainingDays)
                };
            }
            return user;
        }));
    };

    const updateUserBalance = async (user: UserBalance) => {
        try {
            setUpdatingUser(user.userId);
            setError(null);
            setSuccess(null);

            await leaveBalanceService.carryOverLeaves(user.userId, year - 1, user.newCarryOver);

            setSuccess(`Le report a été mis à jour pour ${user.name}`);
            await loadUsers();
        } catch (err) {
            setError(`Erreur lors de la mise à jour pour ${user.name}`);
            console.error(err);
        } finally {
            setUpdatingUser(null);
        }
    };

    const hasChanges = () => {
        return users.some(user => user.newCarryOver !== user.carriedOverDays);
    };

    const saveCarryOvers = async () => {
        if (!hasChanges()) {
            setError('Aucune modification à enregistrer');
            return;
        }

        if (!window.confirm('Voulez-vous vraiment enregistrer les modifications des reports de congés ?')) {
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const changedUsers = users.filter(user => user.newCarryOver !== user.carriedOverDays);
            
            for (const user of changedUsers) {
                await leaveBalanceService.carryOverLeaves(user.userId, year - 1, user.newCarryOver);
            }

            setSuccess(`Les reports ont été enregistrés avec succès pour ${changedUsers.length} employé(s)`);
            await loadUsers();
        } catch (err) {
            setError('Erreur lors de la sauvegarde des reports');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Report des congés {year-1} → {year}</h1>
                <button
                    onClick={saveCarryOvers}
                    disabled={saving || !hasChanges()}
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                        hasChanges() 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {saving ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}
                    <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
                    <Info size={20} className="mr-2" />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
                    <Info size={20} className="mr-2" />
                    {success}
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">
                        Report des congés non utilisés
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Définissez le nombre de jours à reporter sur l'année {year} pour chaque employé.
                    </p>
                </div>

                {users.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        Aucun employé n'a de solde de congés pour l'année {year-1}.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employé
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center space-x-1">
                                            <span>Jours restants {year-1}</span>
                                            <div className="group relative">
                                                <Info size={14} className="text-gray-400 cursor-help" />
                                                <div className="hidden group-hover:block absolute z-10 w-72 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg -left-20 top-6">
                                                    Calculé comme suit : Solde restant + Report année précédente - Report année suivante
                                                </div>
                                            </div>
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jours à reporter
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.userId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {user.remainingDays} jours
                                                {user.carriedOverDays > 0 && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {user.carriedOverDays} jour{user.carriedOverDays > 1 ? 's' : ''} reporté{user.carriedOverDays > 1 ? 's' : ''} sur {year}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={user.remainingDays}
                                                    value={user.newCarryOver}
                                                    onChange={(e) => handleCarryOverChange(user.userId, parseInt(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <span className="text-sm text-gray-500">jours</span>
                                                {user.newCarryOver !== user.carriedOverDays && (
                                                    <div className="flex items-center text-blue-600">
                                                        <ArrowRight size={16} className="mx-1" />
                                                        <span className="text-sm">Modifié</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => updateUserBalance(user)}
                                                disabled={updatingUser === user.userId || user.newCarryOver === user.carriedOverDays}
                                                className={`inline-flex items-center px-3 py-1 rounded-md text-sm ${
                                                    user.newCarryOver !== user.carriedOverDays
                                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {updatingUser === user.userId ? (
                                                    <Loader2 className="animate-spin h-4 w-4" />
                                                ) : (
                                                    <Check className="h-4 w-4" />
                                                )}
                                                <span className="ml-1">
                                                    {updatingUser === user.userId ? 'Mise à jour...' : 'Mettre à jour'}
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveCarryover; 