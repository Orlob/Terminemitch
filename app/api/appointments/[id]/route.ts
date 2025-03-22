import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import Appointment from '@/models/Appointment';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    const id = params.id;
    const body = await request.json();

    console.log('Update Termin API:', { id, body });

    if (!body.title || !body.start || !body.serviceType || !body.duration) {
      return NextResponse.json(
        { error: "Pflichtfelder fehlen" },
        { status: 400 }
      );
    }

    // Berechne die Endzeit basierend auf der Startzeit und Dauer
    const startTime = new Date(body.start);
    const endTime = new Date(new Date(startTime).setMinutes(startTime.getMinutes() + body.duration));

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        title: body.title,
        start: startTime,
        end: endTime,
        phone: body.phone || "",
        serviceType: body.serviceType,
        notes: body.notes || "",
      },
      { new: true, runValidators: true }
    );

    if (!updatedAppointment) {
      return NextResponse.json(
        { error: "Termin nicht gefunden" },
        { status: 404 }
      );
    }

    console.log('Termin aktualisiert:', updatedAppointment);
    return NextResponse.json(updatedAppointment);
  } catch (error: any) {
    console.error("Fehler beim Aktualisieren des Termins:", error);
    return NextResponse.json(
      { error: error.message || "Interner Server-Fehler" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    const id = params.id;

    console.log('Lösche Termin:', id);

    const deletedAppointment = await Appointment.findByIdAndDelete(id);

    if (!deletedAppointment) {
      return NextResponse.json(
        { error: "Termin nicht gefunden" },
        { status: 404 }
      );
    }

    console.log('Termin gelöscht:', deletedAppointment);
    return NextResponse.json({ message: "Termin erfolgreich gelöscht" });
  } catch (error: any) {
    console.error("Fehler beim Löschen des Termins:", error);
    return NextResponse.json(
      { error: error.message || "Interner Server-Fehler" },
      { status: 500 }
    );
  }
} 