// Ready messages the owner can send a dietitian from Admin › Dietitians.
// {name} becomes the dietitian's first name. No imports: used in the browser too.
export const DT_MESSAGES: { key: string; label: string; title: string; body: string }[] = [
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
    key: "photo", label: "Add photo and bio", title: "Add your photo",
    body: "Hi {name}, please add a clear, friendly photo and a short bio in the H365 Dietitian app (Me › Edit profile). Clients see these before they book you.",
  },
  {
    key: "waiting", label: "Clients waiting", title: "Clients are waiting for you",
    body: "Hi {name}, some clients are waiting for your reply in the H365 Dietitian app. Please reply when you can. Clients expect an answer within 24 hours.",
  },
];

export const fillDtMessage = (s: string, name: string) => s.replace(/\{name\}/g, (name || "there").trim().split(/\s+/)[0]);
