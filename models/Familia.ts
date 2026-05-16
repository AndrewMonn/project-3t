// Modelo de Familia beneficiaria
// Cada familia tiene un jefe de hogar, integrantes, dirección y sector
import mongoose, { Schema, Document, Types } from 'mongoose';
import './Sector';

export interface IFamilia extends Document {
  jefeDeHogar: { nombre: string; cedula: string; telefono: string }; // Datos del jefe de hogar
  integrantes: { nombre: string; edad: number; parentesco: string }[]; // Otros miembros
  direccion: { calle: string; nroCasa: string; referencia?: string }; // Dirección física
  sector: Types.ObjectId; // Referencia a Sector
  esVulnerable: boolean; // Si la familia es vulnerable
  condicionesEspeciales?: string; // Observaciones
}

// Esquema de familia
const FamiliaSchema = new Schema<IFamilia>(
  {
    jefeDeHogar: {
      nombre: { type: String, required: true, trim: true }, // Nombre jefe hogar
      cedula: { type: String, required: true, unique: true, trim: true, index: true }, // Cédula única
      telefono: { type: String, required: true, trim: true }, // Teléfono
    },
    integrantes: {
      type: [{ nombre: String, edad: Number, parentesco: String }], // Otros miembros
      default: [],
    },
    direccion: {
      calle: { type: String, required: true, trim: true },
      nroCasa: { type: String, required: true, trim: true },
      referencia: { type: String, trim: true },
    },
    sector: { type: Schema.Types.ObjectId, ref: 'Sector', required: true, index: true }, // Relación con sector
    esVulnerable: { type: Boolean, default: false },
    condicionesEspeciales: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => { delete (ret as any).__v; return ret; }
    }
  }
);

// Índice de texto para búsquedas por nombre o cédula
FamiliaSchema.index({ 'jefeDeHogar.nombre': 'text', 'jefeDeHogar.cedula': 'text' });

// Exporta el modelo Familia
export default mongoose.models.Familia || mongoose.model<IFamilia>('Familia', FamiliaSchema);
