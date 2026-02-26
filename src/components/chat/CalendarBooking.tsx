import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { BusinessHours } from '../../core/ConfigLoader';

interface TimeSlot {
    time: string;
    available: boolean;
}

interface CalendarBookingProps {
    onSelect: (datetime: string) => void;
    sessionId: string;
    webhookUrl: string;
    primaryColor: string;
    accentColor: string;
    businessHours?: BusinessHours;
}

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
    start: 9,
    end: 18,
    days: [1, 2, 3, 4, 5] // Lun-Vie
};

export const CalendarBooking: React.FC<CalendarBookingProps> = ({
    onSelect,
    sessionId,
    webhookUrl,
    primaryColor,
    accentColor,
    businessHours = DEFAULT_BUSINESS_HOURS
}) => {
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        // Start from today, skip to next working day if today is not one
        const today = new Date();
        const day = today.getDay();
        if (!businessHours.days.includes(day)) {
            // Find next working day
            for (let i = 1; i <= 7; i++) {
                const next = new Date(today);
                next.setDate(today.getDate() + i);
                if (businessHours.days.includes(next.getDay())) return next;
            }
        }
        return today;
    });
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [dateOffset, setDateOffset] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const DAYS_PER_PAGE = 4;
    const TOTAL_DAYS = 14;

    const generateDays = () => {
        const days: Date[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < TOTAL_DAYS; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const days = generateDays();
    const visibleDays = days.slice(dateOffset, dateOffset + DAYS_PER_PAGE);

    const nextDays = () => {
        if (dateOffset + DAYS_PER_PAGE < days.length) {
            setDateOffset(prev => prev + 1);
        }
    };

    const prevDays = () => {
        if (dateOffset > 0) {
            setDateOffset(prev => prev - 1);
        }
    };

    useEffect(() => {
        const fetchAvailability = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'get_availability',
                        date: selectedDate.toISOString().split('T')[0],
                        sessionId
                    })
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();
                const generatedSlots: TimeSlot[] = [];
                const dayOfWeek = selectedDate.getDay();
                const isWorkingDay = businessHours.days.includes(dayOfWeek);

                if (isWorkingDay) {
                    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
                        ['00', '30'].forEach(min => {
                            const timeStr = hour.toString().padStart(2, '0') + ':' + min;
                            const isBusy = Array.isArray(data.busySlots) && data.busySlots.includes(timeStr);
                            generatedSlots.push({ time: timeStr, available: !isBusy });
                        });
                    }
                }
                setSlots(generatedSlots);
            } catch (err) {
                console.error('LexFlow: Error fetching availability:', err);
                setSlots([]);
                setError('No se pudo cargar la disponibilidad. Intentá de nuevo.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvailability();
    }, [selectedDate, sessionId, webhookUrl, businessHours]);

    const handleBooking = (time: string) => {
        const [hour, min] = time.split(':');
        const bookingDate = new Date(selectedDate);
        bookingDate.setHours(parseInt(hour), parseInt(min), 0, 0);

        const dateStr = bookingDate.toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        onSelect(`Agendar para el ${dateStr} a las ${time}hs`);
        setIsConfirmed(true);
    };

    if (isConfirmed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3 my-4"
                role="status"
                aria-live="polite"
            >
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    <CheckCircle2 className="text-zinc-950" size={24} />
                </div>
                <h3 className="text-emerald-500 font-bold">¡Solicitud Enviada!</h3>
                <p className="text-xs text-emerald-500/80">Recibirás una confirmación por correo o WhatsApp en breve.</p>
            </motion.div>
        );
    }

    return (
        <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 my-4 space-y-4 shadow-2xl overflow-hidden w-full max-w-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        <Calendar size={16} style={{ color: primaryColor }} aria-hidden />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">Agendar Consulta</h3>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                            Lun-Vie {businessHours.start}:00-{businessHours.end}:00hs
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={prevDays}
                        disabled={dateOffset === 0}
                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-20 transition-all"
                        aria-label="Días anteriores"
                    >
                        <ChevronLeft size={16} className="text-white" />
                    </button>
                    <button
                        onClick={nextDays}
                        disabled={dateOffset + DAYS_PER_PAGE >= days.length}
                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-20 transition-all"
                        aria-label="Días siguientes"
                    >
                        <ChevronRight size={16} className="text-white" />
                    </button>
                </div>
            </div>

            {/* Date selector */}
            <div className="flex gap-2" role="group" aria-label="Seleccionar fecha">
                {visibleDays.map((day, idx) => {
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const isWorkingDay = businessHours.days.includes(day.getDay());
                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(day)}
                            disabled={!isWorkingDay}
                            aria-label={day.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            aria-pressed={isSelected}
                            className={
                                "flex flex-col items-center flex-1 py-2 rounded-xl border transition-all " +
                                (isSelected
                                    ? 'border-transparent text-zinc-950 shadow-lg scale-105'
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20') +
                                (!isWorkingDay ? ' opacity-20 grayscale pointer-events-none' : '')
                            }
                            style={{ backgroundColor: isSelected ? primaryColor : undefined }}
                        >
                            <span className={"text-[8px] uppercase font-black tracking-wider " + (isSelected ? 'text-zinc-950/70' : 'text-zinc-600')}>
                                {day.toLocaleDateString('es-AR', { weekday: 'short' })}
                            </span>
                            <span className="text-xs font-bold">{day.getDate()}</span>
                            {isToday && (
                                <span className={"text-[7px] font-bold mt-0.5 " + (isSelected ? 'text-zinc-950/60' : '')} style={{ color: isSelected ? undefined : accentColor }}>
                                    HOY
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Time slots */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 py-1 font-bold uppercase tracking-[0.2em]">
                    <Clock size={12} style={{ color: primaryColor }} aria-hidden />
                    <span>Horarios disponibles</span>
                    {slots.length > 0 && (
                        <span className="ml-auto text-zinc-600">
                            {slots.filter(s => s.available).length} libres
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 gap-2" aria-busy="true" aria-label="Cargando horarios...">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 bg-white/5 border border-white/10 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                        <AlertCircle size={20} className="text-red-400 opacity-60" aria-hidden />
                        <p className="text-[10px] text-red-400/80 font-medium">{error}</p>
                        <button
                            onClick={() => setSelectedDate(new Date(selectedDate))}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar" role="listbox" aria-label="Horarios disponibles">
                        {slots.map((slot, idx) => (
                            <button
                                key={idx}
                                disabled={!slot.available}
                                onClick={() => handleBooking(slot.time)}
                                role="option"
                                aria-selected={false}
                                aria-disabled={!slot.available}
                                className={
                                    "py-2 px-3 rounded-xl text-xs font-bold border transition-all " +
                                    (slot.available
                                        ? 'bg-white/5 border-white/10 text-white hover:text-zinc-950 hover:border-transparent hover:scale-105'
                                        : 'bg-zinc-950/40 border-transparent text-zinc-700 cursor-not-allowed line-through')
                                }
                                onMouseEnter={(e) => {
                                    if (slot.available) (e.currentTarget as HTMLElement).style.backgroundColor = primaryColor;
                                }}
                                onMouseLeave={(e) => {
                                    if (slot.available) (e.currentTarget as HTMLElement).style.backgroundColor = '';
                                }}
                            >
                                {slot.time}hs
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <p className="text-[10px] text-zinc-500 font-medium">
                            {businessHours.days.includes(selectedDate.getDay())
                                ? 'Sin disponibilidad para este día.'
                                : 'Día no laborable. Seleccioná otro día.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
