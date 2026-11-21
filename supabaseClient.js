/**
 * Supabase Database Client & Data Access Layer
 * The 1st Step Method
 * 
 * Provides database connection, reservation insertions, and query methods.
 * Stores: first_name, last_name, age, cellphone_number (WhatsApp), and reservation details.
 */

let createClient;
try {
  ({ createClient } = require('@supabase/supabase-js'));
} catch (e) {
  // Graceful fallback if @supabase/supabase-js is not installed yet
  createClient = null;
}

require('dotenv').config();

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://eppwuacyvdweiflqfcjp.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_OWMZwjdEEFh-f8rmb1EUMQ_GwnOHIhV';

let supabase = null;

if (createClient && SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
} else if (!createClient) {
  console.warn(
    '[Supabase] Notice: @supabase/supabase-js is not installed yet. ' +
    'Run `npm install @supabase/supabase-js` when ready.'
  );
} else {
  console.warn(
    '[Supabase] Notice: SUPABASE_URL or SUPABASE_KEY is missing in your environment. ' +
    'Please set them in your .env file to enable Supabase persistence.'
  );
}

/**
 * Insert or register a new student reservation into Supabase.
 * 
 * @param {Object} data
 * @param {string} data.firstName - Student's first name
 * @param {string} data.lastName - Student's last name
 * @param {number|string} data.age - Student's age (numeric)
 * @param {string} data.cellphoneNumber - WhatsApp / Cellphone number (required)
 * @param {string} [data.email] - Student's email
 * @param {string} [data.cohort] - e.g. 'Cohort 01'
 * @param {string} data.row - e.g. 'A', 'B', 'C'
 * @param {number} data.seat - e.g. 1 through 18
 * @param {number} [data.price] - e.g. 499 or 0
 * @param {string} [data.paymentStatus] - 'confirmed', 'free_claim', or 'pending'
 * @param {string} [data.paymentReference] - Paystack reference
 * @param {Object} [data.metadata] - Optional additional info
 */
async function createReservation(data) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Ensure @supabase/supabase-js is installed and credentials exist in .env.');
  }

  const {
    firstName,
    lastName,
    age = 21,
    cellphoneNumber,
    email,
    cohort = 'Cohort 01',
    row,
    seat,
    price = 0,
    paymentStatus = 'confirmed',
    paymentReference = null,
    metadata = {},
  } = data;

  if (!firstName || !lastName) {
    throw new Error('First name and last name are required.');
  }
  const studentAge = (age !== undefined && age !== null && !isNaN(Number(age))) ? parseInt(age, 10) : 21;
  if (studentAge < 18) {
    throw new Error('A valid age is required. Anyone under the age of 18 is not allowed.');
  }
  if (!cellphoneNumber) {
    throw new Error('WhatsApp / cellphone number is required.');
  }
  if (!row || !seat) {
    throw new Error('Row and seat number are required to reserve a slot.');
  }

  const payload = {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    age: studentAge,
    cellphone_number: cellphoneNumber.trim(),
    email: email ? email.trim().toLowerCase() : null,
    cohort,
    row: row.toUpperCase(),
    seat: parseInt(seat, 10),
    price: parseFloat(price) || 0,
    payment_status: paymentStatus,
    payment_reference: paymentReference,
    metadata,
  };

  // If a payment reference is provided, check if record exists and update it
  if (paymentReference) {
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('payment_reference', paymentReference)
      .maybeSingle();

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('reservations')
        .update({
          payment_status: paymentStatus,
          price: parseFloat(price) || 0,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          cellphone_number: cellphoneNumber.trim(),
          email: email ? email.trim().toLowerCase() : null,
          metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (!updateError && updated) {
        return updated;
      }
    }
  }

  // Otherwise upsert by unique seat per cohort
  try {
    const { data: record, error } = await supabase
      .from('reservations')
      .upsert([payload], { onConflict: 'cohort,row,seat' })
      .select()
      .maybeSingle();

    if (!error && record) return record;
    if (error && (error.code === '42501' || error.message.includes('row-level security'))) {
      // If RLS prevents select on non-confirmed rows, insert without returning
      await supabase
        .from('reservations')
        .upsert([payload], { onConflict: 'cohort,row,seat' });
      return { ...payload, id: 'registered-rls-protected' };
    }
    if (error) throw error;
    return record || payload;
  } catch (err) {
    if (err.code === '42501' || (err.message && err.message.includes('row-level security'))) {
      await supabase
        .from('reservations')
        .upsert([payload], { onConflict: 'cohort,row,seat' });
      return { ...payload, id: 'registered-rls-protected' };
    }
    console.error('[Supabase] Error inserting reservation:', err.message);
    throw err;
  }
}

/**
 * Fetch all confirmed or occupied seats for a given cohort.
 * Useful for syncing 2D grid and 3D auditorium availability.
 * 
 * @param {string} [cohort='Cohort 01']
 */
async function getReservations(cohort = 'Cohort 01') {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reservations')
    .select('id, first_name, last_name, cellphone_number, email, cohort, row, seat, seat_label, payment_status, payment_reference, created_at')
    .eq('cohort', cohort)
    .in('payment_status', ['confirmed', 'free_claim']);

  if (error) {
    console.error('[Supabase] Error fetching reservations:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Check if a specific seat is still available in the cohort.
 * 
 * @param {string} row
 * @param {number} seat
 * @param {string} [cohort='Cohort 01']
 */
async function isSeatAvailable(row, seat, cohort = 'Cohort 01') {
  if (!supabase) return true;

  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('cohort', cohort)
    .eq('row', row.toUpperCase())
    .eq('seat', parseInt(seat, 10))
    .in('payment_status', ['confirmed', 'free_claim'])
    .limit(1);

  if (error) {
    console.error('[Supabase] Error checking seat availability:', error.message);
    return false;
  }

  return !data || data.length === 0;
}

/**
 * Update reservation payment status by reference.
 * 
 * @param {string} paymentReference
 * @param {string} status - 'confirmed', 'cancelled', 'refunded'
 */
async function updateReservationStatus(paymentReference, status) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('reservations')
    .update({ payment_status: status })
    .eq('payment_reference', paymentReference)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error updating status:', error.message);
    throw error;
  }

  return data;
}

module.exports = {
  supabase,
  createReservation,
  getReservations,
  isSeatAvailable,
  updateReservationStatus,
};
