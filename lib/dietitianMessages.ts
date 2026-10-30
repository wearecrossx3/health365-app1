// Ready messages the owner can send a dietitian from Admin › Dietitians.
// {name} becomes the dietitian's first name. No imports: used in the browser too.
export const DT_MESSAGES: { key: string; label: string; title: string; body: string }[] = [
  {
    key: "received", label: "Application received", title: "We got your application 🙏",
    body: "Hi {name}, thank you for applying to join Health365 as a dietitian! 🙏\n\nOur team is checking your details and will get back to you within 2–3 days. Please keep your registration/degree certificate handy in case we ask for it.",
  },
  {
    key: "docs", label: "Need documents", title: "One more step for your application",
    body: "Hi {name}, thanks for applying to Health365. To approve your profile, please send us a photo of your degree/registration certificate and a clear profile photo. You can reply to this message or email health365.support@gmail.com.",
  },
  {
    key: "welcome", label: "Welcome: accept terms", title: "Welcome to Health365 🎉",
    body: "Hi {name}, welcome to Health365! Your dietitian account is ready. Please download the H365 Dietitian app here:\nhttps://www.thehealth365.in/dietitian-app\n\nThen log in with your Health365 email and password, read the Terms for dietitians and tap “I agree”. After that you can start taking consultations.",
  },
  {
    key: "approved", label: "Approved: start using", title: "You're approved ✅",
    body: "Hi {name}, your Health365 profile is approved and live. Open the H365 Dietitian app, accept the terms if you haven't yet, and add a clear photo and short bio in Me › Edit profile. Clients can now book you. Please reply to them within 24 hours. Welcome to the team!",
  },
  {
    key: "terms", label: "Reminder: accept terms", title: "Please accept the terms",
    body: "Hi {name}, a quick reminder: please open the H365 Dietitian app and accept the Terms for dietitians. You can see your clients and chats only after that.",
  },
  {
    key: "photo", label: "Add photo, bio & mobile", title: "Complete your profile",
    body: "Hi {name}, please open the H365 Dietitian app › Me › Edit profile and add your mobile number (WhatsApp), a clear, friendly photo and a short bio. Clients see your photo and bio before they book you, and our team uses your number to reach you.",
  },
  {
    key: "waiting", label: "Clients waiting", title: "Clients are waiting for you",
    body: "Hi {name}, some clients are waiting for your reply in the H365 Dietitian app. Please reply when you can. Clients expect an answer within 24 hours.",
  },
  {
    key: "notnow", label: "Not approved now", title: "About your Health365 application",
    body: "Hi {name}, thank you for your interest in Health365. We're not able to approve your profile right now. We'll keep your details and reach out if that changes. Wishing you the very best!",
  },
];

export const fillDtMessage = (s: string, name: string) => s.replace(/\{name\}/g, (name || "there").trim().split(/\s+/)[0]);
