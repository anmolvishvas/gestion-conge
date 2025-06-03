import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLeaveContext } from '../context/LeaveContext';
import { useUserContext } from '../context/UserContext';
import { Leave, HalfDayOption, LeaveType, HalfDayType, Holiday } from '../types';
import { ArrowLeft, Save, Calendar, Clock, Info } from 'lucide-react';
import { format, eachDayOfInterval, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { leaveService } from '../services/leaveService';

const HALF_DAY_TYPES = {
  FULL: 'FULL' as HalfDayType,
  AM: 'AM' as HalfDayType,
  PM: 'PM' as HalfDayType,
  NONE: 'NONE' as HalfDayType,
};

const EditLeave = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leaves, updateLeave, refreshLeaves } = useLeaveContext();
  const { currentUser } = useUserContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Leave>>({
    startDate: '',
    endDate: '',
    type: 'Congé payé' as LeaveType,
    reason: '',
    halfDayOptions: [],
  });

  const [selectedDays, setSelectedDays] = useState<HalfDayOption[]>([]);

  const fetchHolidays = async () => {
    setIsLoadingHolidays(true);
    try {
      const holidayDates = await leaveService.getHolidays();
      setHolidays(holidayDates);
      if (holidayDates.length === 0) {
        console.warn('Aucun jour férié trouvé dans la base de données');
      }
    } catch (err) {
      setError(prev => prev || 'Les jours fériés n\'ont pas pu être chargés. Le calcul des jours ne les prendra pas en compte.');
    } finally {
      setIsLoadingHolidays(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const calculateLeaveBalances = () => {
    if (!currentUser || !leaves) return { paid: 0, sick: 0, pendingPaid: 0, pendingSick: 0 };
    
    const userLeaves = leaves.filter(leave => leave.userId === currentUser.id);
    const currentLeave = leaves.find(leave => leave.id === parseInt(id || '0'));
    
    const approvedPaidLeaves = userLeaves
      .filter(leave => 
        leave.type === 'Congé payé' && 
        leave.status === 'Approuvé' &&
        leave.id !== parseInt(id || '0')
      )
      .reduce((total, leave) => total + parseFloat(leave.totalDays), 0);
      
    const approvedSickLeaves = userLeaves
      .filter(leave => 
        leave.type === 'Congé maladie' && 
        leave.status === 'Approuvé' &&
        leave.id !== parseInt(id || '0')
      )
      .reduce((total, leave) => total + parseFloat(leave.totalDays), 0);
    
    const pendingPaidLeaves = userLeaves
      .filter(leave => 
        leave.type === 'Congé payé' && 
        leave.status === 'En attente' &&
        leave.id !== parseInt(id || '0')
      )
      .reduce((total, leave) => total + parseFloat(leave.totalDays), 0);
      
    const pendingSickLeaves = userLeaves
      .filter(leave => 
        leave.type === 'Congé maladie' && 
        leave.status === 'En attente' &&
        leave.id !== parseInt(id || '0')
      )
      .reduce((total, leave) => total + parseFloat(leave.totalDays), 0);
    
    return {
      paid: Math.max(0, (currentUser.paidLeaveBalance || 0) - approvedPaidLeaves),
      sick: Math.max(0, (currentUser.sickLeaveBalance || 0) - approvedSickLeaves),
      pendingPaid: pendingPaidLeaves,
      pendingSick: pendingSickLeaves,
      currentLeave
    };
  };

  const balances = calculateLeaveBalances();

  useEffect(() => {
    if (id) {
      const leave = leaves.find(l => l.id === parseInt(id));
      if (leave && leave.status === 'En attente') {
        setFormData({
          startDate: leave.startDate,
          endDate: leave.endDate,
          type: leave.type,
          reason: leave.reason,
          halfDayOptions: leave.halfDayOptions || [],
        });

        if (leave.halfDayOptions && leave.halfDayOptions.length > 0) {
        setSelectedDays(leave.halfDayOptions);
        }
      } else {
        setError('Ce congé n\'est pas modifiable ou n\'existe pas');
        navigate('/conge/liste');
      }
    }
  }, [id, leaves, navigate]);

  useEffect(() => {
    if (!formData.startDate || !formData.endDate) {
      setSelectedDays([]);
      return;
    }

    const days = eachDayOfInterval({
      start: new Date(formData.startDate),
      end: new Date(formData.endDate)
    });

    const workingDays = days.filter(day => {
        const isWeekendDay = isWeekend(day);
      const dayStr = format(day, 'yyyy-MM-dd');
        const isHolidayDay = holidays.some(holiday => 
        holiday.date.split('T')[0] === dayStr
        );
        return !isWeekendDay && !isHolidayDay;
    });

    const newHalfDayOptions = workingDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const existingFormOption = formData.halfDayOptions?.find(opt => opt.date === dateStr);
      const existingSelectedOption = selectedDays.find(opt => opt.date === dateStr);
      
      if (existingFormOption) {
        return existingFormOption;
      } else if (existingSelectedOption) {
        return existingSelectedOption;
      }

      return {
        date: dateStr,
        type: formData.type === 'Congé maladie' ? HALF_DAY_TYPES.FULL : HALF_DAY_TYPES.FULL
      };
    });

    setSelectedDays(newHalfDayOptions);
  }, [formData.startDate, formData.endDate, holidays, formData.type]);

  const getExcludedDays = (start: string, end: string) => {
    if (!start || !end) return [];
    
    const days = eachDayOfInterval({
      start: new Date(start),
      end: new Date(end)
    });

    return days
      .filter(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return holidays.some(holiday => holiday.date.split('T')[0] === dayStr);
      })
      .map(day => format(day, 'yyyy-MM-dd'));
  };

  const calculateDays = (start: string, end: string, halfDays: HalfDayOption[]) => {
    if (!start || !end) return 0;

    const days = eachDayOfInterval({
      start: new Date(start),
      end: new Date(end)
    });

    let totalDays = 0;
    
    days.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const isHoliday = holidays.some(holiday => holiday.date.split('T')[0] === dayStr);
      const isWeekendDay = isWeekend(day);
      
      if (!isWeekendDay && !isHoliday) {
        const halfDay = halfDays.find(hd => hd.date === dayStr);
        if (halfDay) {
          switch (halfDay.type) {
            case HALF_DAY_TYPES.FULL:
              totalDays += 1;
              break;
            case HALF_DAY_TYPES.AM:
            case HALF_DAY_TYPES.PM:
              totalDays += 0.5;
              break;
            case HALF_DAY_TYPES.NONE:
              break;
          }
        } else {
          totalDays += 1;
        }
      }
    });

    return totalDays;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      return newData;
    });
  };

  const handleHalfDayChange = (date: string, type: HalfDayType) => {
    if (formData.type === 'Congé maladie') return;

    const newSelectedDays = selectedDays.map(day => 
      day.date === date ? { ...day, type } : day
    );
    
    setSelectedDays(newSelectedDays);
    setFormData(prev => ({
      ...prev,
      halfDayOptions: newSelectedDays
    }));
  };

  const datesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    const start1Date = new Date(start1);
    const end1Date = new Date(end1);
    const start2Date = new Date(start2);
    const end2Date = new Date(end2);

    return start1Date <= end2Date && end1Date >= start2Date;
  };

  const checkOverlappingLeaves = () => {
    if (!currentUser || !leaves || !id || !formData.startDate || !formData.endDate) return null;

    const userLeaves = leaves.filter(leave => 
      leave.userId === currentUser.id && 
      leave.id !== parseInt(id) && 
      (leave.status === 'En attente' || leave.status === 'Approuvé')
    );

    const overlappingLeave = userLeaves.find(leave => 
      datesOverlap(formData.startDate, formData.endDate, leave.startDate, leave.endDate)
    );

    return overlappingLeave;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.startDate || !formData.endDate || !formData.type) {
      setError('Données du formulaire incomplètes');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const existingLeave = leaves.find(l => l.id === parseInt(id));
      if (!existingLeave) throw new Error("Congé introuvable");

      const overlappingLeave = checkOverlappingLeaves();
      if (overlappingLeave) {
        setError(`Vous avez déjà une demande de congé pour cette période (${format(new Date(overlappingLeave.startDate), 'dd/MM/yyyy')} au ${format(new Date(overlappingLeave.endDate), 'dd/MM/yyyy')} - ${overlappingLeave.status})`);
        setIsSubmitting(false);
        return;
      }

      if (formData.type === 'Congé maladie') {
        const startOnHoliday = holidays.some(holiday => holiday.date === formData.startDate);
        const endOnHoliday = holidays.some(holiday => holiday.date === formData.endDate);
        
        if (startOnHoliday || endOnHoliday) {
          setError('Les congés maladie ne peuvent pas commencer ou finir un jour férié.');
          setIsSubmitting(false);
          return;
        }
      }

      const totalDays = calculateDays(formData.startDate, formData.endDate, selectedDays);

      if (formData.type === 'Congé payé') {
        const totalRequestedAndPending = totalDays + balances.pendingPaid;
        if (totalRequestedAndPending > balances.paid) {
          setError(`Vous n'avez pas assez de jours de congés payés disponibles. 
            Solde restant: ${balances.paid} jours${balances.pendingPaid > 0 ? ` (dont ${balances.pendingPaid} jours en attente)` : ''}.
            Cette modification de ${totalDays} jours dépasserait votre solde disponible.`);
          setIsSubmitting(false);
          return;
        }
      }

      if (formData.type === 'Congé maladie') {
        const totalRequestedAndPending = totalDays + balances.pendingSick;
        if (totalRequestedAndPending > balances.sick) {
          setError(`Vous n'avez pas assez de jours de congés maladie disponibles. 
            Solde restant: ${balances.sick} jours${balances.pendingSick > 0 ? ` (dont ${balances.pendingSick} jours en attente)` : ''}.
            Cette modification de ${totalDays} jours dépasserait votre solde disponible.`);
          setIsSubmitting(false);
          return;
        }
      }

      const updatedLeave: Leave = {
        ...existingLeave,
        startDate: formData.startDate,
        endDate: formData.endDate,
        type: formData.type,
        reason: formData.reason || '',
        halfDayOptions: selectedDays,
        totalDays: totalDays.toString(),
      };

      await updateLeave(parseInt(id), updatedLeave);
      await refreshLeaves();
      navigate('/conge/liste');
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour du congé');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/conge/liste')}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
        >
          <ArrowLeft size={20} className="mr-1" />
          Retour à la liste
        </button>
        <h1 className="text-2xl font-bold text-indigo-900 mt-4">Modifier un congé</h1>
        <p className="text-sm text-indigo-600 mt-1">Modifiez votre demande de congé</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg relative">
          <span className="block sm:inline">{error}</span>
          {error.includes('jours fériés') && (
            <button
              onClick={() => {
                setError(null);
                fetchHolidays();
              }}
              className="ml-2 underline hover:text-red-800"
            >
              Réessayer
            </button>
          )}
        </div>
      )}

      {formData.startDate && formData.endDate && getExcludedDays(formData.startDate, formData.endDate).length > 0 && (
        <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Jours fériés détectés dans la période sélectionnée
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>Les jours suivants sont fériés et seront automatiquement exclus du calcul :</p>
                <ul className="list-disc list-inside mt-1">
                  {getExcludedDays(formData.startDate, formData.endDate).map(date => {
                    const formattedDate = format(new Date(date), 'yyyy-MM-dd');
                    const holidayInfo = holidays.find(h => h.date.split('T')[0] === formattedDate);
                    return (
                      <li key={date} className="ml-2">
                        {format(new Date(date), 'dd/MM/yyyy')} - {holidayInfo?.name || 'Jour férié'}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {formData.type === 'Congé maladie' && holidays.length > 0 && (
        <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-700 rounded-lg">
          <div className="flex items-start">
            <Info size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Information importante</p>
              <p className="text-sm mt-1">Les congés maladie ne peuvent pas commencer ou finir un jour férié. Veuillez sélectionner une autre date.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-indigo-900">Formulaire de modification</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 mb-4">
                    <div className="absolute top-0 left-0 w-full h-full">
                      <div className="w-16 h-16 rounded-full border-4 border-dashed border-indigo-600 animate-spin"></div>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <Save className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="text-indigo-900 font-medium animate-pulse">
                  Enregistrement en cours...
                </div>
                <div className="text-indigo-600/80 text-sm mt-1">
                  Veuillez patienter un instant
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-indigo-700 mb-3 uppercase tracking-wide">
                Type de congé
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'Congé payé' }))}
                  className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2
                    ${formData.type === 'Congé payé' 
                      ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-200 shadow-sm' 
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <Calendar size={16} />
                  Congé payé
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'Congé maladie' }))}
                  className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2
                    ${formData.type === 'Congé maladie' 
                      ? 'bg-red-100 text-red-800 border-2 border-red-200 shadow-sm' 
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <Clock size={16} />
                  Congé maladie
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'Congé sans solde' }))}
                  className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2
                    ${formData.type === 'Congé sans solde' 
                      ? 'bg-amber-100 text-amber-800 border-2 border-amber-200 shadow-sm' 
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <Calendar size={16} />
                  Congé sans solde
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
                Date de début
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={(e) => {
                    handleDateChange(e);
                    if (formData.endDate && e.target.value > formData.endDate) {
                      setFormData(prev => ({ ...prev, endDate: '' }));
                    }
                  }}
                  className="form-input w-full rounded-lg border-2 border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 
                  hover:border-indigo-300 transition-colors duration-200 cursor-pointer"
                  required
                  onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                />
                {formData.startDate && holidays.some(holiday => holiday.date.split('T')[0] === formData.startDate) && (
                  <p className="mt-1 text-sm text-amber-600">
                    Cette date est un jour férié : {holidays.find(h => h.date.split('T')[0] === formData.startDate)?.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
                Date de fin
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleDateChange}
                  className="form-input w-full rounded-lg border-2 border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 
                  hover:border-indigo-300 transition-colors duration-200 cursor-pointer"
                  required
                  min={formData.startDate}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                  disabled={!formData.startDate}
                />
                {formData.endDate && holidays.some(holiday => holiday.date.split('T')[0] === formData.endDate) && (
                  <p className="mt-1 text-sm text-amber-600">
                    Cette date est un jour férié : {holidays.find(h => h.date.split('T')[0] === formData.endDate)?.name}
                  </p>
                )}
              </div>
            </div>

            {formData.type !== 'Congé maladie' && (
              <div>
                <label className="block text-sm font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
                  Motif
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="form-textarea w-full rounded-lg border-2 border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 
                  hover:border-indigo-300 transition-colors duration-200
                  min-h-[120px] p-4 text-gray-700 placeholder-gray-400
                  bg-white"
                  placeholder="Décrivez le motif de votre demande de congé..."
                />
              </div>
            )}
          </div>

          {selectedDays.length > 0 && formData.type !== 'Congé maladie' && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">Options demi-journées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDays.map((day: HalfDayOption) => (
                  <div key={day.date} className="border-2 border-gray-100 rounded-lg p-4 bg-gradient-to-br from-white to-indigo-50">
                    <div className="font-medium text-indigo-800 mb-2">
                      {format(new Date(day.date), 'EEEE d MMMM', { locale: fr })}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleHalfDayChange(day.date, HALF_DAY_TYPES.FULL)}
                        className={`flex-1 py-1.5 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          day.type === HALF_DAY_TYPES.FULL 
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200 shadow-sm' 
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Journée
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHalfDayChange(day.date, HALF_DAY_TYPES.AM)}
                        className={`flex-1 py-1.5 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          day.type === HALF_DAY_TYPES.AM 
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200 shadow-sm' 
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Matin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHalfDayChange(day.date, HALF_DAY_TYPES.PM)}
                        className={`flex-1 py-1.5 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          day.type === HALF_DAY_TYPES.PM 
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200 shadow-sm' 
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Après-midi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHalfDayChange(day.date, HALF_DAY_TYPES.NONE)}
                        className={`flex-1 py-1.5 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          day.type === HALF_DAY_TYPES.NONE
                            ? 'bg-red-100 text-red-800 border-red-200 shadow-sm' 
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Ne pas appliquer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="text-sm space-y-1">
              {isLoadingHolidays ? (
                <span className="text-indigo-600">Chargement des jours fériés...</span>
              ) : (
                <>
                  <div className="text-indigo-900 font-medium">
                    Nombre de jours : {calculateDays(formData.startDate!, formData.endDate!, selectedDays)}
                    {holidays.length === 0 && (
                      <span className="ml-1 text-amber-600">(jours fériés non pris en compte)</span>
                    )}
                  </div>
                  {formData.startDate && formData.endDate && holidays.length > 0 && (
                    <div className="text-indigo-600 text-xs">
                      {getExcludedDays(formData.startDate, formData.endDate).length > 0 ? (
                        <>
                          Jours fériés exclus : {getExcludedDays(formData.startDate, formData.endDate).join(', ')}
                        </>
                      ) : null}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate('/conge/liste')}
                className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 
                transition-colors duration-200 font-medium"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="relative px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white 
                transition-colors duration-200 font-medium flex items-center shadow-sm min-w-[200px] justify-center
                disabled:bg-indigo-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1.5" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeave; 