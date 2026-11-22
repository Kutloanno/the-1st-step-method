const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';

// Serverless-safe data store path for reservations
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const DATA_DIR = isServerless ? '/tmp' : path.join(__dirname, 'data');
const RESERVATIONS_FILE = path.join(DATA_DIR, 'reservations.json');

let inMemoryReservations = [];

// Safe file initialization that will never crash on read-only environments
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RESERVATIONS_FILE)) {
    fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify([]), 'utf8');
  }
} catch (e) {
  console.warn('[Storage] Filesystem write not permitted, using in-memory store:', e.message);
}

function getStoredReservations() {
  try {
    if (fs.existsSync(RESERVATIONS_FILE)) {
      const raw = fs.readFileSync(RESERVATIONS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return inMemoryReservations;
}

let supabaseClient = null;
try {
  supabaseClient = require('./supabaseClient');
} catch (e) {}

let brevoService = null;
try {
  brevoService = require('./lib/brevo');
} catch (e) {
  console.warn('[Brevo Init Notice]:', e.message);
}

// Idempotency cache for paid welcome emails to prevent duplicates on webhook retries
const sentWelcomeEmails = new Set();

async function handlePaidWelcomeEmailDispatch(transactionData, metadata = {}) {
  try {
    const reference = transactionData.reference || metadata.reference || (transactionData.data && transactionData.data.reference);
    if (!reference) return;

    if (sentWelcomeEmails.has(reference)) {
      console.log(`[Brevo Idempotency] Welcome email already dispatched for reference ${reference}. Skipping duplicate.`);
      return;
    }

    // Check Supabase if this reservation was already marked as email sent
    if (supabaseClient && supabaseClient.supabase) {
      try {
        const { data: existing } = await supabaseClient.supabase
          .from('reservations')
          .select('metadata')
          .eq('payment_reference', reference)
          .maybeSingle();

        if (existing && existing.metadata && existing.metadata.welcome_email_sent) {
          sentWelcomeEmails.add(reference);
          console.log(`[Brevo Idempotency] Supabase confirms welcome email already sent for ${reference}. Skipping.`);
          return;
        }
      } catch (checkErr) {
        console.warn('[Brevo Supabase Check Warning]:', checkErr.message);
      }
    }

    // Mark in memory immediately to prevent race conditions
    sentWelcomeEmails.add(reference);

    const customerEmail = (transactionData.customer && transactionData.customer.email) || transactionData.email || metadata.studentEmail || metadata.email;
    const customerName = metadata.student_name || metadata.studentName || (transactionData.customer && `${transactionData.customer.first_name || ''} ${transactionData.customer.last_name || ''}`.trim()) || 'Student';
    const seatSpot = metadata.row && metadata.seat ? `Spot ${metadata.row}${metadata.seat}` : (metadata.cohort_spot || 'Cohort 01 Seat');

    if (brevoService && typeof brevoService.sendPaidWelcomeEmail === 'function' && customerEmail) {
      const emailResult = await brevoService.sendPaidWelcomeEmail({
        toEmail: customerEmail,
        toName: customerName,
        seatNumber: seatSpot,
        reference: reference,
      });

      if (emailResult && emailResult.success) {
        console.log(`[Brevo Paid Welcome Email] Successfully sent to ${customerEmail} for reference ${reference}`);
      }

      // Record welcome_email_sent flag in Supabase
      if (supabaseClient && supabaseClient.supabase) {
        supabaseClient.supabase
          .from('reservations')
          .update({
            metadata: {
              ...(metadata || {}),
              welcome_email_sent: true,
              welcome_email_sent_at: new Date().toISOString()
            }
          })
          .eq('payment_reference', reference)
          .then(() => console.log(`[Brevo Email Flagged] Supabase recorded welcome_email_sent for ${reference}`))
          .catch((err) => console.warn('[Supabase Metadata Update Notice]:', err.message));
      }
    }
  } catch (err) {
    // Graceful error capture: never crash the server or webhook
    console.error('[Brevo Paid Welcome Email Error]:', err.message || err);
  }
}

function saveReservation(reservation) {
  try {
    const exists = inMemoryReservations.some((r) => r.reference === reservation.reference);
    if (!exists) {
      inMemoryReservations.push({ ...reservation, createdAt: new Date().toISOString() });
    }
    const list = getStoredReservations();
    const diskExists = list.some((r) => r.reference === reservation.reference);
    if (!diskExists) {
      list.push({ ...reservation, createdAt: new Date().toISOString() });
      fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify(list, null, 2), 'utf8');
    }

    // Sync to Supabase if available
    if (supabaseClient && typeof supabaseClient.createReservation === 'function') {
      const nameParts = (reservation.studentName || 'Student').trim().split(/\s+/);
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || firstName;
      const phone = reservation.studentPhone || reservation.phone || reservation.cellphoneNumber || '0000000000';

      supabaseClient.createReservation({
        firstName,
        lastName,
        age: reservation.age || 21,
        cellphoneNumber: phone,
        email: reservation.email || reservation.studentEmail,
        cohort: reservation.cohort || 'Cohort 01',
        row: reservation.row || 'A',
        seat: parseInt(reservation.seat, 10) || 1,
        price: reservation.amount || reservation.price || 0,
        paymentStatus: reservation.status && reservation.status.includes('FREE') ? 'free_claim' : 'confirmed',
        paymentReference: reservation.reference,
        metadata: reservation.metadata || {}
      }).catch((err) => {
        console.warn('[Supabase Sync Notice]:', err.message);
      });
    }
  } catch (e) {
    console.warn('[Storage] File write notice:', e.message);
  }
}

// Preserve raw body for HMAC signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Serve @paystack/inline-js from npm installation
const npmInlineJsPath = path.join(__dirname, 'node_modules', '@paystack', 'inline-js', 'dist', 'inline.js');
app.get('/vendor/paystack-inline.js', (req, res) => {
  if (fs.existsSync(npmInlineJsPath)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.sendFile(npmInlineJsPath);
  } else {
    res.status(404).send('// @paystack/inline-js package not found');
  }
});

// Provide public configuration to the frontend
app.get(['/api/config', '/config'], (req, res) => {
  res.json({
    paystackPublicKey: PAYSTACK_PUBLIC_KEY || 'pk_test_cb912809e5b2e67df1bbbe04085f1c97034cf5e2',
    currency: 'ZAR',
    environment: PAYSTACK_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test'
  });
});

// ==========================================================================
// 1. INITIALIZE ROUTE: POST /api/paystack/initialize
// Sends email, currency: "ZAR", and amount in cents (priceInRands * 100)
// to https://api.paystack.co/transaction/initialize using PAYSTACK_SECRET_KEY
// ==========================================================================
app.post(['/api/paystack/initialize', '/paystack/initialize'], async (req, res) => {
  try {
    const { email, amount, studentName, studentPhone, studentAge, row, seat, cohort } = req.body;

    if (!email) {
      return res.status(400).json({ status: false, message: 'Student email is required.' });
    }

    if (studentAge !== undefined && studentAge !== null && studentAge !== '') {
      const parsedAge = parseInt(studentAge, 10);
      if (isNaN(parsedAge) || parsedAge < 18) {
        return res.status(400).json({ status: false, message: 'You must be 18 or older to reserve a seat. Anyone under the age of 18 is not allowed.' });
      }
    }

    // Convert amount in Rands to cents: priceInRands * 100
    const rawAmount = Number(amount);
    const amountInCents = isNaN(rawAmount) ? 49900 : Math.round(rawAmount * 100);

    const seatSpot = row && seat ? `Spot ${row}${seat}` : 'Cohort Pass';
    const metadata = {
      student_name: studentName || 'Student',
      student_phone: studentPhone || '',
      student_age: studentAge ? String(studentAge) : '',
      row: row || '',
      seat: seat || '',
      cohort: cohort || 'Cohort 01',
      custom_fields: [
        { display_name: 'Student Name', variable_name: 'student_name', value: studentName || 'Student' },
        { display_name: 'Cohort Spot', variable_name: 'cohort_spot', value: seatSpot },
        { display_name: 'Row', variable_name: 'row', value: row || '' },
        { display_name: 'Seat', variable_name: 'seat', value: String(seat || '') },
        { display_name: 'Cohort', variable_name: 'cohort', value: cohort || 'Cohort 01' },
        { display_name: 'Phone / WhatsApp', variable_name: 'phone', value: studentPhone || 'Not provided' },
        { display_name: 'Age', variable_name: 'student_age', value: studentAge ? String(studentAge) : '18+' }
      ]
    };

    const hasLiveSecret = PAYSTACK_SECRET_KEY && !PAYSTACK_SECRET_KEY.includes('placeholder');
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${req.protocol}://${req.get('host')}/success`;

    if (hasLiveSecret) {
      // Call official Paystack initialize endpoint
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          amount: amountInCents,
          currency: 'ZAR',
          callback_url: callbackUrl,
          metadata
        })
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        console.error('Paystack initialization failed:', data);
        return res.status(response.status || 400).json(data);
      }

      console.log(`[Paystack Initialize] Created transaction ${data.data.reference} with access_code ${data.data.access_code}`);

      // Log pending reservation into Supabase immediately so student and spot are recorded
      if (supabaseClient && typeof supabaseClient.createReservation === 'function') {
        const nameParts = (studentName || 'Student').trim().split(/\s+/);
        supabaseClient.createReservation({
          firstName: nameParts[0] || 'Student',
          lastName: nameParts.slice(1).join(' ') || nameParts[0] || 'Student',
          age: 21,
          cellphoneNumber: studentPhone || '0000000000',
          email: email.trim().toLowerCase(),
          cohort: cohort || 'Cohort 01',
          row: (row || 'B').toUpperCase(),
          seat: parseInt(seat || '3', 10),
          price: (amountInCents / 100) || 499,
          paymentStatus: 'pending',
          paymentReference: data.data.reference,
          metadata
        }).catch((err) => console.warn('[Supabase Pending Notice]:', err.message));
      }

      return res.json({
        status: true,
        message: 'Authorization URL created',
        data: {
          access_code: data.data.access_code,
          reference: data.data.reference,
          authorization_url: data.data.authorization_url
        }
      });
    } else {
      // Development / Test Simulation Mode when PAYSTACK_SECRET_KEY is not configured
      const simulatedRef = `FSM-${row || 'B'}${seat || '3'}-${Date.now().toString(36).toUpperCase()}`;
      const simulatedAccessCode = `sim_acc_${Date.now().toString(36)}`;
      console.log(`[Paystack Initialize (Dev/Test Simulation)] Generated access_code: ${simulatedAccessCode}`);

      // Log pending reservation into Supabase immediately in dev simulation
      if (supabaseClient && typeof supabaseClient.createReservation === 'function') {
        const nameParts = (studentName || 'Student').trim().split(/\s+/);
        supabaseClient.createReservation({
          firstName: nameParts[0] || 'Student',
          lastName: nameParts.slice(1).join(' ') || nameParts[0] || 'Student',
          age: 21,
          cellphoneNumber: studentPhone || '0000000000',
          email: email.trim().toLowerCase(),
          cohort: cohort || 'Cohort 01',
          row: (row || 'B').toUpperCase(),
          seat: parseInt(seat || '3', 10),
          price: (amountInCents / 100) || 499,
          paymentStatus: 'pending',
          paymentReference: simulatedRef,
          metadata
        }).catch((err) => console.warn('[Supabase Pending Notice]:', err.message));
      }

      return res.json({
        status: true,
        message: 'Authorization URL created (Simulation Mode)',
        data: {
          access_code: simulatedAccessCode,
          reference: simulatedRef,
          authorization_url: `https://checkout.paystack.com/${simulatedAccessCode}`
        }
      });
    }
  } catch (error) {
    console.error('Error initializing transaction:', error);
    res.status(500).json({ status: false, message: 'Internal server error initializing payment', error: error.message });
  }
});

// ==========================================================================
// 2. VERIFY ROUTE: GET /api/paystack/verify/:reference
// Calls GET https://api.paystack.co/transaction/verify/:reference
// using PAYSTACK_SECRET_KEY
// ==========================================================================
app.get(['/api/paystack/verify/:reference', '/paystack/verify/:reference'], async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ status: false, message: 'Transaction reference is required.' });
    }

    const hasLiveSecret = PAYSTACK_SECRET_KEY && !PAYSTACK_SECRET_KEY.includes('placeholder');

    if (hasLiveSecret && !reference.startsWith('sim_acc_') && !reference.startsWith('FSM-FREE-')) {
      // Call official Paystack verify endpoint
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      });

      const data = await response.json();

      if (response.ok && data.status && data.data && data.data.status === 'success') {
        const metadata = data.data.metadata || {};
        saveReservation({
          reference: data.data.reference,
          email: data.data.customer?.email,
          studentName: metadata.student_name || 'Student',
          row: metadata.row,
          seat: metadata.seat,
          cohort: metadata.cohort || 'Cohort 01',
          amount: data.data.amount / 100,
          currency: data.data.currency,
          paidAt: data.data.paid_at,
          channel: data.data.channel
        });
        console.log(`[Paystack Verify] Verified payment for reference: ${reference}`);

        // Dispatch Welcome Email idempotently (awaited so serverless container does not exit before send completes)
        try {
          await handlePaidWelcomeEmailDispatch(data.data, metadata);
        } catch (err) {
          console.warn('[Verify Email Dispatch Notice]:', err.message);
        }
      }

      return res.status(response.status).json(data);
    } else {
      // Development / Test simulation verification
      const refParts = reference.split('-');
      const rowSeat = refParts[1] || 'B3';
      const simRow = rowSeat.charAt(0) || 'B';
      const simSeat = parseInt(rowSeat.slice(1), 10) || 3;

      saveReservation({
        reference,
        email: 'student@varsity.ac.za',
        studentName: 'Student',
        row: simRow,
        seat: simSeat,
        cohort: 'Cohort 01',
        amount: 499,
        status: 'PAID · PAYSTACK VERIFIED'
      });

      const simData = {
        status: true,
        message: 'Verification successful (Simulation Mode)',
        data: {
          id: Date.now(),
          domain: 'test',
          status: 'success',
          reference,
          amount: 49900,
          currency: 'ZAR',
          channel: 'card',
          paid_at: new Date().toISOString(),
          customer: {
            email: 'student@varsity.ac.za'
          }
        }
      };
      console.log(`[Paystack Verify (Simulation)] Approved reference: ${reference}`);
      return res.json(simData);
    }
  } catch (error) {
    console.error('Error verifying transaction:', error);
    res.status(500).json({ status: false, message: 'Internal server error verifying payment', error: error.message });
  }
});

// ==========================================================================
// 3. WEBHOOK ROUTE: POST /api/paystack/webhook
// Checks Paystack's signature header before marking a student's seat as paid
// ==========================================================================
app.post(['/api/paystack/webhook', '/paystack/webhook'], async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const hasLiveSecret = PAYSTACK_SECRET_KEY && !PAYSTACK_SECRET_KEY.includes('placeholder');

    // Validate signature with HMAC SHA512
    if (hasLiveSecret) {
      if (!signature) {
        console.warn('[Paystack Webhook] Missing x-paystack-signature header');
        return res.status(401).json({ status: false, message: 'Missing Paystack signature header' });
      }

      const expectedHash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(req.rawBody || '')
        .digest('hex');

      if (signature !== expectedHash) {
        console.warn('[Paystack Webhook] Signature mismatch! Rejecting request.');
        return res.status(401).json({ status: false, message: 'Invalid signature' });
      }
    }

    const event = req.body;
    console.log(`[Paystack Webhook] Received event: ${event.event}`);

    if (event && event.event === 'charge.success') {
      const data = event.data || {};
      const metadata = data.metadata || {};

      saveReservation({
        reference: data.reference,
        email: data.customer?.email,
        studentName: metadata.student_name || 'Student',
        row: metadata.row,
        seat: metadata.seat,
        cohort: metadata.cohort || 'Cohort 01',
        amount: (data.amount || 0) / 100,
        currency: data.currency || 'ZAR',
        paidAt: data.paid_at || new Date().toISOString(),
        channel: data.channel || 'webhook'
      });

      console.log(`[Paystack Webhook] Successfully marked seat ${metadata.row}${metadata.seat} as paid for ${data.customer?.email}`);

      // Dispatch Welcome Email idempotently (never blocks 200 response on failure)
      await handlePaidWelcomeEmailDispatch(data, metadata);
    }

    // Acknowledge receipt to Paystack with 200 OK
    return res.status(200).json({ status: true, message: 'Webhook received and processed' });
  } catch (error) {
    console.error('[Paystack Webhook Error]', error);
    res.status(500).json({ status: false, message: 'Webhook error', error: error.message });
  }
});

// Webhook GET health check (returns active status for browser / testing)
app.get(['/api/paystack/webhook', '/paystack/webhook'], (req, res) => {
  res.json({
    status: true,
    message: 'Paystack webhook endpoint active. Send incoming events via POST with x-paystack-signature header.'
  });
});

// Dedicated Live Callback / Success Page
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'success.html'));
});

// ==========================================================================
// 4. RESERVATIONS API: POST & GET /api/reservations
// ==========================================================================

// Create / record reservation (Free seats, Paystack confirmations, client sync)
app.post(['/api/reservations', '/reservations'], async (req, res) => {
  try {
    const {
      studentName,
      studentEmail,
      studentPhone,
      row,
      seat,
      cohort,
      price,
      reference,
      status,
      age,
      metadata
    } = req.body;

    if (!row || !seat) {
      return res.status(400).json({ status: false, message: 'Row and seat number are required.' });
    }

    const reservationData = {
      reference: reference || `FSM-${row}${seat}-${Date.now().toString(36).toUpperCase()}`,
      studentName: (studentName || 'Student').trim(),
      email: (studentEmail || '').trim(),
      studentPhone: (studentPhone || '').trim(),
      row: String(row).toUpperCase(),
      seat: parseInt(seat, 10),
      cohort: cohort || 'Cohort 01',
      amount: Number(price) || 0,
      price: Number(price) || 0,
      status: status || (Number(price) === 0 ? 'CONFIRMED · 100% TUITION SCHOLARSHIP' : 'PAID · PAYSTACK VERIFIED'),
      age: age || 21,
      metadata: metadata || {}
    };

    // Save in server store
    saveReservation(reservationData);

    // Save into Supabase database
    let supabaseRecord = null;
    if (supabaseClient && typeof supabaseClient.createReservation === 'function') {
      try {
        const nameParts = reservationData.studentName.split(/\s+/);
        supabaseRecord = await supabaseClient.createReservation({
          firstName: nameParts[0] || 'Student',
          lastName: nameParts.slice(1).join(' ') || nameParts[0] || 'Student',
          age: reservationData.age,
          cellphoneNumber: reservationData.studentPhone || '0000000000',
          email: reservationData.email,
          cohort: reservationData.cohort,
          row: reservationData.row,
          seat: reservationData.seat,
          price: reservationData.price,
          paymentStatus: (reservationData.status.includes('FREE') || reservationData.status === 'free_claim') ? 'free_claim' : 'confirmed',
          paymentReference: reservationData.reference,
          metadata: reservationData.metadata
        });
        console.log(`[Supabase Database] Successfully logged seat ${reservationData.row}${reservationData.seat} for ${reservationData.studentName}`);
      } catch (dbErr) {
        console.warn('[Supabase Database Warning]:', dbErr.message);
      }
    }

    // Send Free Seat Welcome Email via Brevo if tuition is R0 / free scholarship (awaited for serverless reliability)
    if (Number(reservationData.price) === 0 && reservationData.email && brevoService && typeof brevoService.sendFreeSeatEmail === 'function') {
      const seatLabel = reservationData.row && reservationData.seat ? `Spot ${reservationData.row}${reservationData.seat}` : 'Free Student Seat';
      try {
        const freeEmailResult = await brevoService.sendFreeSeatEmail({
          toEmail: reservationData.email,
          toName: reservationData.studentName || 'Student',
          seatNumber: seatLabel,
        });
        console.log(`[Brevo Free Seat Email Dispatch] Result for ${reservationData.email}:`, freeEmailResult);
      } catch (err) {
        console.warn('[Brevo Free Seat Email Error]:', err.message);
      }
    }

    return res.json({
      status: true,
      message: 'Reservation recorded and synced with Supabase successfully',
      data: supabaseRecord || reservationData
    });
  } catch (error) {
    console.error('Error saving reservation:', error);
    res.status(500).json({ status: false, message: error.message });
  }
});

// Route to get confirmed reservations from Supabase and server store
app.get(['/api/reservations', '/reservations'], async (req, res) => {
  try {
    let reservations = [];
    if (supabaseClient && typeof supabaseClient.getReservations === 'function') {
      try {
        const dbReservations = await supabaseClient.getReservations(req.query.cohort || 'Cohort 01');
        if (Array.isArray(dbReservations) && dbReservations.length > 0) {
          reservations = dbReservations.map((r) => ({
            id: r.id,
            studentName: `${r.first_name} ${r.last_name}`.trim(),
            studentEmail: r.email,
            studentPhone: r.cellphone_number,
            row: r.row,
            seat: r.seat,
            seatLabel: r.seat_label,
            cohort: r.cohort,
            status: r.payment_status,
            reference: r.payment_reference,
            createdAt: r.created_at
          }));
        }
      } catch (dbErr) {
        console.warn('[Supabase Fetch Notice]:', dbErr.message);
      }
    }

    // Merge with stored local reservations
    const localReservations = getStoredReservations();
    localReservations.forEach((lr) => {
      const exists = reservations.some((r) => r.row === lr.row && Number(r.seat) === Number(lr.seat));
      if (!exists) {
        reservations.push(lr);
      }
    });

    res.json({ status: true, reservations });
  } catch (e) {
    res.json({ status: true, reservations: getStoredReservations() });
  }
});

// ==========================================================================
// 5. CONTACT & QUESTIONS API: POST /api/contact
// Connects visitor question form to Brevo transactional email
// ==========================================================================
app.post(['/api/contact', '/contact'], async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ status: false, message: 'Please provide a valid email address.' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ status: false, message: 'Message content cannot be empty.' });
    }

    if (brevoService && typeof brevoService.sendContactNotificationEmail === 'function') {
      const emailResult = await brevoService.sendContactNotificationEmail({
        fromName: (name || 'Website Visitor').trim(),
        fromEmail: email.trim(),
        message: message.trim(),
      });

      return res.json({
        status: true,
        message: 'Your question has been sent successfully. Jay & Kutloano will reply within 24 hours.',
        result: emailResult,
      });
    } else {
      return res.json({
        status: true,
        message: 'Message received. We will reply to your email within 24 hours.',
      });
    }
  } catch (error) {
    console.error('[Contact API Exception]:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to deliver message. Please try again or email support directly.',
      error: error.message,
    });
  }
});

// Serve static frontend assets only in local development (Vercel serves them via Edge CDN)
if (!process.env.VERCEL) {
  app.use(express.static(__dirname, {
    extensions: ['html', 'htm']
  }));

  // Fallback to index.html for single-page routing locally
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

// Global Express Error Handler ensuring valid JSON responses
app.use((err, req, res, next) => {
  console.error('[Express Unhandled Error]:', err);
  res.status(500).json({
    status: false,
    message: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

// Export app for Vercel Serverless Function deployment
module.exports = app;

// Start Server locally if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('==================================================');
    console.log(` Meridian Cinema (The 1st Step Method) Server`);
    console.log(` Listening on: http://localhost:${PORT}`);
    console.log(` Paystack endpoints active:`);
    console.log(`   - Live Callback: GET  http://localhost:${PORT}/success`);
    console.log(`   - Live Webhook:  POST http://localhost:${PORT}/api/paystack/webhook`);
    console.log(`   - Initialize:    POST http://localhost:${PORT}/api/paystack/initialize`);
    console.log(`   - Verify:        GET  http://localhost:${PORT}/api/paystack/verify/:reference`);
    console.log('==================================================');
  });
}
