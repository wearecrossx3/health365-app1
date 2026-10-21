// Terms every dietitian accepts before they can work on Health365.
// Change TERMS_VERSION when the text changes: every dietitian is asked to
// accept again the next time they open the Dietitian app.
export const TERMS_VERSION = "2026-10-21";
export const TERMS_UPDATED = "21 October 2026";

export const TERMS_INTRO =
  "These terms apply to every dietitian who joins Health365 (run by Frontpage Studios). By applying or using the H365 Dietitian app, you agree to them.";

export const TERMS: { h: string; items: string[] }[] = [
  { h: "Who can join", items: [
    "You must hold a recognised qualification in nutrition or dietetics (for example a B.Sc., M.Sc. or diploma in Nutrition / Dietetics) and be at least 18 years old.",
    "The details you give (name, qualification, experience, city) must be true. We may ask for certificates or an ID to verify them.",
    "Health365 decides who is approved and may refuse or remove any application.",
  ] },
  { h: "How you work with clients", items: [
    "All consultations happen inside Health365 chat. Do not share or ask for phone numbers, email, social media, WhatsApp or UPI details.",
    "Do not take clients or payments outside Health365, during or after a consultation.",
    "Reply to booked clients within 24 hours, be polite and professional, and send the diet plan you promise.",
    "Keep to your agreed time slots. If you cannot attend, tell the Health365 team as early as you can.",
  ] },
  { h: "Professional limits", items: [
    "Give diet and lifestyle advice only. Do not prescribe medicines, change a client’s medicines or diagnose diseases.",
    "If a client shows warning signs (for example very high or low sugar, chest pain, pregnancy complications, an eating disorder), advise them to see a doctor at once.",
    "You are responsible for the advice and plans you give. Health365 provides the platform and tools.",
  ] },
  { h: "Fees and payments", items: [
    "You set your consultation fee when you apply. Health365 may show offers or coupons; your share is worked out on the fee you set.",
    "Clients pay Health365. Health365 keeps a platform fee of 15% on every consultation and pays the remaining 85% to you every month, by the 10th, for consultations completed in the month before.",
    "Refunds for no-shows, cancellations or complaints are decided by Health365 and are taken out of the share for that consultation.",
  ] },
  { h: "Client privacy", items: [
    "Client details, reports, photos and chats are confidential. Use them only for that client’s consultation.",
    "Do not screenshot, download, share or post client information anywhere, even without the name.",
    "Health365 may review chats to keep clients safe and to check that these terms are followed.",
  ] },
  { h: "Content and your profile", items: [
    "Health365 may show your name, photo, qualification, experience and fee in the app and on the website.",
    "Diet plans you send through Health365 stay available to the client in their app.",
    "The Health365 name, apps, templates and food database belong to Frontpage Studios.",
  ] },
  { h: "Suspension and leaving", items: [
    "Health365 may pause or remove your profile if you break these terms, receive repeated complaints or share contact details.",
    "You can stop taking new bookings at any time by writing to us at health365.support@gmail.com. Finish or hand over clients who have already paid.",
  ] },
  { h: "Changes and law", items: [
    "We may update these terms. We will tell you in the app or by email, and ask you to accept the new terms before you continue.",
    "These terms follow the laws of India. Disputes go to the courts of Rajkot, Gujarat.",
  ] },
];
