import { useState, useEffect } from 'react';
import { Clock, Info, PlusCircle, Trash, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { useLeaveContext } from '../context/LeaveContext';
import { Permission, ReplacementSlot } from '../types/index';
import { calculateDurationInMinutes, formatDuration } from '../utils/formatters';

const EditPermission = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUserContext();
  const { getPermissionById, updatePermission } = useLeaveContext();
  
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [replacementSlots, setReplacementSlots] = useState<ReplacementSlot[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchPermission = async () => {
      try {
        if (!id) return;
        
        const permission = await getPermissionById(parseInt(id));
        
        if (!permission) {
          setError('Permission non trouvée');
          return;
        }

        if (permission.userId !== currentUser?.id && !currentUser?.isAdmin) {
          navigate('/permission/liste');
          return;
        }

        if (permission.status !== 'En attente') {
          setError('Seules les permissions en attente peuvent être modifiées');
          return;
        }

        const formattedDate = new Date(permission.date).toISOString().split('T')[0];
        const formattedStartTime = permission.startTime.substring(0, 5);
        const formattedEndTime = permission.endTime.substring(0, 5);

        setDate(formattedDate);
        setStartTime(formattedStartTime);
        setEndTime(formattedEndTime);
        setReason(permission.reason);
        setDurationMinutes(permission.durationMinutes);

        const formattedSlots = permission.replacementSlots.map(slot => ({
          ...slot,
          date: new Date(slot.date).toISOString().split('T')[0],
          startTime: slot.startTime.substring(0, 5),
          endTime: slot.endTime.substring(0, 5)
        }));
        
        setReplacementSlots(formattedSlots);

      } catch (err) {
        console.error('Error fetching permission:', err);
        setError('Erreur lors du chargement de la permission');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermission();
  }, [id, currentUser, getPermissionById, navigate]);

  useEffect(() => {
    if (startTime && endTime) {
      const minutes = calculateDurationInMinutes(startTime, endTime);
      if (minutes > 0) {
        setDurationMinutes(minutes);
      } else {
        setDurationMinutes(0);
      }
    } else {
      setDurationMinutes(0);
    }
  }, [startTime, endTime]);
  
  const handleAddReplacementSlot = () => {
    const existingIds = replacementSlots
      .map(slot => slot.id)
      .filter((id): id is number => id !== undefined);
    const newId = (existingIds.length > 0 ? Math.max(...existingIds) : 0) + 1;
    const newSlot: ReplacementSlot = {
      id: newId,
      date: '',
      startTime: '',
      endTime: '',
      durationMinutes: 0
    };
    setReplacementSlots([...replacementSlots, newSlot]);
  };
  
  const handleRemoveReplacementSlot = (slotId: number) => {
    if (replacementSlots.length > 1) {
      setReplacementSlots(replacementSlots.filter(slot => slot.id && slot.id === slotId));
    }
  };
  
  const handleReplacementChange = (slotId: number, field: keyof ReplacementSlot, value: string) => {
    setReplacementSlots(replacementSlots.map(slot => {
      if (slot.id && slot.id === slotId) {
        const updatedSlot = { ...slot, [field]: value };
        
        if (field === 'startTime' || field === 'endTime') {
          if (updatedSlot.startTime && updatedSlot.endTime) {
            const minutes = calculateDurationInMinutes(updatedSlot.startTime, updatedSlot.endTime);
            updatedSlot.durationMinutes = minutes > 0 ? minutes : 0;
          }
        }
        return updatedSlot;
      }
      return slot;
    }));
  };
  
  const getTotalReplacementDuration = (): number => {
    return replacementSlots.reduce((total, slot) => total + slot.durationMinutes, 0);
  };
  
  const doDurationsMatch = (): boolean => {
    const totalReplacement = getTotalReplacementDuration();
    return totalReplacement === durationMinutes;
  };

  const isWeekend = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!id) {
      setError('ID de permission manquant');
      return;
    }

    if (!date || !startTime || !endTime || !reason) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (durationMinutes <= 0) {
      setError('La durée de la permission doit être positive.');
      return;
    }
    
    const invalidSlots = replacementSlots.filter(slot => !slot.date || !slot.startTime || !slot.endTime);
    if (invalidSlots.length > 0) {
      setError('Veuillez remplir tous les champs pour les plages de remplacement.');
      return;
    }

    const weekendSlots = replacementSlots.filter(slot => isWeekend(slot.date));
    if (weekendSlots.length > 0) {
      setError('Les remplacements ne peuvent pas être effectués le weekend.');
      return;
    }
    
    try {
      const updatedPermission: Partial<Permission> = {
        date,
        startTime,
        endTime,
        durationMinutes,
        reason,
        replacementSlots: replacementSlots.map(slot => ({
          ...slot,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          durationMinutes: slot.durationMinutes
        }))
      };
      
      await updatePermission(parseInt(id), updatedPermission);
      navigate('/permission/liste');
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour de la permission.');
      console.error('Error updating permission:', err);
    }
  };
  
  if (isLoading) {
    return <div className="p-4">Chargement...</div>;
  }

  if (error && error !== 'Veuillez remplir tous les champs obligatoires.') {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Modifier la permission</h1>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <Clock size={20} className="mr-2 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-900">Informations de la permission</h2>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              <p>{error}</p>
            </div>
          )}
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700">
            <div className="flex">
              <Info size={20} className="mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Règles des permissions :</p>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                  <li>Une permission ne doit pas dépasser 2 heures par semaine.</li>
                  <li>Elle doit être remplacée (rattrapée) dans la même semaine.</li>
                  <li>Le remplacement peut se faire n'importe quel jour de la même semaine, mais uniquement entre 08:00 et 18:30.</li>
                  <li>Vous pouvez répartir le remplacement sur plusieurs créneaux dans la semaine.</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de la permission
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de début
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motif
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="form-input"
              placeholder="Veuillez indiquer le motif de votre demande de permission"
              required
            />
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Plages de remplacement</h3>
              <button
                type="button"
                onClick={handleAddReplacementSlot}
                className="btn btn-secondary py-1.5 px-3 flex items-center"
              >
                <PlusCircle size={16} className="mr-1.5" />
                Ajouter
              </button>
            </div>
            
            <div className="space-y-4 mb-4">
              {replacementSlots.map((slot, index) => (
                <div key={slot.id || index} className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Plage de remplacement {index + 1}
                    </h4>
                    {replacementSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => slot.id !== undefined && handleRemoveReplacementSlot(slot.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={slot.date}
                        onChange={(e) => slot.id !== undefined && handleReplacementChange(slot.id, 'date', e.target.value)}
                        className="form-input text-sm"
                        required
                      />
                      {slot.date && isWeekend(slot.date) && (
                        <p className="mt-1 text-xs text-red-500">
                          Les remplacements ne sont pas autorisés le weekend
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Heure de début
                      </label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => slot.id !== undefined && handleReplacementChange(slot.id, 'startTime', e.target.value)}
                        className="form-input text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Heure de fin
                      </label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => slot.id !== undefined && handleReplacementChange(slot.id, 'endTime', e.target.value)}
                        className="form-input text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 border rounded-md">
              <div className="mr-3">
                {doDurationsMatch() ? (
                  <span className="text-green-400 text-lg">✓</span>
                ) : (
                  <span className="text-yellow-400 text-lg">⚠</span>
                )}
              </div>
              <div className="ml-3">
                <h3 className="font-medium">
                  {doDurationsMatch() 
                    ? 'Les durées correspondent'
                    : 'Les durées ne correspondent pas'}
                </h3>
                <div className="mt-1">
                  <p>Permission: {formatDuration(durationMinutes)}</p>
                  <p>Remplacement: {formatDuration(getTotalReplacementDuration())}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/permission/liste')}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
            >
              Enregistrer les modifications
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPermission; 