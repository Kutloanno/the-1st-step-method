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
    const { email, amount, studentName, studentPhone, row, seat, cohort } = req.body;

    if (!email) {
      return res.status(400).json({ status: false, message: 'Student email is required.' });
    }

    // Convert amount in Rands to cents: priceInRands * 100
    const rawAmount = Number(amount);
    const amountInCents = isNaN(rawAmount) ? 49900 : Math.round(rawAmount * 100);

    const seatSpot = row && seat ? `Spot ${row}${seat}` : 'Cohort Pass';
    const metadata = {
      student_name: studentName || 'Student',
      student_phone: studentPhone || '',
      row: row || '',
      seat: seat || '',
      cohort: cohort || 'Cohort 01',
      custom_fields: [
        { display_name: 'Student Name', variable_name: 'student_name', value: studentName || 'Student' },
        { display_name: 'Cohort Spot', variable_name: 'cohort_spot', value: seatSpot },
        { display_name: 'Row', variable_name: 'row', value: row || '' },
        { display_name: 'Seat', variable_name: 'seat', value: String(seat || '') },
        { display_name: 'Cohort', variable_name: 'cohort', value: cohort || 'Cohort 01' },
        { display_name: 'Phone / WhatsApp', variable_name: 'phone', value: studentPhone || 'Not provided' }
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
      }

      return res.status(response.status).json(data);
    } else {
      // Development / Test simulation verification
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
app.post(['/api/paystack/webhook', '/paystack/webhook'], (req, res) => {
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

// Route to get confirmed reservations
app.get(['/api/reservations', '/reservations'], (req, res) => {
  const reservations = getStoredReservations();
  res.json({ status: true, reservations });
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
