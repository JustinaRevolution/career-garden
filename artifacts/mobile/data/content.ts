import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string[];
  keyTakeaway: string;
  tip: string;
  xp: number;
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconName;
  color: string;
  lessons: Lesson[];
  badgeId: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: IoniconName;
  color: string;
  xpReward: number;
}

export interface DailyAction {
  id: string;
  text: string;
  xp: number;
}

export const XP_LEVELS = [
  0, 150, 350, 600, 900, 1250, 1650, 2100, 2600, 3150,
  3750, 4400, 5100, 5850, 6650, 7500, 8400, 9350, 10350, 11400,
];

export function getLevelFromXP(xp: number): number {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i]) return i + 1;
  }
  return 1;
}

export function getXPForCurrentLevel(xp: number): number {
  const level = getLevelFromXP(xp);
  const levelIndex = level - 1;
  return xp - XP_LEVELS[levelIndex];
}

export function getXPToNextLevel(xp: number): number {
  const level = getLevelFromXP(xp);
  if (level >= XP_LEVELS.length) return 1000;
  return XP_LEVELS[level] - XP_LEVELS[level - 1];
}

export function getGardenLevel(xp: number): number {
  if (xp >= 2100) return 7;
  if (xp >= 1650) return 6;
  if (xp >= 1250) return 5;
  if (xp >= 900) return 4;
  if (xp >= 600) return 3;
  if (xp >= 150) return 2;
  return 1;
}

export const MODULES: Module[] = [
  {
    id: "resume",
    title: "Resume Mastery",
    subtitle: "Beat the ATS and land interviews",
    icon: "document-text",
    color: "#E8896E",
    badgeId: "badge-resume",
    lessons: [
      {
        id: "resume-1",
        title: "Beating the ATS Filter",
        duration: "4 min",
        xp: 50,
        content: [
          "In 2026, over 90% of Fortune 500 companies use Applicant Tracking Systems (ATS) to filter resumes before a human ever reads them. If your resume isn't ATS-compatible, it won't matter how qualified you are — you'll be filtered out automatically.",
          "The key to beating ATS is strategic keyword matching. Read the job description carefully and mirror its exact language in your resume — not just synonyms, but the actual phrases used. Tools like Jobscan and Resume Worded can analyze your resume against a job description in seconds.",
          "Format matters just as much as content. ATS struggles with graphics, tables, headers and footers, and unusual fonts. Stick to standard section headings like Experience, Education, and Skills — with clean, simple formatting and widely-supported fonts like Calibri or Arial.",
        ],
        keyTakeaway: "Mirror the job description's exact language, and keep your formatting clean and simple.",
        tip: "Paste the job description and your resume into Jobscan.co for a free ATS match score.",
      },
      {
        id: "resume-2",
        title: "Crafting Impact Bullets",
        duration: "5 min",
        xp: 50,
        content: [
          "Hiring managers spend an average of 7 seconds scanning a resume. Your bullet points need to communicate value instantly — not just what you did, but what you achieved.",
          "Use the CAR format: Context (brief), Action (what you specifically did), Result (quantified outcome). For example: 'Led migration of legacy platform to cloud, reducing page load time by 65% and increasing checkout conversion by 12%.'",
          "If you don't have hard numbers, use ranges, comparisons, or scope. 'Managed a $2M budget', 'Supported a team of 15', or 'Reduced ticket resolution time from 5 days to same-day' are all strong even without precise percentages.",
        ],
        keyTakeaway: "Every bullet should answer: so what? Make the impact of your work crystal clear.",
        tip: "For each bullet, ask yourself: How much? How many? How often? Compared to what?",
      },
      {
        id: "resume-3",
        title: "The 2026 Resume Format",
        duration: "4 min",
        xp: 50,
        content: [
          "The one-page rule needs updating. For professionals with less than 10 years of experience, one page is ideal. Senior professionals can use two pages — but every line must earn its place, and never go beyond two.",
          "In 2026, a summary section at the top is essential. This 3-4 line paragraph is your elevator pitch: who you are, what you're great at, and what you're looking for. Write it last, after you've defined your story through the bullets below.",
          "The skills section has evolved. Group skills by category (Cloud Platforms, Programming Languages, Frameworks) and include only what's relevant to your target role. Soft skills like 'team player' add no value — remove them.",
        ],
        keyTakeaway: "Your resume is a marketing document, not a history of everything you've ever done.",
        tip: "Update your resume summary when pivoting to a new role category — not for every application.",
      },
      {
        id: "resume-4",
        title: "Tailoring for Each Role",
        duration: "5 min",
        xp: 50,
        content: [
          "Sending the same resume to every job is one of the biggest mistakes in 2026's job market. With AI tools, tailoring is faster than ever — there's no excuse for a generic application.",
          "The 80/20 rule applies here: keep 80% of your resume the same (your core achievements and story), but customize the summary, skills section, and top bullets for each target role. This takes 10-15 minutes with AI assistance.",
          "Create a 'master resume' with every bullet point you've ever written, then pull from it when customizing. Use ChatGPT or Claude to help: 'Here is the job description and my bullet options — which 3 best match, and how would you rephrase them?'",
        ],
        keyTakeaway: "Targeted resumes get 3x more callbacks than generic ones. Customize strategically, not exhaustively.",
        tip: "Create a free Teal HQ account to save job descriptions and track your tailored applications.",
      },
    ],
  },
  {
    id: "linkedin",
    title: "LinkedIn & Brand",
    subtitle: "Get found and make a lasting impression",
    icon: "link",
    color: "#7BC4A0",
    badgeId: "badge-linkedin",
    lessons: [
      {
        id: "linkedin-1",
        title: "Optimizing Your Profile",
        duration: "5 min",
        xp: 50,
        content: [
          "LinkedIn is the dominant job search platform in 2026, with recruiters making over 72% of their hires through it. A half-hearted profile means missed opportunities every single day.",
          "Start with the three most visible elements: photo (professional, warm, good lighting), headline (not just your title — your value proposition in 120 characters), and featured section (2-3 pieces of work that prove your expertise).",
          "Your About section is where candidates are won and lost. Write in first person, start with a hook sentence about what drives you, describe your superpower and the problems you solve, and end with a clear call-to-action.",
        ],
        keyTakeaway: "Treat your LinkedIn profile as a landing page — every section should make a recruiter want to reach out.",
        tip: "Add 'Open to Work' as a private badge — only recruiters see it, not your current employer.",
      },
      {
        id: "linkedin-2",
        title: "The 2026 LinkedIn Algorithm",
        duration: "4 min",
        xp: 50,
        content: [
          "LinkedIn's algorithm in 2026 rewards consistent engagement over viral moments. The best job seekers treat it as a slow-burn strategy, not a billboard.",
          "Your content is shown first to your immediate connections, then to their networks. This means the quality of your network matters more than its size. 500 relevant, engaged connections outperform 5,000 passive followers.",
          "The algorithm currently favors: text posts with line breaks (highest reach), documents and carousels (high saves drive distribution), and native videos. Comments generate more reach than likes — so comment thoughtfully on others' posts.",
        ],
        keyTakeaway: "Engagement beats broadcasting. Be a contributor in your industry, not just a spectator.",
        tip: "Spend 15 minutes daily commenting meaningfully on 3-5 posts from people at your target companies.",
      },
      {
        id: "linkedin-3",
        title: "Content Strategy for Job Seekers",
        duration: "5 min",
        xp: 50,
        content: [
          "Posting on LinkedIn while job searching feels vulnerable. Reframe it: you're building authority in your field, which makes you more valuable to anyone who finds you.",
          "The three content types that work best: lessons learned from your career, takes on industry trends, and behind-the-scenes of a project you worked on. Avoid 'I'm looking for opportunities' posts — they signal desperation and get low engagement.",
          "Post 2-3 times per week for 4-6 weeks to see results. Consistency beats frequency. Every post is indexed and searchable, building a body of work that proves your expertise.",
        ],
        keyTakeaway: "Share your thinking, not your resume. Content builds credibility that a resume never can.",
        tip: "Write about a problem you solved at work — this is the most authentic and engaging content type.",
      },
      {
        id: "linkedin-4",
        title: "LinkedIn Premium — Worth It?",
        duration: "3 min",
        xp: 50,
        content: [
          "LinkedIn Premium costs around $40/month in 2026. For job seekers, it's worth it — but strategically. The free trial at the start of your search can be enough for a focused sprint.",
          "The most valuable Premium features: InMail credits to reach hiring managers directly, 'Who viewed your profile' data to identify interested recruiters, and Applicant Insights showing where you rank among applicants.",
          "The alternative to Premium: Join LinkedIn groups in your industry, use the Alumni tool to find people from your school at target companies, and engage consistently so your profile becomes discoverable organically.",
        ],
        keyTakeaway: "Premium is a tool, not a strategy. It amplifies a good profile — it doesn't fix a bad one.",
        tip: "If you use Premium, set a 30-day calendar reminder to cancel before it auto-renews.",
      },
    ],
  },
  {
    id: "networking",
    title: "Networking",
    subtitle: "Open doors that aren't posted online",
    icon: "people",
    color: "#7BAAC4",
    badgeId: "badge-networking",
    lessons: [
      {
        id: "networking-1",
        title: "Why Networking Wins",
        duration: "4 min",
        xp: 50,
        content: [
          "Research consistently shows that 70-85% of jobs are filled through networking rather than job boards. A trusted referral reduces risk for the hiring manager — it carries more weight than a cold resume.",
          "The hidden job market is real. Many roles are filled before they're ever posted, or postings go up as a formality when an internal candidate or referral is already preferred. Your network is your access card.",
          "Networking feels transactional because we only do it when we need something. The antidote is to network continuously — share insights, make introductions, congratulate others on milestones. When you need help, you'll have genuine relationships, not cold contacts.",
        ],
        keyTakeaway: "Your network is a garden, not a vending machine. Tend it before you need to harvest it.",
        tip: "Reach out to 2 people from your existing network this week — not to ask for anything, just to reconnect.",
      },
      {
        id: "networking-2",
        title: "Cold Outreach That Works",
        duration: "5 min",
        xp: 50,
        content: [
          "Cold outreach has a 1-3% response rate when done poorly, and a 30-50% response rate when done well. The difference is almost entirely in the opening message.",
          "The formula that works: explain specifically why you're reaching out to them (not generic flattery), ask for something small and specific — a 20-minute call, not a job — and make it easy to say yes with a focused ask.",
          "Bad message: 'I'm looking for a job in marketing. Would you be open to chatting?' Good message: 'I read your post on B2B content strategy and it shifted how I think about SEO. I'm transitioning into content marketing and would love 20 minutes to hear how you broke in. Would Thursday morning work?'",
        ],
        keyTakeaway: "Cold outreach that focuses on the other person and makes a specific ask beats generic messages every time.",
        tip: "Send 3 cold messages this week using the formula: specific observation, specific ask, easy response path.",
      },
      {
        id: "networking-3",
        title: "Building Genuine Relationships",
        duration: "4 min",
        xp: 50,
        content: [
          "The most effective networkers don't think of networking as a job search activity — they think of it as a professional habit. They connect, share, help, and learn regardless of whether they're searching.",
          "Give before you get. When you introduce two people who should know each other, share an article relevant to someone's project, or congratulate someone on a win, you're making deposits. When you eventually need help, you'll have a positive balance.",
          "Follow-up is where most people drop off. After a coffee chat, send a specific thank-you message referencing what you discussed, connect on LinkedIn, and set a 6-month reminder to check in. Relationships maintained over time are exponentially more valuable than one-off contacts.",
        ],
        keyTakeaway: "The best professional relationship you ever make might not pay off for 5 years — and that's the point.",
        tip: "End every networking conversation by asking: 'Is there anyone you think I should talk to?' One warm intro beats ten cold outreaches.",
      },
      {
        id: "networking-4",
        title: "Informational Interviews",
        duration: "5 min",
        xp: 50,
        content: [
          "An informational interview is a 20-30 minute conversation where you learn about someone's career path, role, or company — not ask for a job. This framing makes people far more willing to meet with you.",
          "Request it with a clear subject line: 'Quick question about your path to [their role].' In the message, explain who you are in one sentence, what specifically you admire about their career, and ask for 20 minutes. Keep it to 3-4 sentences max.",
          "In the conversation: ask about their actual day-to-day, what they wish they'd known, what makes someone stand out in their role, and who else you should talk to. After the call, follow up with a specific thank-you that references what you discussed.",
        ],
        keyTakeaway: "Informational interviews are one of the highest-leverage activities in a job search. Use them.",
        tip: "Identify 5 people at companies you admire and send informational interview requests this week.",
      },
    ],
  },
  {
    id: "search",
    title: "Search Strategy",
    subtitle: "Find opportunities others miss",
    icon: "compass",
    color: "#C4A07B",
    badgeId: "badge-search",
    lessons: [
      {
        id: "search-1",
        title: "The Hidden Job Market",
        duration: "4 min",
        xp: 50,
        content: [
          "The 'hidden job market' refers to roles filled through internal referrals, headhunters, or direct recruitment — often before a posting ever goes live. Estimates suggest 40-70% of hires happen this way.",
          "Getting into this market requires two things: having a network inside target companies, and being findable when recruiters are sourcing. You can't apply your way into the hidden market — you have to be pulled in.",
          "The strategy: identify 15-25 target companies, map your connections inside each, and systematically reach out. A strong referral often bypasses the ATS entirely and lands directly with the hiring manager.",
        ],
        keyTakeaway: "Focus on people, not postings. The best job you get might never appear on a job board.",
        tip: "Filter your LinkedIn Connections by company to see who you already know at your target companies.",
      },
      {
        id: "search-2",
        title: "Best Job Boards in 2026",
        duration: "4 min",
        xp: 50,
        content: [
          "Not all job boards are equal. For most industries, LinkedIn Jobs and Indeed remain the highest-volume sources. But for specific roles, niche boards often surface better opportunities with less competition.",
          "By industry in 2026: Tech roles — LinkedIn, Wellfound, Levels.fyi for compensation. Creative — Behance, Dribbble Jobs. Non-profit — Idealist. Remote-first — Remote.co, We Work Remotely, Flex Jobs. Finance — eFinancialCareers.",
          "Set up job alerts rather than manually searching. On LinkedIn, create alerts for keywords, location, and experience level. Check Glassdoor reviews before applying — company culture and interview process intel is invaluable.",
        ],
        keyTakeaway: "Use 2-3 job boards consistently rather than scattering energy across 10 platforms.",
        tip: "Set up 3 targeted job alerts on LinkedIn today. Alerts create a passive search running 24/7.",
      },
      {
        id: "search-3",
        title: "Your Target Company List",
        duration: "5 min",
        xp: 50,
        content: [
          "Random applications drain time and energy. Strategic job searching starts with a focused list of 15-25 companies you genuinely want to work for — then you pursue them systematically.",
          "Build your list using: Glassdoor for culture and compensation data, LinkedIn Company pages for growth trajectory, Crunchbase for startups, Fortune's Best Companies to Work For lists, and your own career values (remote? mission-driven? high growth?).",
          "Once you have your list, follow each company on LinkedIn, set up Google Alerts for their name, and identify 2-3 people inside each company to connect with. You want to be a familiar face when a role opens up.",
        ],
        keyTakeaway: "The company list is your job search's strategic foundation. Build it once, refine it continuously.",
        tip: "Create a spreadsheet with: Company, Why I Want to Work There, My Connection Inside, Status. Start with 10.",
      },
      {
        id: "search-4",
        title: "Managing Your Pipeline",
        duration: "4 min",
        xp: 50,
        content: [
          "Job searching without a tracking system is like sales without a CRM — you lose opportunities to follow-up fatigue and disorganization. Your pipeline is your business.",
          "Track each application with: Company, Role, Date Applied, Contact, Status, Next Action Date. Free tools like Teal HQ or Notion templates work well. Never let a promising lead go cold because you forgot to follow up.",
          "The follow-up cadence that works: after applying, wait 1 week then message the recruiter. After an interview, send a thank-you same-day. After silence post-interview, follow up once after 1 week. After 2 more weeks of silence, move on graciously.",
        ],
        keyTakeaway: "Following up doubles your response rate. Most candidates never follow up — that's your edge.",
        tip: "Set a 1-week calendar reminder every time you apply to a job. Following up on schedule sets you apart.",
      },
    ],
  },
  {
    id: "ai",
    title: "AI-Powered Hunting",
    subtitle: "Use AI as your unfair advantage",
    icon: "flash",
    color: "#A07BC4",
    badgeId: "badge-ai",
    lessons: [
      {
        id: "ai-1",
        title: "AI Tools for Resume Writing",
        duration: "5 min",
        xp: 50,
        content: [
          "In 2026, not using AI for your job search is like not using spell-check in 2010 — possible, but a real disadvantage. AI won't write your resume for you, but it will dramatically sharpen it.",
          "The best use of ChatGPT or Claude for resumes: paste in a job description and your draft bullets, then ask 'Which of these best match this job description, and how would you rephrase the top 3 to better align?' The AI finds alignment you might miss.",
          "For skills gaps: ask the AI to compare your profile against the job description and tell you what's missing. Then address those gaps in your cover letter or LinkedIn profile, or consider whether the role is the right fit.",
        ],
        keyTakeaway: "Use AI as your career coach and editor — not your ghostwriter. Your voice and real experiences must stay central.",
        tip: "Try Resume.io or Kickresume for AI-powered resume building with built-in ATS optimization.",
      },
      {
        id: "ai-2",
        title: "Researching Companies with AI",
        duration: "4 min",
        xp: 50,
        content: [
          "Company research used to take hours of Googling. With AI, a thorough pre-interview briefing takes 20 minutes. The key is knowing what to ask.",
          "Effective prompts: 'What are the biggest challenges facing [Company] in 2026?', 'Summarize their recent news and competitive position', 'What can you tell me about their culture based on what employees have said publicly?'",
          "For role-specific research, ask: 'What are the most common challenges someone in a [Role] at a [size/industry] company faces?' This helps you prepare stories that resonate. Verify key claims independently before repeating them in interviews.",
        ],
        keyTakeaway: "AI research doesn't replace reading — it accelerates and structures it. Verify key facts independently.",
        tip: "Before any interview, spend 20 minutes prompting AI for a company briefing. You'll walk in more prepared than 90% of candidates.",
      },
      {
        id: "ai-3",
        title: "Cover Letters with AI",
        duration: "4 min",
        xp: 50,
        content: [
          "The great cover letter debate: are they still necessary? Yes — selectively. For companies that request them, a strong cover letter can be decisive. For those that don't ask, skip it and invest the time in tailoring your resume.",
          "The AI cover letter trap is generic output. The fix: give the AI your resume summary, 2-3 specific achievements, and the job description, then ask for a cover letter that connects your specific experience to the role's specific needs. Then edit it to sound like you.",
          "The winning structure in 2026: Hook (why this company, right now), Body (2 short paragraphs of specific proof), Close (confident and action-oriented). Keep it under 250 words — hiring managers are busy.",
        ],
        keyTakeaway: "Cover letters that reference specific company initiatives and connect to specific achievements get read. Generic ones get deleted.",
        tip: "Start your cover letter: 'When [Company] did [specific thing], it confirmed this is exactly where I want to build the next chapter of my career.' Then back it up.",
      },
      {
        id: "ai-4",
        title: "AI Interview Simulation",
        duration: "5 min",
        xp: 50,
        content: [
          "Mock interviews with friends are helpful. Mock interviews with AI are better. You can run them anytime, as many times as you want, and request harsh feedback without damaging a relationship.",
          "Effective AI mock interview prompt: 'You are a senior hiring manager interviewing me for a [role]. Ask me the 10 most common and challenging questions for this role, then evaluate each of my answers for clarity, specificity, and impact. Be direct and critical.'",
          "After your AI mock interview, ask: 'What were my 3 weakest answers?', 'How would a top candidate have answered question 4?', 'What 3 STAR stories should I prepare to cover the most common interview themes for this role?' Use this feedback to tighten your prep.",
        ],
        keyTakeaway: "AI interview practice gives you unlimited reps. Use them. The candidate who's rehearsed 20 times beats the one who's rehearsed twice.",
        tip: "Do one complete AI mock interview before every real interview. 30 minutes of structured practice transforms your confidence.",
      },
    ],
  },
  {
    id: "interview",
    title: "Interview Prep",
    subtitle: "Walk in ready, walk out confident",
    icon: "chatbubbles",
    color: "#7BC47B",
    badgeId: "badge-interview",
    lessons: [
      {
        id: "interview-1",
        title: "Behavioral Questions (STAR)",
        duration: "5 min",
        xp: 50,
        content: [
          "Behavioral interview questions — 'Tell me about a time when...' — are the backbone of most interviews in 2026. They're based on the premise that past behavior predicts future performance, and they require preparation.",
          "The STAR format: Situation (brief context), Task (your responsibility), Action (what YOU specifically did — not 'we'), Result (quantified outcome + what you learned). Most candidates nail Situation and Task but underinvest in Action and Result — that's where differentiation happens.",
          "Prepare 8-10 STAR stories covering: leadership, conflict resolution, failure and learning, innovation, cross-functional collaboration, working under pressure, persuading stakeholders, and going above and beyond. From these stories, you can answer almost any behavioral question.",
        ],
        keyTakeaway: "Prepare fewer, better stories rather than trying to prepare for every possible question.",
        tip: "Write out 3 complete STAR stories this week. Time yourself — each should be 90-120 seconds when spoken aloud.",
      },
      {
        id: "interview-2",
        title: "Technical and Case Interviews",
        duration: "5 min",
        xp: 50,
        content: [
          "For technical roles in engineering, data science, or finance, behavioral prep is necessary but not sufficient. Technical and case interviews require structured, dedicated preparation.",
          "For software engineers in 2026: LeetCode for medium-level arrays, strings, trees, and graphs. System design practice using Grokking the System Design Interview or Pramp for mock sessions. Aim for 2-4 weeks of prep for FAANG-level technical interviews.",
          "For consulting and business roles, case interviews require learning frameworks (McKinsey PST, BCG cases, Case in Point by Marc Cosentino), then practicing with a partner or AI. The goal is a structured, communicative problem-solving approach — not memorizing case types.",
        ],
        keyTakeaway: "Technical interviews reward preparation over talent. Start earlier than you think you need to.",
        tip: "Commit to solving 1 LeetCode problem daily if preparing for technical interviews. Consistency beats cramming.",
      },
      {
        id: "interview-3",
        title: "Questions to Ask Them",
        duration: "4 min",
        xp: 50,
        content: [
          "The questions you ask reveal how you think, how prepared you are, and whether you've actually thought about the role and company. Most candidates ask generic questions — they land with a thud.",
          "Great question categories: Future-focused ('What are the biggest challenges the team faces in the next 6 months?'), Culture ('How are failures handled?'), Decision-making ('How was a recent important decision made?'), Growth ('What would exceptional performance look like after 90 days?').",
          "The closing question that stands out: 'Based on our conversation, do you have any concerns about my fit for this role that I can address now?' This shows confidence and a growth mindset, and often resolves the biggest objection before you leave the room.",
        ],
        keyTakeaway: "Questions are your chance to interview the company. Use them to make a real decision, not just to impress.",
        tip: "Prepare 6-8 questions and plan to ask 4. Some will be answered during the interview — have extras ready.",
      },
      {
        id: "interview-4",
        title: "Virtual Interview Mastery",
        duration: "4 min",
        xp: 50,
        content: [
          "Virtual interviews remain prevalent in 2026, especially for first rounds. They have different failure modes than in-person — most of them technical or environmental.",
          "Technical setup checklist: Stable internet, camera at eye level, soft front lighting (window in front of you or a ring light), neutral uncluttered background. Test your audio and video 15 minutes before. Have a phone hotspot as a backup plan.",
          "Virtual body language: Look at the camera, not your own image on screen — it feels like eye contact to them. Lean slightly forward. Pause before answering (latency causes people to interrupt; a pause shows confidence). Smile genuinely — warmth transmits through video.",
        ],
        keyTakeaway: "Virtual interviews are won or lost in setup. Five minutes of technical preparation prevents 90% of problems.",
        tip: "Record yourself in a mock Zoom interview and watch it back. You'll immediately know what to fix.",
      },
    ],
  },
  {
    id: "negotiation",
    title: "Offer Negotiation",
    subtitle: "Get what you're worth",
    icon: "cash",
    color: "#C4C47B",
    badgeId: "badge-negotiation",
    lessons: [
      {
        id: "negotiation-1",
        title: "Salary Research Methods",
        duration: "4 min",
        xp: 50,
        content: [
          "Negotiating without market data is like playing poker without knowing the odds. Your first job in offer negotiation is research — building a defensible, accurate picture of what the market pays.",
          "The best sources in 2026: Levels.fyi (the gold standard for tech compensation including equity), LinkedIn Salary, Glassdoor, Payscale, and the H1B Salary Database (companies must publicly disclose what they pay on visa applications).",
          "When researching, triangulate across multiple sources. Look at: base salary range for your specific title and seniority level, location (remote vs. San Francisco varies wildly), company size, and total compensation including bonus and equity.",
        ],
        keyTakeaway: "Knowledge is leverage. Research before you negotiate, not during.",
        tip: "Spend 30 minutes on Levels.fyi and LinkedIn Salary this week, even if you're not negotiating now. Know your market value.",
      },
      {
        id: "negotiation-2",
        title: "The Counter-Offer Script",
        duration: "5 min",
        xp: 50,
        content: [
          "Most offers are negotiable — but most candidates don't negotiate. Studies show 84% of employers expect negotiation, yet only 37% of candidates always negotiate. That gap is your opportunity.",
          "The counter-offer formula: Express gratitude, state your excitement clearly, make your ask based on market data, and remain silent. Example: 'Thank you — I'm genuinely excited about this role. Based on my research and experience in X, I was expecting something closer to $115K. Is there flexibility there?'",
          "Critical rules: never give a number first if you can avoid it. If pressed, give a range with your target at the bottom. Never apologize for negotiating. Never accept verbally on the spot — ask for 24-48 hours to review in writing.",
        ],
        keyTakeaway: "Negotiation is a skill that gets easier every time you do it. The worst they can say is no.",
        tip: "Practice your counter-offer script out loud 10 times before you make the call. Muscle memory reduces anxiety.",
      },
      {
        id: "negotiation-3",
        title: "Beyond Base Salary",
        duration: "5 min",
        xp: 50,
        content: [
          "Total compensation is almost always more flexible than base salary. When the company says the base is fixed, they often have room in signing bonuses, equity, remote flexibility, and benefits.",
          "High-value negotiation targets in 2026: Signing bonus (easiest to grant, doesn't set a raise precedent), Equity (especially at startups — negotiate both amount and vesting cliff), Work schedule flexibility, Professional development budget, and an accelerated 6-month review timeline.",
          "The total comp calculation: base + expected bonus (ask what % most people actually receive) + equity annual value (share count × price ÷ vesting years) + benefits. A $120K base with 25% bonus and strong equity often beats a $140K base with no equity.",
        ],
        keyTakeaway: "Negotiate the whole package, not just the number. The best deals are often made in variables the company has more flexibility on.",
        tip: "Build a simple spreadsheet comparing your total comp across offers. Include base, bonus, equity, PTO, and remote work value.",
      },
      {
        id: "negotiation-4",
        title: "Evaluating the Full Offer",
        duration: "4 min",
        xp: 50,
        content: [
          "The worst job offer mistakes happen when people focus on comp alone. The company you join — its culture, leadership, and trajectory — matters more than the exact salary over a 5-year horizon.",
          "The full evaluation framework: Compensation (fair and market-aligned?), Manager (will you learn from them?), Growth (is there a clear path forward?), Culture (how are failures handled? what are the real working hours?), Mission alignment, and Company trajectory (growing or shrinking?).",
          "Trust your gut, but verify it. The candidate experience often reflects the employee experience. How did people treat you in the process? Were they organized and respectful of your time? Did they communicate well?",
        ],
        keyTakeaway: "The best offer isn't always the highest number. Evaluate what will make you better in 2 years.",
        tip: "Ask your future manager: 'Tell me about someone on your team who grew significantly. What did that growth look like?' Their answer is revealing.",
      },
    ],
  },
  {
    id: "resilience",
    title: "Resilience & Mindset",
    subtitle: "Stay strong through the search",
    icon: "flower",
    color: "#C47BAA",
    badgeId: "badge-resilience",
    lessons: [
      {
        id: "resilience-1",
        title: "The Rejection Resilience Plan",
        duration: "4 min",
        xp: 50,
        content: [
          "The average job search in 2026 involves 150-200 applications, 10-20 interviews, and several rejections before a single offer. This is not a reflection of your value — it's just how the math works at scale.",
          "Rejection resilience comes from two mindset shifts: First, separate the activity from the outcome. You control applications and follow-ups — not whether they respond. Second, treat each rejection as a data point, not a verdict.",
          "Build a rejection ritual. Some job seekers celebrate every rejection — 'one closer to yes.' Others let themselves feel disappointed for 30 minutes, then move on. Find what works for you and make it a deliberate practice, not something that just happens to you.",
        ],
        keyTakeaway: "The job search is a volume game with variance. Resilience is the skill that keeps you playing until the odds come through.",
        tip: "After every rejection, write down one thing you did well in the process. This shifts your brain from outcome-focus to growth-focus.",
      },
      {
        id: "resilience-2",
        title: "Avoiding Job Search Burnout",
        duration: "4 min",
        xp: 50,
        content: [
          "Job search burnout is real and underestimated. When your livelihood and identity are both on the line, anxiety and exhaustion compound quickly. Managing this isn't weakness — it's strategy.",
          "Time-box your job search. Treat it like a part-time job with defined hours: 3-4 hours per day, 5 days per week. Work focused within those hours, then stop. Thinking about job searching 24/7 doesn't increase your chances — it increases cortisol.",
          "Protect your non-search life deliberately. Keep exercising. Maintain one social commitment per week. Have at least one activity that has nothing to do with your career. These aren't luxuries — they're what keeps you showing up with energy for the applications and interviews that matter.",
        ],
        keyTakeaway: "You're a long-term asset. Protect your mental health during the search, not just your resume.",
        tip: "Schedule your job search hours in your calendar and treat them like appointments. When the time is up, close the laptop.",
      },
      {
        id: "resilience-3",
        title: "Tracking Progress, Not Just Results",
        duration: "4 min",
        xp: 50,
        content: [
          "The dangerous thing about job searching is that the outcome — getting a job — can take weeks or months and is largely outside your control. If you only measure results, you'll feel like you're failing the entire time.",
          "Measure inputs instead: applications sent per week, networking contacts made, LinkedIn posts written, interview prep hours logged. These are the leading indicators. Consistent quality inputs reliably produce results over time.",
          "Create a weekly review ritual: What did I do this week? What am I proud of? What would I do differently? What's my plan for next week? This 15-minute practice keeps you strategic and prevents the 'random spray of applications' approach that leads to burnout.",
        ],
        keyTakeaway: "What you measure, you manage. Measure your effort — you'll feel in control even when outcomes are uncertain.",
        tip: "Set a weekly goal of 10-15 quality applications, 3 networking messages, and 2 skill-building activities. Track each in a simple doc.",
      },
      {
        id: "resilience-4",
        title: "Building Your Support System",
        duration: "4 min",
        xp: 50,
        content: [
          "Job searching alone is harder, slower, and more demoralizing than doing it with community. People who share their search with others get offers faster — from referrals, accountability, and emotional support.",
          "Find your accountability partner: one person who is also job searching or in a career transition. Schedule a weekly check-in. Share your weekly goals and results. Celebrate each other's small wins. This simple structure dramatically improves follow-through.",
          "Beyond your accountability partner: join one online community in your field (LinkedIn groups, Slack communities), find one local or virtual industry event per month, and identify a mentor who has navigated a similar transition and can give you perspective when the search feels stuck.",
        ],
        keyTakeaway: "Your support system is a strategic asset, not just emotional support. Invest in it intentionally.",
        tip: "Post in one professional community this week — introduce yourself, share what you're looking for, and ask one genuine question.",
      },
    ],
  },
];

export const BADGES: Badge[] = [
  {
    id: "badge-first-bloom",
    title: "First Bloom",
    description: "Completed your very first lesson",
    icon: "flower-outline",
    color: "#E8896E",
    xpReward: 100,
  },
  {
    id: "badge-resume",
    title: "Resume Reaper",
    description: "Mastered the art of resume writing",
    icon: "document-text",
    color: "#E8896E",
    xpReward: 150,
  },
  {
    id: "badge-linkedin",
    title: "LinkedIn Legend",
    description: "Built an unstoppable LinkedIn presence",
    icon: "link",
    color: "#7BC4A0",
    xpReward: 150,
  },
  {
    id: "badge-networking",
    title: "Network Weaver",
    description: "Unlocked the power of authentic connection",
    icon: "people",
    color: "#7BAAC4",
    xpReward: 150,
  },
  {
    id: "badge-search",
    title: "Hunt Master",
    description: "Found the jobs others miss",
    icon: "compass",
    color: "#C4A07B",
    xpReward: 150,
  },
  {
    id: "badge-ai",
    title: "AI Whisperer",
    description: "Harnessed AI as a competitive edge",
    icon: "flash",
    color: "#A07BC4",
    xpReward: 150,
  },
  {
    id: "badge-interview",
    title: "Interview Ace",
    description: "Walked in ready, walked out confident",
    icon: "chatbubbles",
    color: "#7BC47B",
    xpReward: 150,
  },
  {
    id: "badge-negotiation",
    title: "Deal Closer",
    description: "Negotiated with confidence and data",
    icon: "cash",
    color: "#C4C47B",
    xpReward: 150,
  },
  {
    id: "badge-resilience",
    title: "Resilient Soul",
    description: "Stayed strong through the whole journey",
    icon: "heart",
    color: "#C47BAA",
    xpReward: 150,
  },
  {
    id: "badge-full-bloom",
    title: "Full Bloom",
    description: "Completed every module in the garden",
    icon: "star",
    color: "#F5A54A",
    xpReward: 500,
  },
  {
    id: "badge-streak-7",
    title: "Garden Tender",
    description: "Showed up for 7 days in a row",
    icon: "flame",
    color: "#F5A54A",
    xpReward: 200,
  },
  {
    id: "badge-seed-planter",
    title: "Seed Planter",
    description: "Started every module in the garden",
    icon: "leaf",
    color: "#7BC4A0",
    xpReward: 200,
  },
];

export const DAILY_ACTIONS: DailyAction[] = [
  { id: "apply", text: "Apply to 1 job that genuinely excites you", xp: 25 },
  { id: "connect", text: "Send 1 LinkedIn connection request", xp: 25 },
  { id: "resume-bullet", text: "Update or improve 1 resume bullet", xp: 25 },
  { id: "research", text: "Research 1 target company for 15 minutes", xp: 25 },
  { id: "practice", text: "Practice answering 1 interview question out loud", xp: 25 },
  { id: "read", text: "Read 1 industry article or newsletter", xp: 25 },
  { id: "followup", text: "Follow up on 1 pending application or conversation", xp: 25 },
  { id: "outreach", text: "Write 1 cold outreach message", xp: 25 },
  { id: "community", text: "Engage meaningfully in 1 professional community", xp: 25 },
  { id: "linkedin-post", text: "Share 1 insight or update on LinkedIn", xp: 25 },
];

export function getTodayActions(): DailyAction[] {
  const dateStr = new Date().toDateString();
  let seed = dateStr.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const indices = DAILY_ACTIONS.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }
  return indices.slice(0, 3).map((i) => DAILY_ACTIONS[i]);
}
