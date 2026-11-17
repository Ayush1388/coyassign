/**
 * Seed data. SERVER-ONLY: `likesYou` is private demo data and is turned into a
 * LIKE row in `swipes` (profile -> me). It is never stored on the profile itself
 * and never sent to the client.
 */
export type SeedProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  college?: string;
  bio: string;
  interests: string[];
  likesYou: boolean;
};

export const SELF = {
  id: "me",
  name: "You",
  age: 21,
  city: "New Delhi",
  college: "Delhi University",
  bio: "",
  interests: [] as string[],
};

const raw: Omit<SeedProfile, "id">[] = [
  { name: "Ananya", age: 21, city: "New Delhi", college: "Lady Shri Ram College", bio: "Will judge you (lovingly) by your chai order. Currently learning to make sourdough and failing.", interests: ["Baking", "Indie music", "Thrifting"], likesYou: true },
  { name: "Kabir", age: 23, city: "Bengaluru", college: "IISc", bio: "PhD student by day, open-mic regular by night. Ask me about black holes or bad puns.", interests: ["Astronomy", "Stand-up", "Cycling"], likesYou: true },
  { name: "Ishita", age: 22, city: "Mumbai", college: "St. Xavier's College", bio: "Marine drive sunsets > everything. Looking for someone to split vada pav and long walks with.", interests: ["Photography", "Poetry", "Street food"], likesYou: false },
  { name: "Arjun", age: 24, city: "Pune", bio: "Product designer who keeps a plant alive purely out of spite. Weekend treks are non-negotiable.", interests: ["Trekking", "Design", "Plants"], likesYou: true },
  { name: "Meera", age: 20, city: "Chennai", college: "IIT Madras", bio: "Carnatic vocalist, competitive coder, filter coffee snob. Yes, all three at once.", interests: ["Music", "Coding", "Coffee"], likesYou: false },
  { name: "Rohan", age: 22, city: "New Delhi", college: "IIT Delhi", bio: "Building a startup nobody understands yet. Will cook you the best rajma chawal of your life.", interests: ["Startups", "Cooking", "Football"], likesYou: false },
  { name: "Sana", age: 23, city: "Hyderabad", bio: "Architect. I notice fonts on restaurant menus and will point them out. Biryani diplomat.", interests: ["Architecture", "Typography", "Biryani"], likesYou: true },
  { name: "Vihaan", age: 21, city: "Manipal", college: "Manipal Institute of Technology", bio: "Drummer in a band that has played exactly two gigs. Beach volleyball is my cardio.", interests: ["Drums", "Volleyball", "Gaming"], likesYou: false },
  { name: "Tara", age: 22, city: "Goa", bio: "Surf instructor in season, illustrator off-season. I will draw you as a cat.", interests: ["Surfing", "Illustration", "Cats"], likesYou: false },
  { name: "Dev", age: 25, city: "Gurugram", bio: "Consultant who actually reads the fine print. Weekend Formula 1 and biryani rituals.", interests: ["F1", "Finance", "Running"], likesYou: true },
  { name: "Riya", age: 21, city: "Kolkata", college: "Jadavpur University", bio: "Debate team captain. I'll argue either side of anything, including pineapple on pizza.", interests: ["Debating", "Theatre", "Books"], likesYou: false },
  { name: "Aditya", age: 24, city: "Mumbai", bio: "Film editor. I cry at ads. My Letterboxd is more honest than my diary.", interests: ["Film", "Jazz", "Swimming"], likesYou: false },
  { name: "Zoya", age: 20, city: "Delhi", college: "Jamia Millia Islamia", bio: "Calligraphy, karaoke and too many browser tabs. Let's find the city's best kebab.", interests: ["Calligraphy", "Karaoke", "Food walks"], likesYou: true },
  { name: "Kunal", age: 23, city: "Jaipur", bio: "Hotelier in training. I know every rooftop café in the Pink City. Ask me for a tour.", interests: ["Travel", "Hospitality", "Cricket"], likesYou: false },
  { name: "Aisha", age: 22, city: "Bengaluru", college: "Christ University", bio: "Psych major who will not psychoanalyse you on the first date. Probably.", interests: ["Psychology", "Dance", "Podcasts"], likesYou: false },
  { name: "Nikhil", age: 24, city: "Chandigarh", bio: "Chef at a tiny bistro. Love language: feeding people. Hate language: soggy fries.", interests: ["Cooking", "Motorbikes", "Hiking"], likesYou: true },
  { name: "Diya", age: 21, city: "Ahmedabad", college: "NID", bio: "Textile design student. My wardrobe is 80% things I made and 20% things I regret.", interests: ["Textiles", "Garba", "Art"], likesYou: false },
  { name: "Aryan", age: 22, city: "New Delhi", college: "SRCC", bio: "Economics nerd with a vinyl collection. I make playlists for every mood, including 'Monday'.", interests: ["Vinyl", "Economics", "Basketball"], likesYou: false },
  { name: "Kavya", age: 23, city: "Kochi", bio: "Marine biologist. Will tell you fun facts about octopuses whether you asked or not.", interests: ["Ocean", "Scuba", "Reading"], likesYou: true },
  { name: "Siddharth", age: 25, city: "Bengaluru", bio: "Backend engineer. I like my queries indexed and my dosas crispy. Weekend potter.", interests: ["Pottery", "Coding", "Board games"], likesYou: false },
  { name: "Pooja", age: 22, city: "Pune", college: "Symbiosis", bio: "Law student. I read terms and conditions for fun. Badminton at 6am, who's in?", interests: ["Law", "Badminton", "True crime"], likesYou: false },
  { name: "Ritvik", age: 21, city: "Kharagpur", college: "IIT Kharagpur", bio: "Robotics club, quizzing club, eating-maggi-at-3am club. Founding member of all three.", interests: ["Robotics", "Quizzing", "Anime"], likesYou: true },
  { name: "Nandini", age: 24, city: "Mumbai", bio: "Copywriter. I write tag lines for a living and still can't write this bio. Hi.", interests: ["Writing", "Yoga", "Musicals"], likesYou: false },
  { name: "Yash", age: 23, city: "Indore", bio: "Photographer chasing golden hour across the country. Poha connoisseur.", interests: ["Photography", "Road trips", "Street food"], likesYou: false },
  { name: "Simran", age: 22, city: "Amritsar", bio: "Med student. My hands are steady, my sleep schedule is not. Bhangra is my therapy.", interests: ["Medicine", "Bhangra", "Baking"], likesYou: true },
  { name: "Harsh", age: 24, city: "Noida", bio: "Game developer. I'll beat you at FIFA and then let you win at Ludo to be nice.", interests: ["Game dev", "FIFA", "Sci-fi"], likesYou: false },
  { name: "Leela", age: 21, city: "Bengaluru", college: "Mount Carmel College", bio: "Bharatanatyam since I was five, rock climbing since last month. Both are hard.", interests: ["Dance", "Climbing", "Museums"], likesYou: false },
  { name: "Neil", age: 25, city: "Goa", bio: "Runs a café with too many dogs. Live music on Fridays. Come for the coffee, stay for the dogs.", interests: ["Coffee", "Dogs", "Guitar"], likesYou: true },
  { name: "Aanya", age: 20, city: "Delhi", college: "Miranda House", bio: "Philosophy major. Ask me about free will, or don't. It was always going to happen.", interests: ["Philosophy", "Poetry", "Chess"], likesYou: false },
  { name: "Raghav", age: 23, city: "Hyderabad", bio: "Data scientist who tracks his biryani consumption in a spreadsheet. It's a lot.", interests: ["Data", "Tennis", "Biryani"], likesYou: false },
  { name: "Maya", age: 22, city: "Shillong", bio: "Musician from the rock capital of India. Will make you a mixtape, the old-fashioned way.", interests: ["Guitar", "Hiking", "Live gigs"], likesYou: true },
  { name: "Saanvi", age: 21, city: "Mysuru", bio: "Weekend birdwatcher, weekday environmental science student. Silence is my favourite sound.", interests: ["Birding", "Environment", "Sketching"], likesYou: false },
];

export const PROFILES: SeedProfile[] = raw.map((p, i) => ({
  ...p,
  id: `p${String(i + 1).padStart(2, "0")}`,
}));

export const photoFor = (id: string) => `/profiles/${id}.jpg`;
