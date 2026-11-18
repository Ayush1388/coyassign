/**
 * Seed data. SERVER-ONLY.
 * - `likesYou` is private demo data. It becomes a LIKE row in `swipes` (profile -> me),
 *   is never stored on the profile, and is never sent to the client.
 * - `lat`/`lng` are private. They are used only to compute a coarse distance band on the server.
 */
export type SeedProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  college?: string;
  bio: string;
  interests: string[];
  prompt: [question: string, answer: string];
  verified: boolean;
  lat: number;
  lng: number;
  likesYou: boolean;
  intent: string;
  drinking: string;
  smoking: string;
  workout: string;
  languages: string[];
};

/** The logged-in user: Connaught Place, New Delhi. */
export const SELF = {
  id: "me",
  name: "You",
  age: 21,
  city: "Connaught Place, Delhi",
  college: "Delhi University",
  bio: "",
  interests: ["Coffee", "Indie music", "Photography", "Trekking", "Street food", "Books", "Cooking"],
  verified: true,
  lat: 28.6315,
  lng: 77.2167,
  intent: "long_open",
  drinking: "socially",
  smoking: "no",
  workout: "sometimes",
  languages: ["English", "Hindi"],
};

type Raw = Omit<SeedProfile, "id" | "intent" | "drinking" | "smoking" | "workout" | "languages">;

const raw: Raw[] = [
  { name: "Ananya", age: 21, city: "Lajpat Nagar, Delhi", college: "Lady Shri Ram College", bio: "Will judge you (lovingly) by your chai order. Currently learning to make sourdough and failing.", interests: ["Indie music", "Baking", "Thrifting", "Coffee"], prompt: ["A perfect Sunday", "Thrifting in Sarojini, then chole bhature that I didn't plan for."], verified: true, lat: 28.5677, lng: 77.2433, likesYou: true },
  { name: "Kabir", age: 23, city: "Bengaluru", college: "IISc", bio: "PhD student by day, open-mic regular by night. Ask me about black holes or bad puns.", interests: ["Astronomy", "Stand-up", "Cycling", "Books"], prompt: ["I geek out on", "Why the night sky is dark. It's a better story than you think."], verified: true, lat: 12.9716, lng: 77.5946, likesYou: true },
  { name: "Ishita", age: 22, city: "Mumbai", college: "St. Xavier's College", bio: "Marine Drive sunsets over everything. Looking for someone to split vada pav and long walks with.", interests: ["Photography", "Poetry", "Street food"], prompt: ["Green flag I look for", "You text back the meme, not just 'haha'."], verified: false, lat: 19.076, lng: 72.8777, likesYou: false },
  { name: "Arjun", age: 24, city: "Cyber City, Gurugram", bio: "Product designer who keeps a plant alive purely out of spite. Weekend treks are non-negotiable.", interests: ["Trekking", "Design", "Plants", "Coffee"], prompt: ["Together, we could", "Do Triund at sunrise and argue about the best Maggi point."], verified: true, lat: 28.495, lng: 77.089, likesYou: true },
  { name: "Meera", age: 20, city: "Chennai", college: "IIT Madras", bio: "Carnatic vocalist, competitive coder, filter coffee snob. Yes, all three at once.", interests: ["Music", "Coding", "Coffee"], prompt: ["Unpopular opinion", "Filter coffee > every café latte in this country."], verified: true, lat: 13.0827, lng: 80.2707, likesYou: false },
  { name: "Rohan", age: 22, city: "Hauz Khas, Delhi", college: "IIT Delhi", bio: "Building a startup nobody understands yet. Will cook you the best rajma chawal of your life.", interests: ["Startups", "Cooking", "Football"], prompt: ["The way to win me over", "Pretend to understand my pitch deck. Then actually ask a question."], verified: false, lat: 28.5494, lng: 77.2001, likesYou: false },
  { name: "Sana", age: 23, city: "Khan Market, Delhi", bio: "Architect. I notice fonts on restaurant menus and will point them out. Biryani diplomat.", interests: ["Architecture", "Typography", "Street food", "Books"], prompt: ["Best spot in the city", "Lodhi Garden at 7am. The tombs, no crowds, one cutting chai."], verified: true, lat: 28.6, lng: 77.227, likesYou: true },
  { name: "Vihaan", age: 21, city: "Manipal", college: "Manipal Institute of Technology", bio: "Drummer in a band that has played exactly two gigs. Beach volleyball is my cardio.", interests: ["Drums", "Volleyball", "Gaming"], prompt: ["My most irrational fear", "Running out of phone battery at a gig."], verified: false, lat: 13.3525, lng: 74.7928, likesYou: false },
  { name: "Tara", age: 22, city: "Goa", bio: "Surf instructor in season, illustrator off-season. I will draw you as a cat.", interests: ["Surfing", "Illustration", "Cats"], prompt: ["Typical Sunday", "Dawn surf, long lunch, sketching whoever falls asleep first."], verified: true, lat: 15.4909, lng: 73.8278, likesYou: false },
  { name: "Dev", age: 25, city: "Golf Course Road, Gurugram", bio: "Consultant who actually reads the fine print. Weekend Formula 1 and biryani rituals.", interests: ["F1", "Running", "Cooking"], prompt: ["I'm looking for", "Someone who'll come to a 6am run and then a 10am brunch."], verified: true, lat: 28.4595, lng: 77.097, likesYou: true },
  { name: "Riya", age: 21, city: "Chanakyapuri, Delhi", college: "Jesus and Mary College", bio: "Debate team captain. I'll argue either side of anything, including pineapple on pizza.", interests: ["Debating", "Theatre", "Books"], prompt: ["Let's debate", "Is a hot dog a sandwich? I'll take whichever side you don't."], verified: true, lat: 28.596, lng: 77.187, likesYou: false },
  { name: "Aditya", age: 24, city: "Greater Kailash, Delhi", bio: "Film editor. I cry at ads. My Letterboxd is more honest than my diary.", interests: ["Film", "Jazz", "Photography"], prompt: ["A film everyone should see", "Lunchbox. Then we can talk about letters."], verified: false, lat: 28.5482, lng: 77.234, likesYou: false },
  { name: "Zoya", age: 20, city: "Jamia Nagar, Delhi", college: "Jamia Millia Islamia", bio: "Calligraphy, karaoke and too many browser tabs. Let's find the city's best kebab.", interests: ["Calligraphy", "Karaoke", "Street food"], prompt: ["Best food in Delhi", "Galouti at Zakir Nagar. Fight me (respectfully)."], verified: true, lat: 28.5616, lng: 77.28, likesYou: true },
  { name: "Kunal", age: 23, city: "Jaipur", bio: "Hotelier in training. I know every rooftop café in the Pink City. Ask me for a tour.", interests: ["Travel", "Hospitality", "Cricket"], prompt: ["Together, we could", "Watch the sunset from Nahargarh and pretend we're in a film."], verified: false, lat: 26.9124, lng: 75.7873, likesYou: false },
  { name: "Aisha", age: 22, city: "Mayur Vihar, Delhi", bio: "Psych major who will not psychoanalyse you on the first date. Probably.", interests: ["Psychology", "Dance", "Podcasts", "Coffee"], prompt: ["My love language is", "Sending you a podcast episode with a timestamp."], verified: true, lat: 28.6086, lng: 77.295, likesYou: false },
  { name: "Nikhil", age: 24, city: "Hauz Khas Village, Delhi", bio: "Chef at a tiny bistro. Love language: feeding people. Hate language: soggy fries.", interests: ["Cooking", "Motorbikes", "Trekking"], prompt: ["The way to win me over", "Eat the last bite. Tell me honestly if it needs salt."], verified: true, lat: 28.5535, lng: 77.194, likesYou: true },
  { name: "Diya", age: 21, city: "Ahmedabad", college: "NID", bio: "Textile design student. My wardrobe is 80% things I made and 20% things I regret.", interests: ["Textiles", "Garba", "Art"], prompt: ["I'm weirdly good at", "Guessing thread count by touch."], verified: false, lat: 23.0225, lng: 72.5714, likesYou: false },
  { name: "Aryan", age: 22, city: "North Campus, Delhi", college: "SRCC", bio: "Economics nerd with a vinyl collection. I make playlists for every mood, including 'Monday'.", interests: ["Vinyl", "Indie music", "Basketball"], prompt: ["Song stuck in my head", "Something by Prateek Kuhad, as usual."], verified: true, lat: 28.688, lng: 77.21, likesYou: false },
  { name: "Kavya", age: 23, city: "Kochi", bio: "Marine biologist. Will tell you fun facts about octopuses whether you asked or not.", interests: ["Ocean", "Scuba", "Books"], prompt: ["Fun fact", "Octopuses have three hearts. I have one, and it likes good books."], verified: true, lat: 9.9312, lng: 76.2673, likesYou: true },
  { name: "Siddharth", age: 25, city: "Sector 62, Noida", bio: "Backend engineer. I like my queries indexed and my dosas crispy. Weekend potter.", interests: ["Pottery", "Coding", "Board games", "Coffee"], prompt: ["Ideal first date", "A pottery class. Worst bowl pays for coffee."], verified: false, lat: 28.627, lng: 77.372, likesYou: false },
  { name: "Pooja", age: 22, city: "Dwarka, Delhi", college: "National Law University Delhi", bio: "Law student. I read terms and conditions for fun. Badminton at 6am, who's in?", interests: ["Law", "Badminton", "True crime"], prompt: ["Green flag I look for", "You read the whole menu before ordering."], verified: true, lat: 28.5921, lng: 77.046, likesYou: false },
  { name: "Ritvik", age: 21, city: "Kharagpur", college: "IIT Kharagpur", bio: "Robotics club, quizzing club, eating-maggi-at-3am club. Founding member of all three.", interests: ["Robotics", "Quizzing", "Anime"], prompt: ["Quiz me on", "Anything from 2000s Bollywood. Anything."], verified: false, lat: 22.346, lng: 87.232, likesYou: true },
  { name: "Nandini", age: 24, city: "Karol Bagh, Delhi", bio: "Copywriter. I write taglines for a living and still can't write this bio. Hi.", interests: ["Writing", "Yoga", "Books", "Coffee"], prompt: ["My simple pleasures", "A new notebook. The first page stays empty for weeks."], verified: true, lat: 28.6519, lng: 77.1909, likesYou: false },
  { name: "Yash", age: 23, city: "Paharganj, Delhi", bio: "Photographer chasing golden hour across the country. Poha connoisseur.", interests: ["Photography", "Road trips", "Street food"], prompt: ["Together, we could", "Shoot Old Delhi rooftops at golden hour, then parathas."], verified: true, lat: 28.6448, lng: 77.2167, likesYou: false },
  { name: "Simran", age: 22, city: "AIIMS, Delhi", college: "AIIMS Delhi", bio: "Med student. My hands are steady, my sleep schedule is not. Bhangra is my therapy.", interests: ["Medicine", "Bhangra", "Baking", "Cooking"], prompt: ["Typical Sunday", "Sleep. Then bake something to apologise to my roommates."], verified: true, lat: 28.5672, lng: 77.21, likesYou: true },
  { name: "Harsh", age: 24, city: "Sector 18, Noida", bio: "Game developer. I'll beat you at FIFA and then let you win at Ludo to be nice.", interests: ["Game dev", "FIFA", "Sci-fi"], prompt: ["I'm looking for", "A player two. Literally and figuratively."], verified: false, lat: 28.5708, lng: 77.326, likesYou: false },
  { name: "Leela", age: 21, city: "Vasant Kunj, Delhi", bio: "Bharatanatyam since I was five, rock climbing since last month. Both are hard.", interests: ["Dance", "Climbing", "Museums", "Trekking"], prompt: ["Currently obsessed with", "Bouldering at 9pm. My forearms are filing a complaint."], verified: true, lat: 28.52, lng: 77.158, likesYou: false },
  { name: "Neil", age: 25, city: "Goa", bio: "Runs a café with too many dogs. Live music on Fridays. Come for the coffee, stay for the dogs.", interests: ["Coffee", "Dogs", "Guitar", "Indie music"], prompt: ["Best spot in the city", "My café, obviously. Ask for the dog named Biscuit."], verified: true, lat: 15.4909, lng: 73.8278, likesYou: true },
  { name: "Aanya", age: 20, city: "North Campus, Delhi", college: "Miranda House", bio: "Philosophy major. Ask me about free will, or don't. It was always going to happen.", interests: ["Philosophy", "Poetry", "Chess", "Books"], prompt: ["Let's debate", "Is cereal a soup? I have a 12-slide deck."], verified: true, lat: 28.6862, lng: 77.2094, likesYou: false },
  { name: "Raghav", age: 23, city: "Sohna Road, Gurugram", bio: "Data scientist who tracks his biryani consumption in a spreadsheet. It's a lot.", interests: ["Data", "Tennis", "Cooking"], prompt: ["A stat about me", "41 biryanis this year. P-value: not significant enough to stop."], verified: false, lat: 28.4229, lng: 77.0397, likesYou: false },
  { name: "Maya", age: 22, city: "Shillong", bio: "Musician from the rock capital of India. Will make you a mixtape, the old-fashioned way.", interests: ["Guitar", "Trekking", "Indie music"], prompt: ["Together, we could", "Hike to the living root bridges and write a terrible song about it."], verified: true, lat: 25.5788, lng: 91.8933, likesYou: true },
  { name: "Saanvi", age: 21, city: "Vasant Vihar, Delhi", bio: "Weekend birdwatcher, weekday environmental science student. Silence is my favourite sound.", interests: ["Birding", "Photography", "Trekking"], prompt: ["Best spot in the city", "Sanjay Van at dawn. Bring binoculars, not a speaker."], verified: true, lat: 28.5605, lng: 77.1635, likesYou: false },
];

/** Public "looking for", lifestyle and languages per profile: [intent, drinking, smoking, workout, languages]. */
const ATTRS: Record<string, [string, string, string, string, string[]]> = {
  Ananya: ["long_term", "socially", "no", "sometimes", ["English", "Hindi"]],
  Kabir: ["long_open", "rarely", "no", "daily", ["English", "Hindi", "Kannada"]],
  Ishita: ["short_open", "socially", "no", "sometimes", ["English", "Hindi", "Marathi"]],
  Arjun: ["long_term", "rarely", "no", "daily", ["English", "Hindi"]],
  Meera: ["figuring", "never", "no", "sometimes", ["English", "Tamil"]],
  Rohan: ["short_term", "socially", "sometimes", "never", ["English", "Hindi"]],
  Sana: ["long_term", "never", "no", "sometimes", ["English", "Hindi", "Urdu"]],
  Vihaan: ["short_term", "socially", "sometimes", "daily", ["English", "Kannada"]],
  Tara: ["short_open", "socially", "no", "daily", ["English", "Konkani"]],
  Dev: ["long_open", "socially", "no", "daily", ["English", "Hindi", "Punjabi"]],
  Riya: ["friends", "rarely", "no", "sometimes", ["English", "Hindi", "Bengali"]],
  Aditya: ["figuring", "socially", "yes", "never", ["English", "Hindi"]],
  Zoya: ["long_open", "never", "no", "sometimes", ["English", "Hindi", "Urdu"]],
  Kunal: ["short_open", "socially", "no", "sometimes", ["English", "Hindi"]],
  Aisha: ["friends", "rarely", "no", "daily", ["English", "Hindi"]],
  Nikhil: ["long_term", "socially", "no", "daily", ["English", "Hindi", "Punjabi"]],
  Diya: ["figuring", "never", "no", "sometimes", ["English", "Gujarati", "Hindi"]],
  Aryan: ["short_term", "socially", "sometimes", "sometimes", ["English", "Hindi"]],
  Kavya: ["long_term", "rarely", "no", "daily", ["English", "Malayalam"]],
  Siddharth: ["long_open", "rarely", "no", "never", ["English", "Hindi", "Telugu"]],
  Pooja: ["long_term", "never", "no", "daily", ["English", "Hindi"]],
  Ritvik: ["friends", "never", "no", "never", ["English", "Hindi", "Bengali"]],
  Nandini: ["long_open", "socially", "no", "daily", ["English", "Hindi"]],
  Yash: ["short_open", "socially", "sometimes", "sometimes", ["English", "Hindi"]],
  Simran: ["long_term", "rarely", "no", "sometimes", ["English", "Hindi", "Punjabi"]],
  Harsh: ["short_term", "socially", "yes", "never", ["English", "Hindi"]],
  Leela: ["long_open", "never", "no", "daily", ["English", "Hindi", "Kannada"]],
  Neil: ["short_open", "socially", "no", "sometimes", ["English", "Konkani", "Hindi"]],
  Aanya: ["figuring", "rarely", "no", "never", ["English", "Hindi"]],
  Raghav: ["long_term", "rarely", "no", "daily", ["English", "Hindi", "Telugu"]],
  Maya: ["long_open", "socially", "no", "daily", ["English", "Khasi", "Hindi"]],
  Saanvi: ["friends", "never", "no", "daily", ["English", "Hindi", "Kannada"]],
};

export const PROFILES: SeedProfile[] = raw.map((p, i) => {
  const [intent, drinking, smoking, workout, languages] = ATTRS[p.name];
  return { ...p, id: `p${String(i + 1).padStart(2, "0")}`, intent, drinking, smoking, workout, languages };
});

export const photoFor = (id: string) => `/profiles/${id}.jpg`;
/** Two extra "camera roll" shots per profile (placeholder photography, stored locally). */
export const extraPhotosFor = (id: string) => [1, 2].map((n) => `/profiles/more/${id}-${n}.jpg`);
