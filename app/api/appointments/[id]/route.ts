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

    return NextResponse.json(updatedAppointment);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();

    const appointment = await Appointment.findById(params.id);

    if (!appointment) {
      return NextResponse.json(
        { error: "Termin nicht gefunden" },
        { status: 404 }
      );
    }

    await appointment.deleteOne();

    return NextResponse.json({ message: "Termin erfolgreich gelöscht" });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 