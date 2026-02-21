import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';

interface TimeSlot {
    time: string;
    available: boolean;
}

interface CalendarBookingProps {
    onSelect: (datetime: string) => void;
    sessionId: string;
    webhookUrl: string;
    primaryColor: string;
}

export const CalendarBooking: React.FC<CalendarBookingProps> = ({ onSelect, sessionId, webhookUrl, primaryColor }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [dateOffset, setDateOffset] = useState(0);
    const DAYS_PER_PAGE = 4;

    const businessHours = {
        start: 9,
        end: 13,
        days: [1, 2, 3, 4, 5]
    };

    const generateDays = () => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date();
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

                const data = await response.json();
                const generatedSlots: TimeSlot[] = [];
                const dayOfWeek = selectedDate.getDay();
                const isWorkingDay = businessHours.days.includes(dayOfWeek);

                if (isWorkingDay) {
                    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
                        ['00', '30'].forEach(min => {
                            const timeStr = `${hour.toString().padStart(2, '0')}:${min}`;
                            const isBusy = data.busySlots?.includes(timeStr);
                            generatedSlots.push({
                                time: timeStr,
                                available: !isBusy
                            });
                        });
                    }
                }
                setSlots(generatedSlots);
            } catch (error) {
                console.error("LexFlow: Error fetching availability:", error);
                setSlots([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAvailability();
    }, [selectedDate, sessionId, webhookUrl]);

    const handleBooking = (time: string) => {
        const [hour, min] = time.split(':');
        const bookingDate = new Date(selectedDate);
        bookingDate.setHours(parseInt(hour), parseInt(min), 0, 0);

        onSelect(`Agendar para el ${bookingDate.toLocaleDateString('es-AR')} a las ${time}hs`);
        setIsConfirmed(true);
    };

    if (isConfirmed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center space-y-3 my-4"
            >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                    <CheckCircle2 className="text-black" size={24} />
                </div>
                <h3 className="text-zinc-900 font-medium">¡Cita Solicitada!</h3>
                <p className="text-xs text-zinc-500">El asesor confirmará tu cita en breve.</p>
            </motion.div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-3 my-4 space-y-4 shadow-sm overflow-hidden w-full">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                        <Calendar size={14} style={{ color: primaryColor }} />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold text-gray-900">Agendar Consulta</h3>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={prevDays} disabled={dateOffset === 0} className="p-1 hover:bg-gray-50 rounded disabled:opacity-30">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={nextDays} disabled={dateOffset + DAYS_PER_PAGE >= days.length} className="p-1 hover:bg-gray-50 rounded disabled:opacity-30">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="flex gap-1.5">
                {visibleDays.map((day, idx) => {
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const isWeekend = ![1, 2, 3, 4, 5].includes(day.getDay());

                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(day)}
                            className={`flex flex-col items-center flex-1 py-1.5 rounded-xl border transition-all ${isSelected
                                ? 'text-white border-transparent'
                                : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300'
                                } ${isWeekend ? 'opacity-30 grayscale pointer-events-none' : ''}`}
                            style={{ backgroundColor: isSelected ? primaryColor : undefined }}
                        >
                            <span className="text-[7.5px] uppercase font-black opacity-60 tracking-wider">
                                {day.toLocaleDateString('es-AR', { weekday: 'short' })}
                            </span>
                            <span className="text-xs font-bold">{day.getDate()}</span>
                        </button>
                    );
                })}
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] text-gray-500 py-1 font-bold">
                    <Clock size={10} />
                    <span className="uppercase tracking-widest">Disponibilidad</span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 gap-2 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-9 bg-gray-100 rounded-lg"></div>
                        ))}
                    </div>
                ) : slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                        {slots.map((slot, idx) => (
                            <button
                                key={idx}
                                disabled={!slot.available}
                                onClick={() => handleBooking(slot.time)}
                                className={`py-1.5 px-3 rounded-lg text-[11px] font-bold border transition-all ${slot.available
                                    ? 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                                    : 'bg-gray-50 border-transparent text-gray-300 cursor-not-allowed line-through'
                                    }`}
                            >
                                {slot.time}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                        <p className="text-[10px] text-gray-500">No hay horarios disponibles.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
