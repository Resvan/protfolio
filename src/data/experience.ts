export interface Job {
  company: string;
  url: string | null;
  title: string;
  start: string; // YYYY-MM
  end: string | null; // null = present
  note?: string;
  highlights: string[];
  /** 'training' entries are excluded from the years/companies facts. */
  kind?: 'job' | 'training';
}
export const experience: Job[] = [
  {
    company: 'Salesdock', url: 'https://salesdock.com/', title: 'Software Developer L2', start: '2025-02', end: null,
    highlights: [
      'Sole frontend engineer on an energy billing platform that runs the full customer lifecycle: sign-ups, contracts, energy-market messaging, invoicing and collections (Laravel, React 19, Inertia, TypeScript). One of the two largest contributors to the codebase.',
      'Designed its first interface myself before any Figma existed, then rebuilt it to the design team’s system: tabbed contract, customer and invoice workspaces, an in-app PDF viewer and live status updates over WebSockets.',
      'Shipped the frontend for most of the product, from contracts, terminations and invoicing to a validation rule builder, role-based permissions, 2FA and passkeys. Now also build the Laravel endpoints and review the team’s frontend pull requests.',
      'Contribute to Salesdock’s shared React design system and layout packages, and built Next.js order-flow pages from Figma designs.',
    ],
  },
  {
    company: 'Freelance', url: null, title: 'Web Developer', start: '2024-08', end: '2025-04',
    highlights: [
      'MeetXO (Jan–Apr 2025): built most of the frontend for an expert consultation platform where coaches and mentors sell one-to-one video sessions and events. Covered discovery, profiles, booking with calendar availability, OTP sign-in, Razorpay payments, transactions and KYC, plus backend fixes in Node.js (Next.js, TypeScript, MongoDB).',
      'Virtual Solutions (Aug–Dec 2024): built the website for a Saudi transport and logistics company, in English and Arabic with a right-to-left layout, covering its services, quote requests, careers and contact pages (Next.js, Tailwind CSS, Framer Motion).',
    ],
  },
  {
    company: 'CleverPush', url: 'https://cleverpush.com/', title: 'Software Engineer', start: '2024-07', end: '2025-01',
    highlights: [
      'Rebuilt the marketing site and a new documentation page from the design team’s Figma: Next.js, Tailwind CSS, Framer Motion animations and Sanity CMS, responsive and in German and English. Also built a custom-coded page in the existing WordPress site.',
      'Worked on the CleverPush product: redesigned the opt-in prompts, added a carousel option to web banners, fixed banner bugs, and fixed role-based and team permission issues.',
      'Supported customers directly, helping them set up the JavaScript SDK, customise the notification bell and opt-in, and design custom web banners and newsletters.',
    ],
  },
  {
    company: 'Hawr Technologies', url: 'https://www.hawrtechnologies.com/', title: 'Full-stack Developer', start: '2024-01', end: '2024-06',
    highlights: [
      'Built the Hawr Learn website for a STEM education company, presenting its robotics, coding, rocketry, drone and 3D printing courses with events, demo booking and student login.',
      'Built two connected apps for an Ayurvedic clinic: a clinic website with doctor appointment booking, and an online store with categories, cart and PayPal checkout (React, Vite, MUI, Express, MongoDB).',
    ],
  },
  {
    company: 'Adam Technologies', url: 'https://www.linkedin.com/company/adam-technologies/about/', title: 'MERN Stack Developer', start: '2023-10', end: '2023-12', note: 'Company has since closed',
    highlights: [
      'Built a hotel booking app in Flutter: sign-up and sign-in, hotel listings, room selection with adult and child counts, Stripe payments, booking details, and ratings and reviews. It was not released publicly.',
      'Contributed to a multi-service app spanning medical, workout and shopping sections, building the workout video listings.',
    ],
  },
  {
    company: 'Duple IT Solutions', url: 'https://www.dupleit.com/', title: 'Software Development Engineer-1', start: '2023-05', end: '2023-09',
    highlights: [
      'First production role. On BaseKamp, a Manchester salon platform with booking, a shop and a café (Express, MongoDB, EJS), fixed bugs and shipped features such as drag-and-drop rescheduling in the appointment calendar, with approval and confirmation emails to clients.',
      'On Rentdigicare, a Canadian property management and rental listings platform (React, Redux, Node.js), built dashboard APIs, the appointment and maintenance task assignment flows, and filters across both apps. Fixed bugs, including re-renders that fired endless API requests.',
    ],
  },
  {
    company: 'Brocamp (Brototype)', url: 'https://brototype.in/', title: 'Trainee, self-learning web development programme', start: '2022-08', end: '2023-03', kind: 'training',
    highlights: [
      'Learned full-stack JavaScript in Brototype’s self-paced, mentor-reviewed programme, then joined Duple IT Solutions through its placement support.',
      'Built an e-commerce store with Node.js, Express, MongoDB and EJS: admin panel, categories, coupons and timed offers, wishlist, Twilio SMS, and Razorpay and PayPal payments.',
      'Final project: Connectify, a MERN social network with posts, stories, realtime chat over Socket.io, notifications, Google sign-in and an admin panel.',
    ],
  },
];

export function formatRange(job: Job): string {
  const f = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${f(job.start)} – ${job.end ? f(job.end) : 'Present'}`;
}
