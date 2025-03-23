'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Event, View, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AppointmentModal from '@/components/AppointmentModal';
import { toast } from 'react-hot-toast';

// Deutsch als Standardsprache setzen
moment.locale('de');

// Konfiguriere moment für die lokale Zeitzone
const localizer = momentLocalizer(moment);

// Stelle sicher, dass moment die Zeiten in der lokalen Zeitzone interpretiert
moment.parseZone();

interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  phone?: string;
  serviceType?: string;
  notes?: string;
}

interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  startTime: Date;
  event?: CalendarEvent;
}

export default function KalenderPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>('day');
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
    startTime: new Date(),
  });

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointments');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Termine');
      }
      const appointments = await response.json();
      
      const calendarEvents = appointments.map((apt: any) => {
        if (!apt.id) {
          throw new Error('Appointment hat keine ID');
        }
        
        // Zeitzone für die Anzeige berücksichtigen
        const startDate = new Date(apt.start);
        const endDate = new Date(apt.end);
        
        const event: CalendarEvent = {
          id: apt.id,
          title: `${apt.title} ${apt.phone ? '📱 ' + apt.phone : ''}`,
          start: startDate,
          end: endDate,
          phone: apt.phone,
          serviceType: apt.serviceType,
          notes: apt.notes,
        };
        return event;
      });

      setEvents(calendarEvents);
    } catch (error) {
      toast.error('Fehler beim Laden der Termine');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleNavigate = (newDate: Date) => {
    let targetDate = new Date(newDate);
    const day = targetDate.getDay();

    // Wenn es Sonntag (0) oder Montag (1) ist, zum nächsten Dienstag springen
    if (day === 0) {
      targetDate.setDate(targetDate.getDate() + 2); // Von Sonntag zu Dienstag
    } else if (day === 1) {
      targetDate.setDate(targetDate.getDate() + 1); // Von Montag zu Dienstag
    }

    setDate(targetDate);
  };

  // Funktion zum Überprüfen und Anpassen des Datums für die Navigation
  const getValidDate = (date: Date, direction: 'next' | 'prev'): Date => {
    const newDate = new Date(date);
    const day = newDate.getDay();

    if (direction === 'next') {
      if (day === 0) return new Date(newDate.setDate(newDate.getDate() + 2));
      if (day === 1) return new Date(newDate.setDate(newDate.getDate() + 1));
    } else {
      if (day === 1) return new Date(newDate.setDate(newDate.getDate() - 2));
      if (day === 0) return new Date(newDate.setDate(newDate.getDate() - 1));
    }

    return newDate;
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (modal.mode === 'edit' || modal.isOpen) return;

    const clickedEvent = events.find(event => 
      new Date(event.start).getTime() === new Date(slotInfo.start).getTime() &&
      new Date(event.end).getTime() === new Date(slotInfo.end).getTime()
    );

    if (clickedEvent) return;

    setModal({
      isOpen: true,
      mode: 'create',
      startTime: new Date(slotInfo.start),
    });
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (modal.isOpen) return;

    setModal({
      isOpen: true,
      mode: 'edit',
      startTime: new Date(event.start),
      event: event,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
      startTime: new Date(),
      event: undefined,
    });
  };

  const handleSaveAppointment = async (appointmentData: {
    title: string;
    phone: string;
    serviceType: string;
    duration: number;
    notes?: string;
  }) => {
    try {
      // Erstelle Start- und Endzeit
      const start = new Date(modal.startTime);
      const end = new Date(modal.startTime);
      end.setMinutes(end.getMinutes() + appointmentData.duration);

      if (modal.mode === 'edit' && modal.event?.id) {
        const response = await fetch(`/api/appointments/${modal.event.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...appointmentData,
            start: start.toISOString(),
            end: end.toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Fehler beim Aktualisieren des Termins');
        }

        await response.json();
        toast.success('Termin erfolgreich aktualisiert! 🎉');
      } else {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...appointmentData,
            start: start.toISOString(),
            end: end.toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Fehler beim Speichern des Termins');
        }

        await response.json();
        toast.success('Termin erfolgreich gespeichert! 🎉');
      }

      await fetchAppointments();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Speichern des Termins');
    }
  };

  const handleDeleteAppointment = async () => {
    if (!modal.event?.id) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${modal.event.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Löschen des Termins');
      }

      toast.success('Termin erfolgreich gelöscht! 🗑️');
      await fetchAppointments();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Löschen des Termins');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Terminkalender
            </h1>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleNavigate(new Date())}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Heute
              </button>
              <button 
                onClick={() => setView('month')}
                className={`px-3 py-1.5 border rounded-md text-sm font-medium ${
                  view === 'month' 
                    ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Monat
              </button>
              <button 
                onClick={() => setView('week')}
                className={`px-3 py-1.5 border rounded-md text-sm font-medium ${
                  view === 'week' 
                    ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Woche
              </button>
              <button 
                onClick={() => setView('day')}
                className={`px-3 py-1.5 border rounded-md text-sm font-medium ${
                  view === 'day' 
                    ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Tag
              </button>
              <button 
                onClick={() => setView('agenda')}
                className={`px-3 py-1.5 border rounded-md text-sm font-medium ${
                  view === 'agenda' 
                    ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Agenda
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="h-[calc(100vh-4.5rem)] p-1 sm:p-2">
        <div className="h-full bg-white rounded-lg shadow-sm">
          <Calendar<CalendarEvent>
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            defaultView="day"
            view={view}
            onView={setView}
            date={date}
            onNavigate={handleNavigate}
            min={new Date(new Date().setHours(8, 0, 0, 0))}
            max={new Date(new Date().setHours(18, 0, 0, 0))}
            step={15}
            timeslots={4}
            selectable={true}
            longPressThreshold={3}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            dayPropGetter={(date) => {
              const day = date.getDay();
              // Sonntag (0) und Montag (1) ausblenden
              if (day === 0 || day === 1) {
                return {
                  className: 'hidden',
                  style: {
                    display: 'none',
                  }
                };
              }
              return {};
            }}
            eventPropGetter={(event) => ({
              className: 'cursor-pointer bg-blue-500 hover:bg-blue-600 transition-colors'
            })}
            components={{
              event: ({ event }) => (
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectEvent(event);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectEvent(event);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="w-full h-full p-1 select-none text-white text-sm"
                >
                  {event.title}
                </div>
              ),
              toolbar: (toolbar) => (
                <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200">
                  <div className="flex-1"></div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        let prevDate = new Date(date);
                        
                        if (view === 'day') {
                          prevDate.setDate(prevDate.getDate() - 1);
                          prevDate = getValidDate(prevDate, 'prev');
                        } else if (view === 'week') {
                          prevDate.setDate(prevDate.getDate() - 7);
                          // Stelle sicher, dass die Woche mit Dienstag beginnt
                          while (prevDate.getDay() !== 2) {
                            prevDate.setDate(prevDate.getDate() + 1);
                          }
                        } else if (view === 'month') {
                          prevDate.setMonth(prevDate.getMonth() - 1);
                          // Stelle sicher, dass der erste sichtbare Tag ein Dienstag ist
                          while (prevDate.getDay() !== 2) {
                            prevDate.setDate(prevDate.getDate() + 1);
                          }
                        }
                        
                        handleNavigate(prevDate);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-600 text-lg"
                    >
                      ←
                    </button>
                    <span className="text-base font-medium min-w-[200px] text-center">
                      {toolbar.label}
                    </span>
                    <button
                      onClick={() => {
                        let nextDate = new Date(date);
                        
                        if (view === 'day') {
                          nextDate.setDate(nextDate.getDate() + 1);
                          nextDate = getValidDate(nextDate, 'next');
                        } else if (view === 'week') {
                          nextDate.setDate(nextDate.getDate() + 7);
                          // Stelle sicher, dass die Woche mit Dienstag beginnt
                          while (nextDate.getDay() !== 2) {
                            nextDate.setDate(nextDate.getDate() + 1);
                          }
                        } else if (view === 'month') {
                          nextDate.setMonth(nextDate.getMonth() + 1);
                          // Stelle sicher, dass der erste sichtbare Tag ein Dienstag ist
                          while (nextDate.getDay() !== 2) {
                            nextDate.setDate(nextDate.getDate() + 1);
                          }
                        }
                        
                        handleNavigate(nextDate);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-600 text-lg"
                    >
                      →
                    </button>
                  </div>
                  <div className="flex-1"></div>
                </div>
              ),
            }}
            messages={{
              next: "Weiter",
              previous: "Zurück",
              today: "Heute",
              month: "Monat",
              week: "Woche",
              day: "Tag",
              agenda: "Agenda",
              date: "Datum",
              time: "Uhrzeit",
              event: "Termin",
              noEventsInRange: "Keine Termine in diesem Zeitraum",
              allDay: "Ganztägig",
              work_week: "Arbeitswoche"
            }}
            formats={{
              monthHeaderFormat: 'MMMM YYYY',
              dayHeaderFormat: 'dddd, DD. MMMM',
              dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                `${moment(start).format('DD. MMMM')} - ${moment(end).format('DD. MMMM YYYY')}`,
              timeGutterFormat: (date: Date) => {
                return date.getMinutes() === 0 ? moment(date).format('HH:mm') : '';
              },
            }}
            views={{
              month: true,
              week: true,
              day: true,
              agenda: true,
            }}
          />
        </div>
      </div>

      <AppointmentModal
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        startTime={modal.startTime}
        onSave={handleSaveAppointment}
        onDelete={modal.mode === 'edit' ? handleDeleteAppointment : undefined}
        appointment={modal.mode === 'edit' && modal.event ? {
          id: modal.event.id || '',
          title: modal.event.title.replace(/📱.*$/, '').trim(),
          phone: modal.event.phone || '',
          serviceType: modal.event.serviceType || 'haircut',
          notes: modal.event.notes || '',
          start: modal.event.start,
          end: modal.event.end,
        } : undefined}
      />
    </div>
  );
} 