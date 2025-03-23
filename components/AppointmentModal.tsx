import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from '@headlessui/react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  startTime: Date;
  onSave: (appointmentData: {
    title: string;
    phone: string;
    serviceType: string;
    duration: number;
    notes?: string;
  }) => void;
  onDelete?: () => void;
  appointment?: {
    id: string;
    title: string;
    phone?: string;
    serviceType: string;
    notes?: string;
    start: Date;
    end: Date;
  };
}

export default function AppointmentModal({ 
  isOpen, 
  onClose, 
  startTime, 
  onSave,
  onDelete,
  appointment 
}: AppointmentModalProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(appointment?.title || '');
  const [phone, setPhone] = useState(appointment?.phone || '');
  const [serviceType, setServiceType] = useState(appointment?.serviceType || 'haircut');
  const [duration, setDuration] = useState(45);
  const [notes, setNotes] = useState(appointment?.notes || '');

  // Setze die Dauer basierend auf dem bestehenden Termin
  useEffect(() => {
    if (appointment) {
      const durationInMinutes = (appointment.end.getTime() - appointment.start.getTime()) / (1000 * 60);
      setDuration(durationInMinutes);
    }
  }, [appointment]);

  // Setze die Formularwerte zurück, wenn sich der Termin ändert
  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title);
      setPhone(appointment.phone || '');
      setServiceType(appointment.serviceType);
      setNotes(appointment.notes || '');
    } else {
      setTitle('');
      setPhone('');
      setServiceType('haircut');
      setNotes('');
    }
  }, [appointment]);

  // Automatischer Fokus auf das Namensfeld
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      phone,
      serviceType,
      duration,
      notes,
    });
  };

  const serviceTypes = [
    { id: 'haircut', label: 'Schnitt ✂️' },
    { id: 'coloring', label: 'Färben 🎨' },
    { id: 'styling', label: 'Styling 💇‍♀️' },
    { id: 'other', label: 'Waschi 💦' },
  ];

  const durations = [
    { minutes: 15, label: '15 Min' },
    { minutes: 30, label: '30 Min' },
    { minutes: 45, label: '45 Min' },
    { minutes: 60, label: '1 Std' },
    { minutes: 90, label: '1,5 Std' },
    { minutes: 120, label: '2 Std' },
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Hintergrund-Overlay */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal-Position */}
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl my-4 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-2xl font-bold mb-4">
            {appointment ? 'Termin bearbeiten ✏️' : 'Neuer Termin 📅'} {startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name/Titel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name 👤
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Name des Kunden"
                required
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon 📱 (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Telefonnummer (optional)"
              />
            </div>

            {/* Service-Typ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service 💈
              </label>
              <div className="grid grid-cols-2 gap-2">
                {serviceTypes.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setServiceType(service.id)}
                    className={`py-3 px-4 rounded-full text-lg font-medium transition-colors
                      ${serviceType === service.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {service.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dauer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dauer ⏱️
              </label>
              <div className="grid grid-cols-3 gap-2">
                {durations.map((d) => (
                  <button
                    key={d.minutes}
                    type="button"
                    onClick={() => setDuration(d.minutes)}
                    className={`py-3 px-2 rounded-full text-lg font-medium transition-colors
                      ${duration === d.minutes
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notizen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notizen 📝
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Zusätzliche Informationen..."
              />
            </div>

            {/* Aktions-Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              {appointment && onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm('Möchten Sie diesen Termin wirklich löschen?')) {
                      onDelete();
                    }
                  }}
                  className="w-full py-4 rounded-lg text-lg font-medium bg-red-500 text-white hover:bg-red-600 active:bg-red-700"
                >
                  Termin löschen 🗑️
                </button>
              )}
              <button
                type="submit"
                className="w-full py-4 rounded-lg text-lg font-medium bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
              >
                {appointment ? 'Aktualisieren 💫' : 'Speichern ✅'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 rounded-lg text-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              >
                Abbrechen ❌
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 