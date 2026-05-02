// Modelo de Jornada de entrega
// Una jornada representa un evento de entrega de ayudas (CLAP, Gas, etc)
import mongoose, { Schema, Document } from 'mongoose';

export interface IJornada extends Document {
  tipo: 'CLAP' | 'Gas' | 'Proteína' | 'Medicamentos' | 'Otro'; // Tipo de jornada
  fechaJornada: Date; // Fecha del evento
  costo: number; // Costo asociado
  estado: 'activo' | 'cerrado'; // Estado de la jornada
  descripcion?: string; // Descripción opcional
}

// Esquema de jornada
const JornadaSchema = new Schema<IJornada>(
  {
    tipo: { type: String, enum: ['CLAP', 'Gas', 'Proteína', 'Medicamentos', 'Otro'], required: true }, // Tipo
    fechaJornada: { type: Date, required: true, index: true }, // Fecha
    costo: { type: Number, required: true, min: 0 }, // Costo
    estado: { type: String, enum: ['activo', 'cerrado'], default: 'activo' }, // Estado
    descripcion: { type: String, trim: true }, // Descripción
  },
  {
    timestamps: true,
    toJSON: {
      // Elimina __v al serializar
      transform: (_doc, ret) => { delete ret.__v; return ret; }
    }
  }
);

// Exporta el modelo Jornada
export default mongoose.models.Jornada || mongoose.model<IJornada>('Jornada', JornadaSchema);
