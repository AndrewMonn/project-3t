import mongoose from 'mongoose';
import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

async function main() {
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comuna_una_sola_fuerza';
await mongoose.connect(URI);

const { default: Familia } = await import('./models/Familia');

try {
  const q = 'V-12345678';
  const query = {
    $or: [
      { 'jefeDeHogar.cedula': { $regex: q, $options: 'i' } },
      { 'jefeDeHogar.nombre': { $regex: q, $options: 'i' } },
    ],
  };
  const familias = await Familia.find(query)
    .populate('sector', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  console.log('Familias encontradas:', familias.length);
  for (const f of familias) {
    console.log(`  ${f.jefeDeHogar.nombre} - Sector:`, (f as any).sector?.name || 'NO POPULATED');
  }
  console.log('TEST: PASSED');
} catch (err: any) {
  console.error('TEST: FAILED');
  console.error('ERROR:', err.message);
}

await mongoose.disconnect();
}

main();
