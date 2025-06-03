import  { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Info, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { useLeaveContext } from '../context/LeaveContext';
import MedicalCertificateUpload from '../components/MedicalCertificateUpload';
import { Leave, HalfDayOption, HalfDayType } from '../types/index';
import { calculateLeaveDuration, getDatesBetween, formatDate } from '../utils/formatters';
import { Holiday } from '../types/Holiday';
import { leaveService } from '../services/leaveService';
import { isWeekend } from 'date-fns';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HALF_DAY_TYPES } from '../constants/halfDayTypes';

const AddLeave = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserContext();
  const { addLeave, uploadCertificate, refreshLeaves, leaves } = useLeaveContext();
  
  const [leaveType, setLeaveType] = useState<'Congé payé' | 'Congé maladie' | 'Congé sans solde'>('Congé payé');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [certificate, setCertificate] = useState<File | null>(null);
  const [dateOptions, setDateOptions] = useState<HalfDayOption[]>([]);
  const [leaveDuration, setLeaveDuration] = useState(0);
  const [showCertificateUpload, setShowCertificateUpload] = useState(false);
  const [error, setError] = useState('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [excludedHolidays, setExcludedHolidays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const calculateLeaveBalances = () => {
    if (!currentUser || !leaves) return { paid: 0, sick: 0, pendingPaid: 0, pendingSick: 0 };
    
    const userLeaves = leaves.filter(leave => leave.userId === currentUser.id);
    
    const approvedPaidLeaves = userLeaves
      .filter(leave => leave.type === 'Congé payé' && leave.status === 'Approuvé')
      .reduce((total, leave) => total + parseFloat(leave.totalDays), 0);
      
    const approvedSickLeaves = userLeaves
      .filter(leave => leave.type === 'Congé maladie' && leave.status === 'Approuvé')
      .reduce((total, leave) => total + parseFloat(leave.totalDays), 0);
    
    const pendingPaidLeaves = userLeaves
      .filter(leave => leave.type === 'Congé payé' && leave.status === 'En attente')
      .reduce((total, leave) => total + parseFloat(leave.totalDays), 0);
      
    const pendingSickLeaves = userLeaves
      .filter(leave => leave.type === 'Congé maladie' && leave.status === 'En attente')
      .reduce((total, leave) => total + parseFloat(leave.totalDays), 0);
    
    return {
      paid: Math.max(0, (currentUser.paidLeaveBalance || 0) - approvedPaidLeaves),
      sick: Math.max(0, (currentUser.sickLeaveBalance || 0) - approvedSickLeaves),
      pendingPaid: pendingPaidLeaves,
      pendingSick: pendingSickLeaves
    };
  };
  
  const balances = calculateLeaveBalances();
  
  useEffect(() => {
    const fetchHolidays = async () => {
      setIsLoadingHolidays(true);
      try {
        const holidayDates = await leaveService.getHolidays();
        setHolidays(holidayDates);
      } catch (error) {
        console.error('Error fetching holidays:', error);
        setError('Erreur lors du chargement des jours fériés');
      } finally {
        setIsLoadingHolidays(false);
      }
    };
    fetchHolidays();
  }, []);
  
  const handleHalfDayChange = (date: string, type: HalfDayType) => {
    if (leaveType === 'Congé maladie') return;
    
    const updatedOptions = dateOptions.map(option => 
      option.date === date ? { ...option, type } : option
    );
    
    setDateOptions(updatedOptions);
  };

  useEffect(() => {
    if (!startDate || !endDate) {
      setDateOptions([]);
      setExcludedHolidays([]);
      setLeaveDuration(0);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      setError('La date de début doit être antérieure ou égale à la date de fin.');
      return;
    }

    const dates = getDatesBetween(startDate, endDate);
    const excludedHolidayDates: string[] = [];
    const workingDays: string[] = [];
    
    dates.forEach(date => {
      const currentDate = new Date(date);
      const isWeekendDay = isWeekend(currentDate);
      const isHolidayDay = holidays.some(holiday => {
        const holidayDate = holiday.date.split('T')[0];
        return holidayDate === date;
      });
      
      if (isHolidayDay) {
        excludedHolidayDates.push(date);
      }

      if (!isWeekendDay && !isHolidayDay) {
        workingDays.push(date);
      }
    });

    setExcludedHolidays(excludedHolidayDates);

    if (leaveType === 'Congé maladie') {
    setDateOptions(workingDays.map(date => ({ 
      date, 
      type: HALF_DAY_TYPES.FULL 
    })));
    } else {
      const newOptions = workingDays.map(date => {
        const existingOption = dateOptions.find(opt => opt.date === date);
        return existingOption || {
          date,
          type: HALF_DAY_TYPES.FULL
        };
      });
      setDateOptions(newOptions);
    }
  }, [startDate, endDate, holidays, leaveType]);

  useEffect(() => {
    if (!startDate || !endDate || dateOptions.length === 0) {
      setLeaveDuration(0);
      return;
    }

    let totalDays = 0;
    dateOptions.forEach(option => {
      switch (option.type) {
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
    });

    setLeaveDuration(totalDays);
  }, [startDate, endDate, dateOptions]);

  useEffect(() => {
    if (leaveType === 'Congé maladie') {
      setDateOptions(prev => prev.map(option => ({
        ...option,
        type: HALF_DAY_TYPES.FULL
      })));
    }
  }, [leaveType]);
  
  useEffect(() => {
    if (leaveType === 'Congé maladie' && dateOptions.length > 0) {
      const durationDays = calculateLeaveDuration(startDate, endDate, dateOptions, holidays);
      setShowCertificateUpload(durationDays > 3);
    } else {
      setShowCertificateUpload(false);
    }
  }, [leaveType, dateOptions, startDate, endDate, holidays]);
  
  const datesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    const start1Date = new Date(start1);
    const end1Date = new Date(end1);
    const start2Date = new Date(start2);
    const end2Date = new Date(end2);

    return start1Date <= end2Date && end1Date >= start2Date;
  };

  const checkOverlappingLeaves = () => {
    if (!currentUser || !leaves) return null;

    const userLeaves = leaves.filter(leave => 
      leave.userId === currentUser.id && 
      (leave.status === 'En attente' || leave.status === 'Approuvé')
    );

    const overlappingLeave = userLeaves.find(leave => 
      datesOverlap(startDate, endDate, leave.startDate, leave.endDate)
    );

    return overlappingLeave;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner les dates de début et de fin.');
      setIsSubmitting(false);
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      setError('La date de début doit être antérieure ou égale à la date de fin.');
      setIsSubmitting(false);
      return;
    }

    const overlappingLeave = checkOverlappingLeaves();
    if (overlappingLeave) {
      setError(`Vous avez déjà une demande de congé pour cette période (${format(new Date(overlappingLeave.startDate), 'dd/MM/yyyy')} au ${format(new Date(overlappingLeave.endDate), 'dd/MM/yyyy')} - ${overlappingLeave.status})`);
      setIsSubmitting(false);
      return;
    }

    if (leaveType === 'Congé maladie') {
      const startOnHoliday = holidays.some(holiday => holiday.date === startDate);
      const endOnHoliday = holidays.some(holiday => holiday.date === endDate);
      
      if (startOnHoliday || endOnHoliday) {
        setError('Les congés maladie ne peuvent pas commencer ou finir un jour férié.');
        setIsSubmitting(false);
        return;
      }
    }
    
    if (leaveType === 'Congé maladie' && showCertificateUpload && !certificate) {
      setError('Un certificat médical est requis pour les congés maladie de plus de 3 jours.');
      setIsSubmitting(false);
      return;
    }
    
    if (leaveType === 'Congé payé') {
      const totalRequestedAndPending = leaveDuration + balances.pendingPaid;
      if (totalRequestedAndPending > balances.paid) {
        setError(`Vous n'avez pas assez de jours de congés payés disponibles. 
          Solde restant: ${balances.paid} jours${balances.pendingPaid > 0 ? ` (dont ${balances.pendingPaid} jours en attente)` : ''}.
          Cette demande de ${leaveDuration} jours dépasserait votre solde disponible.`);
      setIsSubmitting(false);
      return;
    }
    }
    
    if (leaveType === 'Congé maladie') {
      const totalRequestedAndPending = leaveDuration + balances.pendingSick;
      if (totalRequestedAndPending > balances.sick) {
        setError(`Vous n'avez pas assez de jours de congés maladie disponibles. 
          Solde restant: ${balances.sick} jours${balances.pendingSick > 0 ? ` (dont ${balances.pendingSick} jours en attente)` : ''}.
          Cette demande de ${leaveDuration} jours dépasserait votre solde disponible.`);
      setIsSubmitting(false);
      return;
      }
    }
    
    const newLeave: Omit<Leave, 'id'> = {
      userId: currentUser?.id || 0,
      type: leaveType,
      startDate,
      endDate,
      halfDayOptions: dateOptions,
      status: 'En attente',
      reason: reason || '',
      certificate: null,
      totalDays: leaveDuration.toString()
    };
    
    try {
      const createdLeave = await addLeave(newLeave);
      if (certificate && createdLeave.id) {
        await uploadCertificate(createdLeave.id, certificate);
      }
      await refreshLeaves();
      navigate('/conge/liste');
    } catch (err) {
      setError('Erreur lors de la création du congé');
      console.error('Error creating leave:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-indigo-900">Ajouter un congé</h1>
      </div>
      
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center">
            <Calendar size={20} className="mr-2 text-indigo-600" />
            <h2 className="text-lg font-semibold text-indigo-900">Informations du congé</h2>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 mb-4">
                    <div className="absolute top-0 left-0 w-full h-full">
                      <div className="w-16 h-16 rounded-full border-4 border-dashed border-indigo-600 animate-spin"></div>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="text-indigo-900 font-medium animate-pulse">
                  Traitement de votre demande...
                </div>
                <div className="text-indigo-600/80 text-sm mt-1">
                  Veuillez patienter un instant
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 flex items-center rounded-lg">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {startDate && endDate && excludedHolidays.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-lg">
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
                      {excludedHolidays.map(date => {
                        const holiday = holidays.find(h => h.date.split('T')[0] === date);
                        return (
                          <li key={date} className="ml-2">
                            {format(new Date(date), 'dd/MM/yyyy')} - {holiday?.name || 'Jour férié'}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {leaveType === 'Congé maladie' && holidays.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-700 flex items-center rounded-lg">
              <Info size={20} className="mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Information importante</p>
                <p className="text-sm mt-1">Les congés maladie ne peuvent pas commencer ou finir un jour férié. Veuillez sélectionner une autre date.</p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700 flex items-center rounded-lg">
            <Info size={20} className="mr-2" />
            <div>
              <p className="font-medium">Solde de congés disponible:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                <li>
                  Congés payés: <span className="font-semibold">{balances.paid} jours</span>
                  {balances.pendingPaid > 0 && (
                    <span className="text-amber-600 ml-2">
                      ({balances.pendingPaid} jours en attente)
                    </span>
                  )}
                </li>
                <li>
                  Congés maladie: <span className="font-semibold">{balances.sick} jours</span>
                  {balances.pendingSick > 0 && (
                    <span className="text-amber-600 ml-2">
                      ({balances.pendingSick} jours en attente)
                    </span>
                  )}
                </li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-indigo-700 mb-3 uppercase tracking-wide">
                Type de congé
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setLeaveType('Congé payé')}
                  className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2
                    ${leaveType === 'Congé payé' 
                      ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-200 shadow-sm' 
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <Calendar size={16} />
                  Congé payé ({balances.paid} jours)
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveType('Congé maladie')}
                  className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2
                    ${leaveType === 'Congé maladie' 
                      ? 'bg-red-100 text-red-800 border-2 border-red-200 shadow-sm' 
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <Clock size={16} />
                    Congé maladie ({balances.sick} jours)
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveType('Congé sans solde')}
                  className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2
                    ${leaveType === 'Congé sans solde' 
                      ? 'bg-amber-100 text-amber-800 border-2 border-amber-200 shadow-sm' 
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <Calendar size={16} />
                  Congé sans solde
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) {
                      setEndDate('');
                    }
                  }}
                  className="form-input w-full rounded-lg border-2 border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 
                  hover:border-indigo-300 transition-colors duration-200 cursor-pointer"
                  required
                  onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                />
                {startDate && holidays.some(holiday => holiday.date.split('T')[0] === startDate) && (
                  <p className="mt-1 text-sm text-amber-600">
                    Cette date est un jour férié : {holidays.find(h => h.date.split('T')[0] === startDate)?.name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input w-full rounded-lg border-2 border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 
                  hover:border-indigo-300 transition-colors duration-200 cursor-pointer"
                  required
                  min={startDate}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                  disabled={!startDate}
                />
                {endDate && holidays.some(holiday => holiday.date.split('T')[0] === endDate) && (
                  <p className="mt-1 text-sm text-amber-600">
                    Cette date est un jour férié : {holidays.find(h => h.date.split('T')[0] === endDate)?.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {dateOptions.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
                Options de demi-journée
                {leaveType === 'Congé maladie' && (
                  <span className="ml-2 text-sm text-gray-500 normal-case">
                    (Non disponible pour les congés maladie)
                  </span>
                )}
              </label>
              {excludedHolidays.length > 0 && (
                <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-lg">
                  <h3 className="font-medium">Jours fériés exclus :</h3>
                  <ul className="mt-2 list-disc list-inside">
                    {excludedHolidays.map(date => (
                      <li key={date}>{formatDate(date)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateOptions.map((option) => (
                  <div key={option.date} className="border-2 border-gray-100 rounded-lg p-4 bg-gradient-to-br from-white to-indigo-50">
                    <div className="font-medium text-indigo-800 mb-2">
                      {format(new Date(option.date), 'EEEE d MMMM', { locale: fr })}
                    </div>
                    {leaveType === 'Congé maladie' ? (
                      <div className="py-1.5 px-2 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800 text-center shadow-sm">
                        Journée complète
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleHalfDayChange(option.date, HALF_DAY_TYPES.FULL)}
                          className={`flex-1 py-1.5 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            option.type === HALF_DAY_TYPES.FULL 
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200 shadow-sm' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Journée
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHalfDayChange(option.date, HALF_DAY_TYPES.AM)}
                          className={`flex-1 py-1.5 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            option.type === HALF_DAY_TYPES.AM 
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200 shadow-sm' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Matin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHalfDayChange(option.date, HALF_DAY_TYPES.PM)}
                          className={`flex-1 py-1.5 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            option.type === HALF_DAY_TYPES.PM 
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200 shadow-sm' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Après-midi
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHalfDayChange(option.date, HALF_DAY_TYPES.NONE)}
                          className={`flex-1 py-1.5 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            option.type === HALF_DAY_TYPES.NONE 
                              ? 'bg-red-100 text-red-800 border-red-200 shadow-sm' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Ne pas appliquer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-indigo-600 font-medium">
                Durée totale: <span className="font-semibold">{leaveDuration} jour{leaveDuration !== 1 ? 's' : ''}</span>
              </p>
            </div>
          )}
          
          {leaveType !== 'Congé maladie' && (
          <div>
              <label className="block text-sm font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
              Motif
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
                className="form-textarea w-full rounded-lg border-2 border-gray-300 shadow-sm 
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 
                hover:border-indigo-300 transition-colors duration-200
                min-h-[120px] p-4 text-gray-700 placeholder-gray-400
                bg-white"
                placeholder="Décrivez le motif de votre demande de congé..."
            />
          </div>
          )}
          
          {showCertificateUpload && (
            <div className="mt-6">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      Un certificat médical est requis pour les congés maladie de plus de 3 jours.
                    </p>
                  </div>
                </div>
              </div>
              <MedicalCertificateUpload
                onChange={setCertificate}
                file={certificate}
              />
            </div>
          )}
          
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
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
                  Traitement en cours...
                </>
              ) : (
                <>
              Soumettre la demande
                  <ChevronRight size={16} className="ml-1.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeave;
 