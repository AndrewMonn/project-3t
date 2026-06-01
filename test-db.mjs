// Script de verificación de conexión a MongoDB
// Uso: node --env-file .env test-db.mjs
// Valida: .env loading, formato URI, conexión en vivo, ping, colecciones

import mongoose from 'mongoose';
import dns from 'node:dns';
import { URL } from 'url';

dns.setServers(['1.1.1.1', '8.8.8.8']);
dns.setDefaultResultOrder('ipv4first');

let passed = 0;
let failed = 0;

function assert(label, ok, detail) {
  if (ok) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label} — ${detail}`); }
}

console.log('=== TEST: Conexion a MongoDB ===\n');

// 1 — .env loading
console.log('[1] Configuracion .env');
const uri = process.env.MONGODB_URI;
assert('MONGODB_URI definida', !!uri, 'Variable ausente');
if (!uri) { process.exit(1); }

// 2 — URI format
console.log('\n[2] Formato URI');
try {
  const parsed = new URL(uri);
  assert('Protocolo mongodb+srv', parsed.protocol === 'mongodb+srv:', 'Protocolo: ' + parsed.protocol);
  assert('Host presente', !!parsed.hostname, 'Host vacio');
  assert('DB name presente', !!parsed.pathname?.replace('/', ''), 'Sin nombre de BD');
  assert('User presente', !!parsed.username, 'Sin usuario');
  assert('Password presente', !!parsed.password, 'Sin password');
} catch (e) {
  assert('URI valida', false, e.message);
  process.exit(1);
}

// 3 — Live connection
console.log('\n[3] Conexion en vivo');
try {
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  assert('mongoose.connect() OK', true, '');

  const db = conn.connection.db;
  const ping = await db.admin().command({ ping: 1 });
  assert('Ping a BD', ping.ok === 1, 'Respuesta: ' + JSON.stringify(ping));

  const collections = await db.listCollections().toArray();
  console.log(`  INFO: ${collections.length} colecciones encontradas`);
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`    ${c.name}: ${count} docs`);
  }

  await mongoose.disconnect();
  assert('Desconexion clean', true, '');
} catch (e) {
  const msg = e.message;
  if (msg.includes('querySrv') || msg.includes('ENOTFOUND')) {
    assert('Conexion a BD', false, 'DNS/red — cluster no alcanzable: ' + msg.split('\n')[0]);
  } else if (msg.includes('Authentication') || msg.includes('auth')) {
    assert('Conexion a BD', false, 'Auth fallida — credenciales incorrectas');
  } else if (msg.includes('timed out') || msg.includes('timeout')) {
    assert('Conexion a BD', false, 'Timeout — servidor no responde');
  } else {
    assert('Conexion a BD', false, msg.split('\n')[0]);
  }
}

// Summary
console.log(`\n=== RESULTADO: ${failed > 0 ? 'FALLARON ' + failed : 'PASARON ' + passed} ===`);
process.exit(failed > 0 ? 1 : 0);
