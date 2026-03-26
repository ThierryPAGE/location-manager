/**
 * Script d'import des données Base44 CSV → Supabase
 *
 * Usage :
 *   SUPABASE_SERVICE_ROLE_KEY=xxx SUPABASE_USER_ID=yyy node scripts/import-csv.mjs
 *
 * Variables d'environnement requises :
 *   SUPABASE_SERVICE_ROLE_KEY  → Supabase Dashboard > Settings > API > service_role
 *   SUPABASE_USER_ID           → Supabase Dashboard > Authentication > Users > copier l'UUID de votre compte
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://jtuyvbpnkmjdzvameglz.supabase.co';
const SERVICE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID          = process.env.SUPABASE_USER_ID;
const BDD_PATH         = new URL('../BDD/', import.meta.url).pathname;

if (!SERVICE_KEY) { console.error('❌  SUPABASE_SERVICE_ROLE_KEY manquante'); process.exit(1); }
if (!USER_ID)     { console.error('❌  SUPABASE_USER_ID manquant'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── CSV Parser (gère les champs multilignes entre guillemets) ─────────────────
function parseCSV(content) {
  const rows = [];
  let headers = null;
  let fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current); current = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      fields.push(current); current = '';
      if (!headers) {
        headers = fields;
      } else if (fields.some(f => f !== '')) {
        const row = {};
        headers.forEach((h, idx) => { row[h.trim()] = (fields[idx] ?? '').trim(); });
        rows.push(row);
      }
      fields = [];
    } else {
      current += ch;
    }
  }
  // Dernière ligne sans \n
  if (current !== '' || fields.length) {
    fields.push(current);
    if (headers && fields.some(f => f !== '')) {
      const row = {};
      headers.forEach((h, idx) => { row[h.trim()] = (fields[idx] ?? '').trim(); });
      rows.push(row);
    }
  }
  return rows;
}

function readCSV(filename) {
  const content = readFileSync(`${BDD_PATH}${filename}`, 'utf-8');
  return parseCSV(content).filter(r => r.is_sample !== 'true');
}

// ── Helpers de conversion ─────────────────────────────────────────────────────
const toBool  = v => v === 'true';
const toNum   = v => v === '' || v == null ? null : Number(v);
const toDate  = v => v === '' ? null : v.slice(0, 10);         // "YYYY-MM-DD"
const toJson  = v => { try { return JSON.parse(v); } catch { return []; } };

// ── Import ────────────────────────────────────────────────────────────────────
async function insertBatch(table, rows) {
  if (!rows.length) { console.log(`  ⚠  Aucune donnée pour ${table}`); return; }
  const { error } = await supabase.from(table).insert(rows);
  if (error) { console.error(`  ❌  ${table}:`, error.message); throw error; }
  console.log(`  ✅  ${table} : ${rows.length} ligne(s) insérée(s)`);
}

async function main() {
  console.log('\n🚀  Début de l\'import CSV → Supabase\n');

  // Mapping : anciens IDs Base44 (24 hex) → nouveaux UUIDs
  const idMap = {};
  const newId = (oldId) => {
    if (!idMap[oldId]) idMap[oldId] = randomUUID();
    return idMap[oldId];
  };

  // ── 1. Properties ──────────────────────────────────────────────────────────
  console.log('📦  Properties...');
  const properties = readCSV('Property_export.csv').map(r => ({
    id:                     newId(r.id),
    user_id:                USER_ID,
    name:                   r.name,
    address:                r.address,
    description:            r.description,
    capacity:               toNum(r.capacity),
    bedrooms:               toNum(r.bedrooms),
    base_price_per_night:   toNum(r.base_price_per_night),
    cleaning_fee:           toNum(r.cleaning_fee),
    tourist_tax_per_person: toNum(r.tourist_tax_per_person),
    deposit_amount:         toNum(r.deposit_amount),
    is_active:              toBool(r.is_active),
    created_at:             r.created_date || new Date().toISOString(),
  }));
  await insertBatch('properties', properties);

  // ── 2. Options ─────────────────────────────────────────────────────────────
  console.log('📦  Options...');
  const options = readCSV('Option_export.csv').map(r => ({
    id:          newId(r.id),
    user_id:     USER_ID,
    name:        r.name,
    description: r.description,
    price:       toNum(r.price),
    price_type:  r.price_type || 'fixed',
    is_active:   toBool(r.is_active),
    created_at:  r.created_date || new Date().toISOString(),
  }));
  await insertBatch('options', options);

  // ── 3. Contract Templates ──────────────────────────────────────────────────
  console.log('📦  ContractTemplates...');
  const templates = readCSV('ContractTemplate_export.csv').map(r => ({
    id:         newId(r.id),
    user_id:    USER_ID,
    name:       r.name,
    content:    r.content,
    is_default: toBool(r.is_default),
    created_at: r.created_date || new Date().toISOString(),
  }));
  await insertBatch('contract_templates', templates);

  // ── 4. Personal Bookings ───────────────────────────────────────────────────
  console.log('📦  PersonalBookings...');
  const personalBookings = readCSV('PersonalBooking_export.csv').map(r => ({
    id:          newId(r.id),
    user_id:     USER_ID,
    property_id: r.property_id ? idMap[r.property_id] ?? null : null,
    check_in:    toDate(r.check_in),
    check_out:   toDate(r.check_out),
    notes:       r.notes,
    created_at:  r.created_date || new Date().toISOString(),
  }));
  await insertBatch('personal_bookings', personalBookings);

  // ── 5. Bookings ────────────────────────────────────────────────────────────
  console.log('📦  Bookings...');
  const bookings = readCSV('Booking_export.csv').map(r => {
    // selected_options : remapper les option_id
    let selectedOptions = toJson(r.selected_options);
    if (Array.isArray(selectedOptions)) {
      selectedOptions = selectedOptions.map(opt => ({
        ...opt,
        option_id: opt.option_id ? (idMap[opt.option_id] ?? opt.option_id) : null,
      }));
    }

    return {
      id:                     newId(r.id),
      user_id:                USER_ID,
      property_id:            r.property_id ? (idMap[r.property_id] ?? null) : null,
      guest_first_name:       r.guest_first_name,
      guest_last_name:        r.guest_last_name,
      guest_email:            r.guest_email,
      guest_phone:            r.guest_phone,
      guest_address:          r.guest_address,
      num_guests:             toNum(r.num_guests),
      check_in:               toDate(r.check_in),
      check_out:              toDate(r.check_out),
      source:                 r.source || 'direct',
      source_other:           r.source_other,
      status:                 r.status || 'request',
      num_nights:             toNum(r.num_nights),
      price_per_night:        toNum(r.price_per_night),
      subtotal_nights:        toNum(r.subtotal_nights),
      cleaning_fee:           toNum(r.cleaning_fee),
      tourist_tax_total:      toNum(r.tourist_tax_total),
      options_total:          toNum(r.options_total),
      total_amount:           toNum(r.total_amount),
      deposit_amount:         toNum(r.deposit_amount),
      deposit_paid:           toNum(r.deposit_paid),
      balance_paid:           toNum(r.balance_paid),
      concierge_fee:          toNum(r.concierge_fee),
      host_service_fee:       toNum(r.host_service_fee),
      quote_date:             toDate(r.quote_date),
      contract_date:          toDate(r.contract_date),
      quote_sent_by_email:    toBool(r.quote_sent_by_email),
      contract_sent_by_email: toBool(r.contract_sent_by_email),
      payment_reminder_sent:  toBool(r.payment_reminder_sent),
      arrival_reminder_sent:  toBool(r.arrival_reminder_sent),
      contract_signed:        toBool(r.contract_signed),
      contract_signed_date:   r.contract_signed_date || null,
      selected_options:       selectedOptions,
      notes:                  r.notes,
      created_at:             r.created_date || new Date().toISOString(),
    };
  });
  await insertBatch('bookings', bookings);

  console.log('\n✅  Import terminé avec succès !\n');
  console.log('Correspondance des IDs (ancien Base44 → nouveau UUID) :');
  Object.entries(idMap).forEach(([old, newId]) => console.log(`  ${old} → ${newId}`));
}

main().catch(err => { console.error('\n❌  Erreur fatale:', err); process.exit(1); });
