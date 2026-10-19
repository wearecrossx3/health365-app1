// Ready-made professional messages for the dietitian chat. {c} = client's
// first name, {d} = dietitian's name. Tapping one puts it in the message box
// so the dietitian can edit before sending.
export type Lang = "en" | "hi" | "gu";
export const TPL: { g: string; t: Record<Lang, string> }[] = [
  { g: "Welcome", t: {
    en: "Hello {c}, I'm {d}, your Health365 dietitian. Thank you for booking your consultation. I've gone through your form — let's get started. 🌿",
    hi: "नमस्ते {c}, मैं {d}, आपकी Health365 डाइटिशियन हूँ। कंसल्टेशन बुक करने के लिए धन्यवाद। मैंने आपका फॉर्म देख लिया है — चलिए शुरू करते हैं। 🌿",
    gu: "નમસ્તે {c}, હું {d}, તમારી Health365 ડાયટિશિયન છું. કન્સલ્ટેશન બુક કરવા બદલ આભાર. મેં તમારું ફોર્મ જોઈ લીધું છે — ચાલો શરૂ કરીએ. 🌿" } },
  { g: "Welcome", t: {
    en: "Before we begin, please share your recent reports (sugar, thyroid, lipid profile, etc.) as photos here. 📄",
    hi: "शुरू करने से पहले, कृपया अपनी हाल की रिपोर्ट (शुगर, थायरॉइड, लिपिड प्रोफाइल आदि) की फोटो यहाँ भेजें। 📄",
    gu: "શરૂ કરતા પહેલાં, કૃપા કરી તમારા તાજેતરના રિપોર્ટ (સુગર, થાઇરોઇડ, લિપિડ પ્રોફાઇલ વગેરે) ના ફોટા અહીં મોકલો. 📄" } },
  { g: "Welcome", t: {
    en: "Could you tell me what you usually eat in a day — breakfast, lunch, evening snack and dinner, with rough timings?",
    hi: "क्या आप बता सकते हैं कि आप दिन में आमतौर पर क्या खाते हैं — नाश्ता, दोपहर का खाना, शाम का नाश्ता और रात का खाना, लगभग समय के साथ?",
    gu: "તમે સામાન્ય રીતે દિવસમાં શું ખાઓ છો તે જણાવશો — નાસ્તો, બપોરનું જમવાનું, સાંજનો નાસ્તો અને રાતનું જમવાનું, આશરે સમય સાથે?" } },
  { g: "Diet plan", t: {
    en: "Hi {c}, your personalised diet plan is ready ✅ Please open the Plan tab in the Health365 app. Follow it for 7 days and tell me how you feel.",
    hi: "नमस्ते {c}, आपका पर्सनल डाइट प्लान तैयार है ✅ कृपया Health365 ऐप में Plan टैब खोलें। 7 दिन इसे फॉलो करें और बताएं कि आप कैसा महसूस कर रहे हैं।",
    gu: "નમસ્તે {c}, તમારો પર્સનલ ડાયટ પ્લાન તૈયાર છે ✅ કૃપા કરી Health365 એપમાં Plan ટેબ ખોલો. 7 દિવસ તેને ફોલો કરો અને જણાવો કે તમને કેવું લાગે છે." } },
  { g: "Diet plan", t: {
    en: "I've updated your diet plan based on your feedback. Please check the Plan tab — the changes start from today.",
    hi: "आपके फीडबैक के आधार पर मैंने आपका डाइट प्लान अपडेट कर दिया है। कृपया Plan टैब देखें — बदलाव आज से लागू हैं।",
    gu: "તમારા ફીડબેક પ્રમાણે મેં તમારો ડાયટ પ્લાન અપડેટ કર્યો છે. કૃપા કરી Plan ટેબ જુઓ — ફેરફાર આજથી લાગુ છે." } },
  { g: "Follow-up", t: {
    en: "Hi {c}, just checking in — how is the plan going? Any difficulty with meals, hunger or timings?",
    hi: "नमस्ते {c}, बस हालचाल जानना था — प्लान कैसा चल रहा है? खाने, भूख या समय में कोई परेशानी?",
    gu: "નમસ્તે {c}, ખાલી ખબર પૂછું છું — પ્લાન કેવો ચાલે છે? જમવામાં, ભૂખમાં કે સમયમાં કોઈ તકલીફ?" } },
  { g: "Follow-up", t: {
    en: "Please share your current weight and how your energy and sleep have been this week. ⚖️",
    hi: "कृपया अपना अभी का वज़न बताएं और इस हफ्ते आपकी एनर्जी और नींद कैसी रही। ⚖️",
    gu: "કૃપા કરી તમારું હાલનું વજન જણાવો અને આ અઠવાડિયે તમારી એનર્જી અને ઊંઘ કેવી રહી. ⚖️" } },
  { g: "Follow-up", t: {
    en: "Great progress, {c}! Keep going — consistency is what brings results. 💪",
    hi: "बहुत बढ़िया प्रगति, {c}! ऐसे ही जारी रखें — नियमितता से ही रिज़ल्ट आता है। 💪",
    gu: "ખૂબ સરસ પ્રગતિ, {c}! આમ જ ચાલુ રાખો — નિયમિતતાથી જ પરિણામ આવે છે. 💪" } },
  { g: "Follow-up", t: {
    en: "A gentle reminder: drink 8–10 glasses of water and walk for 20–30 minutes today. 💧",
    hi: "एक छोटा सा रिमाइंडर: आज 8–10 गिलास पानी पिएं और 20–30 मिनट चलें। 💧",
    gu: "નાનું રિમાઇન્ડર: આજે 8–10 ગ્લાસ પાણી પીવો અને 20–30 મિનિટ ચાલો. 💧" } },
  { g: "Thank you", t: {
    en: "Thank you for consulting with Health365, {c}. It was a pleasure helping you. You can message me here anytime in the next 30 days. 🙏",
    hi: "Health365 के साथ कंसल्ट करने के लिए धन्यवाद, {c}। आपकी मदद करके अच्छा लगा। अगले 30 दिनों में आप कभी भी यहाँ मैसेज कर सकते हैं। 🙏",
    gu: "Health365 સાથે કન્સલ્ટ કરવા બદલ આભાર, {c}. તમારી મદદ કરીને આનંદ થયો. આવતા 30 દિવસમાં તમે ગમે ત્યારે અહીં મેસેજ કરી શકો છો. 🙏" } },
  { g: "Thank you", t: {
    en: "Your follow-up is due. Whenever you're ready, you can book your next consultation from the Health365 app.",
    hi: "आपका फॉलो-अप ड्यू है। जब भी आप तैयार हों, Health365 ऐप से अगला कंसल्टेशन बुक कर सकते हैं।",
    gu: "તમારું ફોલો-અપ બાકી છે. તમે તૈયાર હો ત્યારે Health365 એપમાંથી આગળનું કન્સલ્ટેશન બુક કરી શકો છો." } },
  { g: "Thank you", t: {
    en: "Thank you for your message. I'll go through it and reply in detail shortly.",
    hi: "आपके मैसेज के लिए धन्यवाद। इसे देखकर जल्द ही विस्तार से जवाब भेजा जाएगा।",
    gu: "તમારા મેસેજ બદલ આભાર. હું તે જોઈને થોડી વારમાં વિગતવાર જવાબ આપીશ." } },
];
export const fillTpl = (s: string, c: string, d: string) => s.replace(/\{c\}/g, c || "there").replace(/\{d\}/g, d || "your dietitian");
