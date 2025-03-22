import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const appointmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      required: false,
    },
    serviceType: {
      type: String,
      required: true,
      enum: ["haircut", "coloring", "styling", "other"],
    },
    notes: {
      type: String,
      trim: true,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    }
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
  }
);

// Validierung: Ende muss nach Start sein
appointmentSchema.pre("save", function(next) {
  if (this.end <= this.start) {
    next(new Error("Endzeit muss nach Startzeit liegen"));
  }
  next();
});

// Validierung: Termin muss in Öffnungszeiten liegen (8-18 Uhr)
appointmentSchema.pre("save", function(next) {
  const startHour = this.start.getHours();
  const endHour = this.end.getHours();
  
  if (startHour < 8 || endHour > 18) {
    next(new Error("Termine müssen zwischen 8:00 und 18:00 Uhr liegen"));
  }
  next();
});

export default mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema); 