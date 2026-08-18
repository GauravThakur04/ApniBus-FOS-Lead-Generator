/**
 * Meta Conversions API (CAPI) Integration for Google Forms
 * ApniBus Channel Partner Acquisition Campaign
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Your Meta Dataset ID
  DATASET_ID: '1556087456022097', 
  
  // Fresh Meta Access Token
  ACCESS_TOKEN: 'EAAEVcgxp1jUBSGYZCIR99o0yqvTO8QthvSVqspNHESqORIPQ4t3KLp2gl829gfisZCZAtlyoZCYXtPYC877CQuJsZB78ZCcqWY9KlQ1ZAwsiLcUGiDfl2kCcZCgGPDhCn7EucMtlOlmX4XZCfDRHVHZBUQcH1XvhjcTZBXN7MhM4dfNQp83FmvZAavnHubXdmh9uOhkW4wZDZD',
  
  // Your Active Test Event Code
  TEST_EVENT_CODE: 'TEST41530', 
  
  // Event details
  EVENT_NAME: 'Lead',
  ACTION_SOURCE: 'other', 
  
  // Form Field Mapping (Match these with exact question titles in your Google Form)
  FIELDS: {
    EMAIL: 'Email Address',    // Change to match your Google Form field title for Email
    PHONE: 'Phone Number',     // Change to match your Google Form field title for Phone
    FULL_NAME: 'Full Name'     // Change to match your Google Form field title for Name
  }
};

// ==================== MAIN TRIGGER FUNCTION ====================
function onFormSubmit(e) {
  try {
    let responses = {};
    
    if (e && e.namedValues) {
      for (let key in e.namedValues) {
        responses[key.trim()] = e.namedValues[key][0];
      }
    } else if (e && e.response) {
      let itemResponses = e.response.getItemResponses();
      for (let i = 0; i < itemResponses.length; i++) {
        let itemResponse = itemResponses[i];
        responses[itemResponse.getItem().getTitle().trim()] = itemResponse.getResponse();
      }
    } else {
      Logger.log("Manual test execution without event object.");
      return;
    }

    Logger.log("Form Response Received: " + JSON.stringify(responses));

    // Extract fields
    const rawEmail = responses[CONFIG.FIELDS.EMAIL] || '';
    const rawPhone = responses[CONFIG.FIELDS.PHONE] || '';
    const rawName  = responses[CONFIG.FIELDS.FULL_NAME] || '';

    let firstName = '';
    let lastName = '';
    if (rawName) {
      let nameParts = rawName.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Build User Data Payload (Hashed according to Meta requirements)
    let userData = {};
    if (rawEmail) userData.em = [hashSHA256(normalizeEmail(rawEmail))];
    if (rawPhone) userData.ph = [hashSHA256(normalizePhone(rawPhone))];
    if (firstName) userData.fn = [hashSHA256(normalizeText(firstName))];
    if (lastName) userData.ln = [hashSHA256(normalizeText(lastName))];

    // Payload structure for Meta Conversions API
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const eventId = 'lead_' + timestamp + '_' + Math.floor(Math.random() * 10000);

    let eventData = {
      event_name: CONFIG.EVENT_NAME,
      event_time: timestamp,
      event_id: eventId,
      action_source: CONFIG.ACTION_SOURCE,
      user_data: userData,
      custom_data: {
        lead_type: 'Google Form Submission',
        campaign_name: 'ApniBus Channel Partner Acquisition'
      }
    };

    let payload = {
      data: [eventData]
    };

    if (CONFIG.TEST_EVENT_CODE && CONFIG.TEST_EVENT_CODE.trim() !== '') {
      payload.test_event_code = CONFIG.TEST_EVENT_CODE.trim();
    }

    // Call Meta API
    const url = `https://graph.facebook.com/v19.0/${CONFIG.DATASET_ID}/events?access_token=${CONFIG.ACCESS_TOKEN}`;
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    Logger.log("Meta CAPI Response: " + responseText);

  } catch (error) {
    Logger.log("Error in onFormSubmit: " + error.toString());
  }
}

// ==================== HELPER / HASHING FUNCTIONS ====================
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

function normalizeText(text) {
  return text.trim().toLowerCase();
}

function hashSHA256(input) {
  if (!input) return '';
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let byteStr = byteVal.toString(16);
    if (byteStr.length == 1) byteStr = '0' + byteStr;
    txtHash += byteStr;
  }
  return txtHash;
}
