import { NextResponse, NextRequest } from "next/server";
import connectMongo from "@/libs/mongoose";
import Appointment from "@/models/Appointment";

export async function GET() {
  try {
    await connectMongo();

    const appointments = await Appointment.find({})
      .sort({ start: 1 }); // Sortiere nach Startzeit aufsteigend

    console.log('API - Gefundene Termine:', appointments);

    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error("Fehler beim Abrufen der Termine:", error);
    return NextResponse.json(
      { error: error.message || "Interner Server-Fehler" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectMongo();

    const body = await req.json();
    
    // Validiere die erforderlichen Felder
    if (!body.title || !body.start || !body.serviceType || !body.duration) {
      return NextResponse.json(
        { error: "Pflichtfelder fehlen" },
        { status: 400 }
      );
    }

    // Berechne die Endzeit basierend auf der Startzeit und Dauer
    const startTime = new Date(body.start);
    const endTime = new Date(new Date(startTime).setMinutes(startTime.getMinutes() + body.duration));

    // Erstelle den Termin
    const appointment = await Appointment.create({
      title: body.title,
      start: startTime,
      end: endTime,
      phone: body.phone || "",
      serviceType: body.serviceType,
      notes: body.notes,
      status: "pending",
    });

    console.log('API - Neuer Termin erstellt:', appointment);

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error("Fehler beim Erstellen des Termins:", error);
    return NextResponse.json(
      { error: error.message || "Interner Server-Fehler" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectMongo();

    const body = await req.json();
    
    if (!body.id || !body.title || !body.start || !body.serviceType || !body.duration) {
      return NextResponse.json(
        { error: "Pflichtfelder fehlen" },
        { status: 400 }
      );
    }

    const startTime = new Date(body.start);
    const endTime = new Date(new Date(startTime).setMinutes(startTime.getMinutes() + body.duration));

    const appointment = await Appointment.findByIdAndUpdate(
      body.id,
      {
        title: body.title,
        start: startTime,
        end: endTime,
        phone: body.phone || "",
        serviceType: body.serviceType,
        notes: body.notes,
      },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return NextResponse.json(
        { error: "Termin nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error("Fehler beim Aktualisieren des Termins:", error);
    return NextResponse.json(
      { error: error.message || "Interner Server-Fehler" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectMongo();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Termin-ID fehlt" },
        { status: 400 }
      );
    }

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return NextResponse.json(
        { error: "Termin nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Termin erfolgreich gelöscht" });
  } catch (error: any) {
    console.error("Fehler beim Löschen des Termins:", error);
    return NextResponse.json(
      { error: error.message || "Interner Server-Fehler" },
      { status: 500 }
    );
  }
} 