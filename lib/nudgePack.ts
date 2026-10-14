// Health365 "fun pack" — playful nudges in the style of Indian food-delivery
// apps. Admin → App Notifications → "Add fun pack" merges these into the list
// (existing nudges are kept; ids starting with "fp" are never duplicated).
// Each entry: [title, message, audience?]  (audience defaults to "all").

type Row = [string, string, string?];

const ROWS: Row[] = [
  // ── water ──────────────────────────────────────────────
  ["Paani se pyaar kab hoga? 💧", "Your water bottle has been waiting since morning. Show it some love."],
  ["Hydration check ✅", "Pee colour = pale lemonade? Great. Apple juice? Drink a glass now."],
  ["Glass half full 🥛", "Optimists drink the other half too. Go on."],
  ["Thirsty or hungry? 🤔", "Half the time it's thirst in disguise. Water first, snack later."],
  ["Water you doing? 💦", "Not drinking water, apparently. Let's fix that in 10 seconds."],
  ["AC mein bhi pyaas lagti hai ❄️", "Air-conditioned rooms dry you out quietly. Sip, sip, hooray."],
  ["Paani break ⏱️", "One glass now = one less headache at 4 pm. Fair deal?"],
  ["Your kidneys called 📞", "They said 'thank you in advance' for the next glass of water."],
  ["Bottle ko bhi friend chahiye 🍶", "Refill it, keep it on the desk, finish it by lunch."],
  ["Nimbu paani o'clock 🍋", "Water + lemon + a pinch of salt. No sugar needed. Refreshing!"],
  ["Mission: 8 glasses 🎯", "Tap + in the app every time you drink. Watch the tile fill up."],
  ["Garmi ho ya sardi 🌦️", "Your body needs water in every season. Glass up!"],
  ["Coconut water > cola 🥥", "Natural electrolytes, zero fizz drama."],
  ["Chaas time 🥛", "Masala chaas after lunch: cooling, gut-friendly and full of flavour."],
  ["Plot twist 💧", "That 3 pm slump might just be dehydration. Drink up and see."],

  // ── chai / coffee ──────────────────────────────────────
  ["Chai pe charcha? ☕", "Sure — but maybe half a spoon of sugar this time?"],
  ["Cutting chai, cutting sugar ✂️", "Small cup, less sugar, same happiness."],
  ["3rd chai of the day? 👀", "We're not judging. Okay, a little. Water this time?"],
  ["Biscuit ko bolo bye 🍪", "Chai is better with roasted chana or makhana anyway."],
  ["Coffee after 4 pm? 😴", "Your sleep would like a word. Try herbal tea instead."],
  ["Adrak wali chai 🫚", "Ginger gives the kick. Let sugar take the day off."],
  ["Green tea era 🍵", "No milk, no sugar, all the vibes."],
  ["Doodh patti update 🥛", "Low-fat milk in chai = same taste, fewer calories."],

  // ── breakfast ──────────────────────────────────────────
  ["Breakfast skip? Not on our watch 🍳", "Poha, upma, idli or eggs — pick one and start strong."],
  ["Good morning, sunshine ☀️", "A breakfast with protein keeps the 11 am samosa thoughts away."],
  ["Poha with peanuts? 🥜", "Add a handful of sprouts or peas too. Upgrade unlocked."],
  ["Idli > 'I'll eat later' 🍥", "Two idlis + sambar = a breakfast that actually fills you."],
  ["Paratha morning? 🫓", "Less ghee on top, more curd on the side. Balance!"],
  ["Besan chilla, hero of mornings 🦸", "High protein, quick to make, endlessly customisable."],
  ["Oats? Make them desi 🥣", "Masala oats with veggies — breakfast that doesn't feel like homework."],
  ["Eggcellent idea 🥚", "Two boiled eggs + toast. Done in 10 minutes."],
  ["Thepla + dahi = love 💚", "Gujarati breakfast goals. Light on oil, heavy on taste."],
  ["Did you tick breakfast? ✅", "Streaks start with the first meal of the day."],

  // ── lunch / thali ──────────────────────────────────────
  ["Thali assemble! 🍱", "Dal, sabzi, roti, salad, curd — the Avengers of lunch."],
  ["Lunch is calling 📞", "Don't put it on hold till 4 pm. Eat on time, snack less."],
  ["Salad first, then the rest 🥗", "Kheera, gajar, tamatar on the plate before the roti arrives."],
  ["Rice lover? 🍚", "One katori rice + big katori dal = happy you, happy sugar levels."],
  ["Roti count check 🫓", "Two rotis + a full katori of sabzi beats four rotis + a spoon of sabzi."],
  ["Dal ko ignore mat karo 💛", "It's your daily protein. Thick dal > watery dal."],
  ["Office lunch? 💼", "Tiffin from home beats the canteen 9 days out of 10."],
  ["Rajma chawal Sunday? 😋", "Go for it — add salad and keep the rice to one katori."],
  ["Curd = cool 🥣", "A bowl of dahi with lunch keeps the gut happy."],
  ["Sabzi ka size badhao 🥦", "Half your plate vegetables. The other half can relax."],

  // ── snacks ─────────────────────────────────────────────
  ["4 pm hunger detected 🚨", "Roasted chana, makhana or a fruit. Not the samosa. We saw that."],
  ["Snack attack incoming 🥨", "Roasted chana > namkeen. Same crunch, more protein."],
  ["Makhana, the snack with a glow-up ✨", "Roast with a pinch of salt and pepper. Pop like popcorn."],
  ["Bhel, but make it healthy 🥗", "Puffed rice, sprouts, onion, tomato, lemon. Skip the extra sev."],
  ["Chips ka packet chhupa do 🙈", "Out of sight, out of mouth. Fruit bowl on the table instead."],
  ["Peanut power 🥜", "A small handful = protein + good fats. Small handful, okay?"],
  ["Samosa ya sprouts? 🤨", "One of these fills you up for 3 hours. Hint: not the samosa."],
  ["Corn chaat time 🌽", "Boiled corn + lemon + chaat masala. Street-food taste, home-made health."],
  ["Fruit chaat > fruit juice 🍎", "Keep the fibre. Sprinkle chaat masala for fun."],
  ["Dhokla break 💛", "Steamed, light, and Gujarat-approved."],
  ["Biscuit packets are sneaky 🍪", "Five 'small' biscuits = a full roti's worth. Count them."],
  ["Kuch meetha? 🍫", "Two dates or a small piece of gur. Craving solved."],

  // ── dinner / night ─────────────────────────────────────
  ["Dinner before 8? 🍽️", "An early, light dinner = lighter mornings."],
  ["Khichdi night 🍲", "Comfort food that's kind to your stomach. Add veggies!"],
  ["Late-night fridge raid? 🌙", "The fridge light is not a spotlight. Go back to bed."],
  ["Soup-er idea 🥣", "A bowl of veg soup before dinner helps you eat just right."],
  ["Netflix + snacks? 📺", "Pre-portion the bowl. Bottomless bags are a trap."],
  ["Haldi doodh tonight? 🌙", "A warm, light end to the day helps you sleep better."],
  ["10-minute walk? 🚶", "A short walk after dinner keeps sugar spikes calmer. Shoes on?"],
  ["Midnight Maggi? 🍜", "Your stomach is trying to sleep. Let it."],
  ["Sleep is a nutrient too 😴", "7–8 hours of sleep means fewer cravings tomorrow. Phone down?"],

  // ── fruits & veggies ───────────────────────────────────
  ["Fruit > juice 🍊", "Whole fruit keeps the fibre. Juice keeps only the sugar."],
  ["An apple a day... 🍎", "...keeps the 'what should I snack on' question away."],
  ["Kela power 🍌", "Quick energy before a walk or workout. Nature's energy bar."],
  ["Papaya appreciation post 🧡", "Great for digestion and tastes like sunshine."],
  ["Seasonal = sensible 🍈", "Eat the fruit of the season — fresher, cheaper, tastier."],
  ["Eat the rainbow 🌈", "Red tomato, green palak, orange gajar. Your plate wants colour."],
  ["Palak paneer > paneer butter masala 💚", "Same paneer, way more iron, way less butter."],
  ["Lauki ki sabzi called 📞", "It's light, it's cooling, and it misses you."],
  ["Bhindi without the oil bath 🫒", "Dry-roast it in a pan — still crispy, way lighter."],
  ["Sprouts ka scene 🌱", "Moong sprouts + onion + lemon = 5-minute protein salad."],

  // ── protein ────────────────────────────────────────────
  ["Thoda protein add karo 💪", "Dal, paneer, curd, sprouts or eggs — one in every meal."],
  ["Paneer is not a dessert 🧀", "But it's still delicious. Grill it, don't fry it."],
  ["Protein in every plate 🍽️", "Ask yourself at each meal: where's the dal/paneer/egg/curd?"],
  ["Chana masala appreciation 🤎", "Fibre + protein in one katori. Underrated legend."],
  ["Soya chunks = protein bomb 💣", "Add to pulao or sabzi. Your muscles will send a thank-you card."],
  ["Greek yogurt, desi style 🥣", "Hung curd with cucumber and jeera. Raita, but stronger."],

  // ── sweets & cravings ──────────────────────────────────
  ["Sweet craving? 🍯", "Try 2 dates or a small piece of jaggery instead of mithai."],
  ["Gulab jamun is calling 📞", "Answer it once a week, not once a day. Deal?"],
  ["Festival season mode 🪔", "One sweet, savoured slowly > five sweets, eaten standing."],
  ["Ice cream emergency? 🍨", "Small cup, not family pack. Spoon it slowly."],
  ["Chocolate? Go dark 🍫", "Two squares of dark chocolate. Not the whole bar, champ."],
  ["Mithai box spotted 👀", "Pick your favourite one. Close the box. Walk away. Legend."],
  ["Sugar in disguise 🕵️", "Packaged juice, ketchup, flavoured yogurt — check the label."],

  // ── oil, ghee, salt ────────────────────────────────────
  ["Ghee ka hisaab 🧈", "One teaspoon is ~45 kcal. Use it, just measure it."],
  ["Tadka with a teaspoon 🥄", "Measure the oil — the flavour stays, the extra calories go."],
  ["Namak thoda kam 🧂", "Your BP will thank you. Lemon and spices add flavour instead."],
  ["Pakode ka mausam? 🌧️", "Air-fry or bake a few. Rain still feels romantic, promise."],
  ["Reuse oil? Nope 🙅", "Fresh oil for every fry. Old oil is not a family heirloom."],

  // ── millets & grains ───────────────────────────────────
  ["Millet day! 🌾", "Bajra, jowar or ragi rotla today? Your gut will love the fibre."],
  ["Ragi is the new cool 😎", "Ragi dosa, ragi roti, ragi malt. Calcium included."],
  ["Bajra rotla + gud = winter love ❄️", "Desi, filling and perfect for cold mornings."],
  ["Brown rice? Hmm 🤔", "Or just less white rice + more dal. Both work!"],
  ["Multigrain atta upgrade 🫓", "Mix a little jowar or bajra into your roti atta."],

  // ── movement ───────────────────────────────────────────
  ["Uth jao, chal lo 🚶", "Been sitting for an hour? 5-minute walk. The chair will wait."],
  ["Stairs > lift 🪜", "Free gym, no membership, available in every building."],
  ["Phone call = walking call 📱", "Next time someone calls, pace around. Steps unlocked."],
  ["Garba practice counts 💃", "So does dancing in your room. Move your body today!"],
  ["Sunlight + walk combo ☀️", "10 minutes of morning sun = vitamin D + better mood."],
  ["Stretch break 🧘", "Shoulders up, shoulders down. Neck left, neck right. Ahh."],
  ["Walk after meals 🚶‍♀️", "Even 10 minutes helps your body handle the food better."],

  // ── app / plan / streak ────────────────────────────────
  ["Your plan misses you 🥺", "Today's meals are ready in Health365. One tap away."],
  ["Streak alert 🔥", "Don't let the flame die! Tick today's meals."],
  ["Check today's plan 📋", "Your Health365 plan for today is one tap away."],
  ["Lunch plan ready 🍱", "Your thali is waiting in the app. Tap to see today's lunch."],
  ["Did you eat it or just think about it? 🤔", "Tick it in the app so your calories add up right."],
  ["Scan your plate 📸", "Not sure about calories? Snap your thali in the Track tab."],
  ["Weigh-in Sunday ⚖️", "Same time, same scale, no stress. Log it in the app."],
  ["Swap karna hai? 🔁", "Don't like today's dinner? Tap swap in your plan."],
  ["Water tile looking empty 💧", "Tap + every time you drink. Watch it fill up!"],
  ["You've been gone a while 👋", "No guilt, no pressure. Open the app and start with today."],
  ["Small wins count 🏆", "Ate one healthy meal today? That's a win. Log it!"],
  ["Progress, not perfection 🌱", "One good choice today is better than a perfect plan tomorrow."],

  // ── funny / Zomato-ish ─────────────────────────────────
  ["We need to talk 💔", "...about the 3 samosas yesterday. Just kidding. Have a great day!"],
  ["Breaking news 📰", "Local human drinks water, feels amazing. More at 11."],
  ["Roses are red 🌹", "Violets are blue, sprouts are healthy, and so are you."],
  ["Knock knock 🚪", "Who's there? Dal. Dal who? Dal-icious and full of protein!"],
  ["Not a diet, a vibe ✨", "Eat good food, move a little, sleep well. Repeat."],
  ["Sabzi said hi 👋", "It's been waiting on your plate since 1 pm. Don't ghost it."],
  ["Plot twist 🎬", "The 'healthy' granola bar has more sugar than a gulab jamun. Check labels!"],
  ["Your tummy is texting 📩", "'Bhai thoda fibre bhej do.' Salad, fruit or dal will do."],
  ["Ctrl + Alt + Eat right ⌨️", "Restart your day with a good next meal."],
  ["Main hoon na 🫶", "Your plan is here to help, not to judge. Tap in anytime."],
  ["Kya scene hai? 😎", "Lunch done? Water done? Walk done? Two out of three is great too."],
  ["Mood: kheera 🥒", "Cool, crunchy and 95% water. Be like kheera."],
  ["Hello from your plate 🥗", "Your salad has been waiting patiently. It's crunchy and it believes in you."],
  ["Seen ✔✔ no reply 😤", "Your water bottle, every day. Reply with a sip."],
  ["Sharma ji ka beta drinks 3L water 💧", "You can too. We believe in you."],
  ["Today's horoscope 🔮", "A healthy lunch is in your future. Also, drink water."],
  ["Main character energy 🌟", "Main characters eat breakfast. Just saying."],
  ["Swiggy-Zomato withdrawal? 🛵", "Make a quick masala omelette or veg sandwich at home. 10 minutes!"],
  ["Weekend chhe? 🎉", "Enjoy it — just keep one meal light and one walk long."],
  ["Monday motivation 💪", "New week, same goal. Let's start with a good breakfast."],
  ["Friday feeling 🕺", "Party plans? Eat a proper meal before you go out."],
  ["Sunday reset ☀️", "Plan the week's tiffin today. Future you says thanks."],
  ["Wedding season? 💍", "Start with salad and soup at the buffet, then pick your favourites."],
  ["Mummy ke haath ka khana 🫶", "Home food is the original health plan. Eat it with love."],
  ["Late for office? ⏰", "Grab a banana and a handful of peanuts. Better than nothing!"],

  // ── conditions & audiences ─────────────────────────────
  ["Sugar levels calm rakho 🩸", "Pair carbs with protein — rice with dal, roti with sabzi.", "diabetes"],
  ["Diabetes-friendly swap 🔁", "Swap white rice for millet roti once a day.", "diabetes"],
  ["Walk after meals 🚶", "A 10-minute walk after eating helps blood sugar stay steadier.", "diabetes"],
  ["Fruit, but smart 🍎", "Whole fruit with a few nuts, not on an empty stomach.", "diabetes"],
  ["PCOS tip 🌸", "Steady meals every 3–4 hours help keep energy and cravings even.", "pcos"],
  ["Protein first 🌸", "Start meals with dal, paneer, eggs or sprouts — then carbs.", "pcos"],
  ["Move a little, daily 🌸", "Even a 20-minute walk counts. Consistency beats intensity.", "pcos"],
  ["Thyroid tip 🦋", "Take your tablet first, breakfast 30–45 minutes later.", "thyroid"],
  ["Thyroid & coffee ☕", "Wait a while after your tablet before chai or coffee.", "thyroid"],
  ["Heart-smart swap ❤️", "Grill, roast or steam today instead of deep-frying.", "cholesterol"],
  ["Oats for the heart 💓", "A bowl of masala oats a few times a week is a good habit.", "cholesterol"],
  ["Gut feeling 🌿", "Curd or chaas with lunch keeps digestion happy.", "digestive"],
  ["Ajwain magic ✨", "Heavy meal? A pinch of ajwain or a cup of jeera water helps.", "digestive"],
  ["Chew, chew, chew 😬", "Eating slowly is the cheapest digestion upgrade.", "digestive"],
  ["Talk to a dietitian 👩‍⚕️", "Questions about your plan? Book a 1:1 consultation in the app.", "account"],
  ["Your dietitian is one tap away 🩺", "Real advice for your real kitchen. Book in the Consult tab.", "account"],
  ["Make it yours ✨", "Create a free account to save your plan and progress.", "guest"],
  ["Don't lose your streak 🔥", "Make a free account so your progress is backed up.", "guest"],
];

export const FUN_PACK = ROWS.map(([title, body, audience], i) => ({
  id: `fp${String(i + 1).padStart(3, "0")}`,
  title,
  body,
  audience: audience || "all",
  enabled: true,
}));
