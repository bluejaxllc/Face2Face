/**
 * GoHighLevel SMS Integration
 * Sends OTP verification codes via GHL's Conversations API
 */

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_KEY = process.env.GHL_API_KEY || "";
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "";
const GHL_PHONE_NUMBER = process.env.GHL_PHONE_NUMBER || "";

function getHeaders() {
    return {
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
    };
}

/**
 * Create or find a contact in GHL by phone number
 */
export async function findOrCreateContact(phone: string, firstName: string): Promise<string> {
    // First try to find existing contact
    const searchRes = await fetch(
        `${GHL_API_BASE}/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(phone)}&limit=1`,
        { method: "GET", headers: getHeaders() }
    );

    if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.contacts && searchData.contacts.length > 0) {
            return searchData.contacts[0].id;
        }
    }

    // Create new contact
    const createRes = await fetch(`${GHL_API_BASE}/contacts/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            locationId: GHL_LOCATION_ID,
            phone: phone,
            firstName: firstName || "Face2Face User",
            source: "Face2Face App",
            tags: ["face2face", "sms-verification"],
        }),
    });

    if (!createRes.ok) {
        const error = await createRes.text();
        console.error("GHL create contact error:", error);
        throw new Error(`Failed to create GHL contact: ${createRes.status}`);
    }

    const contactData = await createRes.json();
    return contactData.contact.id;
}

/**
 * Send an SMS message via GHL
 */
export async function sendSMS(contactId: string, message: string): Promise<boolean> {
    const res = await fetch(`${GHL_API_BASE}/conversations/messages`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            type: "SMS",
            contactId: contactId,
            message: message,
        }),
    });

    if (!res.ok) {
        const error = await res.text();
        console.error("GHL send SMS error:", error);
        return false;
    }

    return true;
}

/**
 * Send OTP verification code via GHL SMS
 */
export async function sendVerificationSMS(phone: string, code: string, firstName: string): Promise<boolean> {
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
        console.error("GHL credentials not configured. Set GHL_API_KEY and GHL_LOCATION_ID env vars.");
        // In development, log the code to console instead
        console.log(`[DEV MODE] Verification code for ${phone}: ${code}`);
        return true;
    }

    try {
        const contactId = await findOrCreateContact(phone, firstName);
        const message = `Your Face2Face verification code is: ${code}\n\nThis code expires in 5 minutes. Do not share it with anyone.`;
        return await sendSMS(contactId, message);
    } catch (error) {
        console.error("Failed to send verification SMS:", error);
        return false;
    }
}
