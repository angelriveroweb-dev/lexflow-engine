import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { config } from '../../../config';

interface TimeSlot {
    time: string;
    available: boolean;
}

interface CalendarBookingProps {
    onSelect: (datetime: string) => void;
    sessionId: string;
}

export const CalendarBooking: React.FC<CalendarBookingProps> = ({ onSelect, sessionId }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [dateOffset, setDateOffset] = useState(0);
    const DAYS_PER_PAGE = 4;

    // Business Hours Configuration (Mon-Fri 9:00 - 13:00)
    const businessHours = {
        start: 9,
        end: 13,
        days: [1, 2, 3, 4, 5] // Monday to Friday
    };

    // Generate days for the next 2 weeks (14 days)
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

    // Navigation functions
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

    // Fetch availability from n8n
    useEffect(() => {
        const fetchAvailability = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(config.chatbot.n8nWebhook || config.chatbot.webhookUrl, {
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
                console.error("Error fetching availability:", error);
                setSlots([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAvailability();
    }, [selectedDate, sessionId]);

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
                <h3 className="text-white font-medium">¡Cita Solicitada!</h3>
                <p className="text-xs text-zinc-400">El abogado confirmará tu cita en breve.</p>
            </motion.div>
        );
    }

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-3 my-4 space-y-4 shadow-2xl backdrop-blur-sm overflow-hidden w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#C6A87C]/10 rounded-lg">
                        <Calendar size={14} className="text-[#C6A87C]" />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold text-white">Agendar Consulta</h3>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-tighter font-bold">Notion Calendar</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={prevDays}
                        disabled={dateOffset === 0}
                        className={`p-1 hover:bg-white/5 rounded transition-colors ${dateOffset === 0 ? 'text-zinc-800' : 'text-zinc-500'}`}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={nextDays}
                        disabled={dateOffset + DAYS_PER_PAGE >= days.length}
                        className={`p-1 hover:bg-white/5 rounded transition-colors ${dateOffset + DAYS_PER_PAGE >= days.length ? 'text-zinc-800' : 'text-zinc-500'}`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Day Selector (Paginated) */}
            <div className="flex gap-1.5">
                {visibleDays.map((day, idx) => {
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isWeekend = ![1, 2, 3, 4, 5].includes(day.getDay());

                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(day)}
                            className={`flex flex-col items-center flex-1 py-1.5 rounded-xl border transition-all ${isSelected
                                ? 'bg-[#C6A87C] border-[#C6A87C] text-black font-bold'
                                : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/20'
                                } ${isWeekend ? 'opacity-30 grayscale pointer-events-none' : ''}`}
                        >
                            <span className="text-[7.5px] uppercase font-black opacity-60 tracking-wider">
                                {day.toLocaleDateString('es-AR', { weekday: 'short' })}
                            </span>
                            <span className="text-xs font-bold">{day.getDate()}</span>
                            {isToday && !isSelected && <div className="w-1 h-1 bg-[#C6A87C] rounded-full mt-0.5"></div>}
                        </button>
                    );
                })}
            </div>

            {/* Time Slots */}
            <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 py-1 font-bold">
                    <Clock size={10} />
                    <span className="uppercase tracking-widest">Disponibilidad en {selectedDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 gap-2 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-9 bg-white/5 rounded-lg"></div>
                        ))}
                    </div>
                ) : slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                        {slots.map((slot, idx) => (
                            <button
                                key={idx}
                                disabled={!slot.available}
                                onClick={() => handleBooking(slot.time)}
                                className={`py-1.5 px-3 rounded-lg text-[11px] font-bold border transition-all ${slot.available
                                    ? 'bg-zinc-950 border-white/5 text-zinc-300 hover:border-[#C6A87C]/50 hover:bg-[#C6A87C]/10'
                                    : 'bg-zinc-950/30 border-transparent text-zinc-700 cursor-not-allowed line-through'
                                    }`}
                            >
                                {slot.time}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 border border-dashed border-white/5 rounded-xl bg-zinc-950/30">
                        <p className="text-[10px] text-zinc-500">No hay horarios disponibles.</p>
                        <p className="text-[9px] text-zinc-700 mt-0.5">Horario: Lu-Vi 9 a 13hs.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-zinc-950/30 border border-white/5 rounded-xl flex items-center justify-between">
                <div className="flex -space-x-1.5">
                    {[1, 2].map(i => (
                        <div key={i} className="w-4 h-4 rounded-full border border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="Doc" />
                        </div>
                    ))}
                </div>
                <p className="text-[9px] text-zinc-600 font-medium">Asignado a Dr. Escobar</p>
            </div>
        </div>
    );
};
