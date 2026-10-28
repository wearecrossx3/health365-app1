// Ready-made emails the team can send to users from Admin › Users.
// {name} becomes the user's first name.
export const USER_MESSAGES: { key: string; label: string; subject: string; body: string }[] = [
  {
    key: "welcome", label: "Welcome", subject: "Welcome to Health365 🌿",
    body: "Hi {name}, welcome to Health365!\n\nYour desi diet plan is waiting in the app. Open it, tell us your goal, and get a plan built around the food you already eat at home.\n\nGet the app: https://www.thehealth365.in/app",
  },
  {
    key: "plan", label: "Your plan is ready", subject: "Your diet plan is ready ✅",
    body: "Hi {name}, your dietitian has added your diet plan in the Health365 app.\n\nOpen the app to see it. If you have any question about it, message your dietitian in the app.",
  },
  {
    key: "consult", label: "Book a dietitian", subject: "Talk to a real dietitian",
    body: "Hi {name}, want a plan made just for you?\n\nBook a consultation with a Health365 dietitian right inside the app. Chat with them, share your reports, and get your personal plan.\n\nOpen the app: https://www.thehealth365.in/app",
  },
  {
    key: "missyou", label: "We miss you", subject: "We miss you, {name} 👋",
    body: "Hi {name}, it's been a while!\n\nSmall steps every day make the biggest change. Open Health365 today, check your plan and log one meal. We're here when you need us.\n\nOpen the app: https://www.thehealth365.in/app",
  },
  { key: "custom", label: "Write my own", subject: "", body: "Hi {name},\n\n" },
];

export const fillUserMessage = (s: string, name: string) => s.replace(/\{name\}/g, (name || "there").trim().split(/\s+/)[0]);
