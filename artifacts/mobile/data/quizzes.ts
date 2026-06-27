import { Quiz } from "./content";

export const QUIZZES: Record<string, Quiz> = {
  "resume-1": {
    question: "What is the single most effective way to get your resume past an ATS filter?",
    options: [
      "Use a colorful, graphics-rich template to stand out",
      "Mirror the exact language and phrases from the job description",
      "Make the resume as long as possible to include every keyword",
      "Submit it as an image file so formatting is preserved",
    ],
    correctIndex: 1,
    explanation: "ATS systems match keywords. Mirroring the job description's exact phrasing (not just synonyms) is the highest-leverage move, and clean formatting keeps it parseable.",
  },
  "resume-2": {
    question: "What does the CAR format used for strong resume bullets stand for?",
    options: [
      "Career, Ambition, Results",
      "Context, Action, Result",
      "Capability, Achievement, Reference",
      "Challenge, Approach, Reward",
    ],
    correctIndex: 1,
    explanation: "CAR stands for Context (brief), Action (what you specifically did), and Result (a quantified outcome) — it forces every bullet to show real impact.",
  },
  "resume-3": {
    question: "According to the 2026 resume format, what makes a summary section effective?",
    options: [
      "Listing every job you've ever held in chronological order",
      "A 3-4 line elevator pitch of who you are, your strengths, and your goal",
      "A long paragraph of soft skills like 'team player'",
      "Copying the objective statement from your previous resume",
    ],
    correctIndex: 1,
    explanation: "The summary is a 3-4 line elevator pitch — who you are, what you're great at, and what you're looking for — and it's best written last, after your bullets define your story.",
  },
  "resume-4": {
    question: "What is the smartest way to tailor your resume for each role?",
    options: [
      "Rewrite the entire resume from scratch every time",
      "Send the exact same resume to every job to save time",
      "Keep about 80% the same and customize the summary, skills, and top bullets",
      "Only change the company name in the header",
    ],
    correctIndex: 2,
    explanation: "The 80/20 rule: keep your core achievements and story (80%) consistent, and customize the summary, skills, and top bullets for each role. Targeted resumes get about 3x more callbacks.",
  },
  "linkedin-1": {
    question: "Which three elements should you prioritize first when optimizing your LinkedIn profile?",
    options: [
      "Skills, endorsements, and recommendations",
      "Photo, headline, and featured section",
      "Connection count, follower count, and posts",
      "Education, certifications, and languages",
    ],
    correctIndex: 1,
    explanation: "Start with the three most visible elements: a professional photo, a headline that states your value proposition, and a featured section showing 2-3 pieces of proof.",
  },
  "linkedin-2": {
    question: "What does the 2026 LinkedIn algorithm reward most?",
    options: [
      "Occasional viral posts that get massive reach",
      "Consistent engagement and a relevant, engaged network",
      "Having the largest possible number of followers",
      "Posting links to external websites as often as possible",
    ],
    correctIndex: 1,
    explanation: "The algorithm rewards consistent engagement over viral moments. A smaller relevant, engaged network outperforms a huge passive one, and thoughtful comments drive more reach than likes.",
  },
  "linkedin-3": {
    question: "What kind of content works best for job seekers posting on LinkedIn?",
    options: [
      "Repeated 'I'm looking for opportunities' posts",
      "Lessons learned, industry takes, and behind-the-scenes of your work",
      "Reposting other people's content without commentary",
      "Personal updates unrelated to your field",
    ],
    correctIndex: 1,
    explanation: "Lessons learned, takes on industry trends, and behind-the-scenes of your projects build authority. 'I'm looking for opportunities' posts signal desperation and get low engagement.",
  },
  "linkedin-4": {
    question: "How should a job seeker think about LinkedIn Premium?",
    options: [
      "It's a complete job search strategy on its own",
      "It's a tool that amplifies a good profile but won't fix a bad one",
      "It's never worth the cost under any circumstances",
      "It guarantees recruiters will contact you",
    ],
    correctIndex: 1,
    explanation: "Premium is a tool, not a strategy. Its InMail, profile-view, and applicant insights amplify a strong profile, but it can't fix a weak one — and a focused free trial is often enough.",
  },
  "networking-1": {
    question: "Roughly what share of jobs are filled through networking rather than job boards?",
    options: [
      "10-20%",
      "30-40%",
      "70-85%",
      "Less than 5%",
    ],
    correctIndex: 2,
    explanation: "Research consistently shows 70-85% of jobs are filled through networking. A trusted referral lowers risk for the hiring manager and carries more weight than a cold resume.",
  },
  "networking-2": {
    question: "What makes cold outreach far more likely to get a response?",
    options: [
      "Generic flattery and asking directly for a job",
      "A specific reason for reaching out and a small, specific ask",
      "Sending the same message to as many people as possible",
      "Making the message as long and detailed as you can",
    ],
    correctIndex: 1,
    explanation: "Well-done outreach explains specifically why you're reaching out, makes a small specific ask (like a 20-minute call, not a job), and makes it easy to say yes — lifting response rates dramatically.",
  },
  "networking-3": {
    question: "What is the 'give before you get' principle in networking?",
    options: [
      "Only help people who can immediately help you back",
      "Make deposits by helping others before you need anything",
      "Give your resume to everyone you meet",
      "Wait until you need a job before reaching out",
    ],
    correctIndex: 1,
    explanation: "Giving before you get means making deposits — introductions, useful articles, congratulations — so that when you eventually need help, you have a positive balance of genuine relationships.",
  },
  "networking-4": {
    question: "What is an informational interview?",
    options: [
      "A formal job interview disguised as a casual chat",
      "A 20-30 minute conversation to learn about someone's career — not ask for a job",
      "A panel interview with multiple hiring managers",
      "A recruiter screening call before an offer",
    ],
    correctIndex: 1,
    explanation: "An informational interview is a short conversation to learn about someone's career path, role, or company — not to ask for a job. That framing makes people far more willing to meet.",
  },
  "search-1": {
    question: "What is the 'hidden job market'?",
    options: [
      "Jobs that only appear on premium, paid job boards",
      "Roles filled through referrals or recruitment, often before being posted",
      "Listings that are intentionally hidden from search engines",
      "Internships that don't pay a salary",
    ],
    correctIndex: 1,
    explanation: "The hidden job market refers to roles filled through internal referrals, headhunters, or direct recruitment — often before a posting goes live. You get pulled in via your network, not by applying.",
  },
  "search-2": {
    question: "What's the recommended approach to job boards in 2026?",
    options: [
      "Manually search 10+ platforms every day",
      "Use 2-3 boards consistently and set up job alerts",
      "Only ever use one giant board and ignore niche ones",
      "Avoid job boards entirely and rely only on networking",
    ],
    correctIndex: 1,
    explanation: "Use 2-3 job boards consistently rather than scattering energy, and set up alerts so a passive search runs 24/7 instead of manually searching every day.",
  },
  "search-3": {
    question: "How big should your target company list be for a focused search?",
    options: [
      "1-2 dream companies only",
      "15-25 companies you genuinely want to work for",
      "100+ companies to maximize options",
      "As many as you can find with open roles",
    ],
    correctIndex: 1,
    explanation: "Strategic searching starts with a focused list of 15-25 companies you genuinely want to work for, which you then pursue systematically instead of spraying random applications.",
  },
  "search-4": {
    question: "Why does following up on applications matter so much?",
    options: [
      "It annoys recruiters into responding faster",
      "It roughly doubles your response rate, and most candidates never do it",
      "It's only useful after you receive an offer",
      "It replaces the need for a tailored resume",
    ],
    correctIndex: 1,
    explanation: "Following up roughly doubles your response rate — and because most candidates never follow up, doing it on a schedule becomes a real competitive edge.",
  },
  "ai-1": {
    question: "What's the best way to use AI tools like ChatGPT or Claude for your resume?",
    options: [
      "Have it write the entire resume from scratch for you",
      "Use it as an editor to sharpen alignment, keeping your voice and real experience central",
      "Paste in fake achievements to fill gaps",
      "Avoid it entirely to keep your resume authentic",
    ],
    correctIndex: 1,
    explanation: "Use AI as a career coach and editor — not a ghostwriter. It's great at finding alignment between your bullets and a job description, but your voice and real experiences must stay central.",
  },
  "ai-2": {
    question: "What's a key rule when using AI to research companies before an interview?",
    options: [
      "Trust everything the AI says without checking",
      "Verify key facts independently before repeating them in interviews",
      "Only research the company's stock price",
      "Skip research if the AI gives a quick summary",
    ],
    correctIndex: 1,
    explanation: "AI accelerates and structures research, but you should verify key claims independently before repeating them — it gets you a thorough briefing in about 20 minutes, not a substitute for accuracy.",
  },
  "ai-3": {
    question: "How can you avoid the generic-output trap when using AI for cover letters?",
    options: [
      "Ask for the longest cover letter possible",
      "Give the AI your specific achievements and the job description, then edit it to sound like you",
      "Use the exact same letter for every company",
      "Let the AI invent accomplishments to sound impressive",
    ],
    correctIndex: 1,
    explanation: "Feed the AI your resume summary, specific achievements, and the job description so it connects your real experience to the role's needs — then edit it so it sounds like you. Keep it under 250 words.",
  },
  "ai-4": {
    question: "What's the main advantage of running mock interviews with AI?",
    options: [
      "It can replace doing any real interviews",
      "Unlimited reps anytime, with direct, critical feedback on demand",
      "It guarantees you'll pass the real interview",
      "It only works for technical coding roles",
    ],
    correctIndex: 1,
    explanation: "AI gives you unlimited mock-interview reps anytime and will give harsh, direct feedback without straining a relationship — the candidate who's rehearsed 20 times beats the one who's rehearsed twice.",
  },
  "interview-1": {
    question: "In the STAR method, where do most candidates underinvest and lose differentiation?",
    options: [
      "Situation and Task",
      "Action and Result",
      "The greeting and small talk",
      "The questions they ask at the end",
    ],
    correctIndex: 1,
    explanation: "Most candidates nail Situation and Task but underinvest in Action (what YOU specifically did) and Result (the quantified outcome and learning) — which is exactly where differentiation happens.",
  },
  "interview-2": {
    question: "What's the best mindset about preparing for technical and case interviews?",
    options: [
      "They reward raw talent more than preparation, so cramming is enough",
      "They reward preparation over talent, so start earlier than you think you need to",
      "Behavioral prep alone is sufficient for technical roles",
      "Memorizing every possible case type is the goal",
    ],
    correctIndex: 1,
    explanation: "Technical and case interviews reward preparation over talent — start early, practice consistently (e.g., a problem a day), and aim for a structured, communicative approach rather than memorization.",
  },
  "interview-3": {
    question: "What does asking thoughtful questions at the end of an interview accomplish?",
    options: [
      "It mainly fills time when the interview ends early",
      "It reveals how you think and lets you genuinely evaluate the role",
      "It's expected but rarely influences the decision",
      "It signals you didn't research the company",
    ],
    correctIndex: 1,
    explanation: "Your questions reveal how you think and how prepared you are, and they let you interview the company to make a real decision. Prepare 6-8 and plan to ask about 4, since some get answered along the way.",
  },
  "interview-4": {
    question: "Where are virtual interviews most often won or lost?",
    options: [
      "In the technical and environmental setup",
      "In the length of your answers",
      "In whether you wear a suit",
      "In how many notes you keep off-screen",
    ],
    correctIndex: 0,
    explanation: "Virtual interviews are won or lost in setup — stable internet, eye-level camera, soft front lighting, and a neutral background. A few minutes of technical prep prevents most problems.",
  },
  "negotiation-1": {
    question: "What is the first job of effective offer negotiation?",
    options: [
      "Naming your number before the employer does",
      "Researching market data to build a defensible picture of fair pay",
      "Threatening to walk away immediately",
      "Accepting the offer quickly to show enthusiasm",
    ],
    correctIndex: 1,
    explanation: "Research is step one — triangulate across sources like Levels.fyi, LinkedIn Salary, and Glassdoor to build a defensible picture of market pay. Knowledge is leverage you gather before you negotiate.",
  },
  "negotiation-2": {
    question: "What's a critical rule in the counter-offer script?",
    options: [
      "Always give your number first to anchor high",
      "After making your ask, stay silent and let them respond",
      "Apologize for asking for more money",
      "Accept verbally on the spot to lock it in",
    ],
    correctIndex: 1,
    explanation: "Make your ask based on market data, then remain silent. Avoid giving a number first, never apologize for negotiating, and ask for 24-48 hours rather than accepting verbally on the spot.",
  },
  "negotiation-3": {
    question: "Why negotiate the whole package instead of just base salary?",
    options: [
      "Base salary is the only thing that ever matters",
      "Signing bonuses, equity, and flexibility are often more negotiable than base",
      "Companies prefer you ignore equity and benefits",
      "Total comp is impossible to compare across offers",
    ],
    correctIndex: 1,
    explanation: "Total compensation is usually more flexible than base salary — signing bonuses, equity, schedule flexibility, and development budgets often have room even when base is 'fixed.' Negotiate the whole package.",
  },
  "negotiation-4": {
    question: "What does the lesson say about choosing between offers?",
    options: [
      "Always take the highest salary number",
      "The best offer isn't always the highest number — weigh manager, growth, and culture",
      "Compensation is the only factor worth evaluating",
      "Ignore your gut feeling entirely",
    ],
    correctIndex: 1,
    explanation: "The best offer isn't always the highest number. Evaluate compensation alongside your manager, growth path, culture, mission, and company trajectory — what will make you better in two years.",
  },
  "resilience-1": {
    question: "How should you treat each rejection during a job search?",
    options: [
      "As a final verdict on your value",
      "As a single data point, not a verdict",
      "As a reason to stop applying for a while",
      "As proof you targeted the wrong field",
    ],
    correctIndex: 1,
    explanation: "Separate the activity from the outcome and treat each rejection as a data point, not a verdict. The search is a volume game with variance — resilience keeps you playing until the odds come through.",
  },
  "resilience-2": {
    question: "What's an effective strategy for avoiding job search burnout?",
    options: [
      "Search 24/7 to maximize your chances",
      "Time-box the search like a part-time job with defined hours",
      "Stop exercising and socializing until you land a role",
      "Only search when you feel motivated",
    ],
    correctIndex: 1,
    explanation: "Time-box your search to defined hours (e.g., 3-4 hours a day, 5 days a week), work focused, then stop. Thinking about it 24/7 doesn't raise your chances — it just raises your stress.",
  },
  "resilience-3": {
    question: "Why should you measure inputs rather than only results during your search?",
    options: [
      "Results are the only thing that ever matters",
      "Inputs are the leading indicators you control and they reliably produce results",
      "Inputs are impossible to track accurately",
      "Measuring effort makes you feel like you're failing",
    ],
    correctIndex: 1,
    explanation: "Outcomes can take months and are largely outside your control. Measuring inputs — applications, contacts, prep hours — tracks the leading indicators you control and keeps you feeling in command.",
  },
  "resilience-4": {
    question: "What role does a support system play in a job search?",
    options: [
      "It's only for emotional comfort and doesn't affect results",
      "It's a strategic asset — people who share their search get offers faster",
      "It slows you down with too many opinions",
      "It's unnecessary if you're self-motivated",
    ],
    correctIndex: 1,
    explanation: "A support system is a strategic asset, not just emotional support. People who share their search get offers faster through referrals, accountability, and perspective — so invest in it intentionally.",
  },
};

export function getQuiz(lessonId: string): Quiz | null {
  return QUIZZES[lessonId] ?? null;
}
