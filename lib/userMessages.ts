// Ready-made messages the team can send to users from Admin › Users, by
// email or WhatsApp. {name} becomes the user's first name.
export const USER_MESSAGES: { key: string; label: string; subject: string; body: string }[] = [
  {
    key: "welcome", label: "Welcome", subject: "Welcome to Health365 🌿",
    body: "Hi {name}, welcome to Health365! 🌿\n\nYour desi diet plan is waiting in the app. Open it, tell us your goal, and get a plan built around the food you already eat at home.\n\nGet the app: https://www.thehealth365.in/app",
  },
  {
    key: "profile", label: "Finish your profile", subject: "One small step left, {name}",
    body: "Hi {name}, thanks for joining Health365!\n\nYou're one step away from your plan. Open the app and finish your profile — your goal, food preference and any health condition — so we can make the plan right for you.\n\nOpen the app: https://www.thehealth365.in/app",
  },
  {
    key: "phone", label: "Add mobile number", subject: "Please add your mobile number",
    body: "Hi {name}, your Health365 account doesn't have a mobile number yet.\n\nPlease add it in the app (Profile) or on the website: https://www.thehealth365.in/dashboard\n\nIt helps your dietitian reach you about appointments and plans.",
  },
  {
    key: "consult", label: "Book a dietitian", subject: "Talk to a real dietitian",
    body: "Hi {name}, want a plan made just for you?\n\nBook a consultation with a Health365 dietitian right inside the app. Chat with them, share your reports, and get your personal plan.\n\nOpen the app: https://www.thehealth365.in/app",
  },
  {
    key: "booked", label: "Booking confirmed", subject: "Your consultation is confirmed ✅",
    body: "Hi {name}, your payment is received and your consultation is confirmed ✅\n\nYour dietitian will message you in the Health365 app (Consult tab). You can share your reports and questions there anytime.\n\nOpen the app: https://www.thehealth365.in/app",
  },
  {
    key: "paycheck", label: "Payment not found", subject: "About your Health365 payment",
    body: "Hi {name}, we couldn't match your payment for the consultation yet.\n\nPlease reply with a screenshot of the payment or the 12-digit UPI reference number (UTR), and we'll confirm it right away.",
  },
  {
    key: "plan", label: "Your plan is ready", subject: "Your diet plan is ready ✅",
    body: "Hi {name}, your dietitian has added your diet plan in the Health365 app.\n\nOpen the app to see it. If you have any question about it, message your dietitian in the app.",
  },
  {
    key: "checkin", label: "How's it going?", subject: "How's your week going, {name}?",
    body: "Hi {name}, how is your diet plan going this week? 🌿\n\nLog your weight in the Health365 app and tell your dietitian what felt easy or hard — they'll adjust your plan.",
  },
  {
    key: "gift", label: "Free 7-day plan", subject: "A free 7-day plan for you 🎁",
    body: "Hi {name}, we've added a free 7-day diet plan to your Health365 account 🎁\n\nOpen the app and make your plan today: https://www.thehealth365.in/app",
  },
  {
    key: "missyou", label: "We miss you", subject: "We miss you, {name} 👋",
    body: "Hi {name}, it's been a while!\n\nSmall steps every day make the biggest change. Open Health365 today, check your plan and log one meal. We're here when you need us.\n\nOpen the app: https://www.thehealth365.in/app",
  },
  { key: "custom", label: "Write my own", subject: "", body: "Hi {name},\n\n" },
];

export const fillUserMessage = (s: string, name: string) => s.replace(/\{name\}/g, (name || "there").trim().split(/\s+/)[0]);
