export interface Project {
  slug: string;
  name: string;
  url: string;
  description: string;
  stack: string[];
  featured: boolean;
  /** false when there is no public website to link (taken down, or app-only); hides the live link. */
  live?: boolean;
  /** Google Play listing, when the product also ships as an Android app. */
  playStoreUrl?: string;
  /** Case-study copy; only used when featured. */
  caseStudy?: { problem: string; built: string };
}
export const projects: Project[] = [
  {
    slug: 'turnly',
    name: 'Turnly',
    url: 'https://queue.resvan.in/',
    description:
      'My own queue app for clinics and salons: customers keep their place on their phone, staff call the next person with one key, and the waiting-room TV and every phone update in under a second.',
    stack: ['Next.js', 'React', 'TypeScript', 'Fastify', 'PostgreSQL', 'Redis', 'WebSockets', 'Web Push', 'Playwright'],
    featured: true,
    caseStudy: {
      problem: 'Clinic waiting rooms in Kerala run on paper tokens and shouting names. People can’t step out without losing their place, staff lose track of who has arrived, and nobody knows how long the wait really is. I wanted to build a production-grade product end to end, to the standard I would expect from a real SaaS team.',
      built: 'I designed and built all of it. Customers join by scanning a QR code and follow their place live on a page that loads under 160 KB, in English or Malayalam, with a push alert when their turn is near. Staff run a keyboard-first console, a TV screen announces each call, and owners get an insights dashboard. Under the hood, Postgres row locks with SKIP LOCKED stop two counters from calling the same person, an append-only event log drives realtime updates over WebSockets, and errors and uptime are monitored. It is covered by unit, integration and Playwright tests, and runs on a $0 hosting stack.',
    },
  },
  {
    slug: 'meetxo',
    name: 'MeetXO',
    url: 'https://www.meetxo.ai/',
    live: false,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.app.meetxo',
    description:
      'Freelance build of an expert consultation platform: discovery, profiles, booking with calendar availability, events, OTP sign-in and Razorpay payments. It ships on the web and as an Android app on Google Play.',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'PWA', 'Capacitor (Android)', 'NextAuth', 'Razorpay', 'Node.js', 'MongoDB'],
    featured: true,
    caseStudy: {
      problem: 'Experts, coaches and mentors needed one place to sell their time: a personal profile page, bookable one-to-one video sessions and events, and payments handled for them.',
      built: 'I built most of the Next.js frontend: the home page, expert discovery by category, expert profiles and the booking flow with calendar availability. I also built OTP sign-in with NextAuth, Razorpay payments, event creation and booking, profile image cropping, bookings history, transactions and KYC, and made backend fixes in Node.js where features needed them. I then turned the web app into a PWA and packaged it as an Android app with Capacitor, which is live on Google Play.',
    },
  },
  {
    slug: 'rentdigicare',
    name: 'Rentdigicare',
    url: 'https://rentdigicare.com/',
    description: 'Property management platform for Alberta landlords and leasing teams: rental applications, maintenance tasks, showing appointments and tenant notices, all online.',
    stack: ['Node.js', 'React', 'Express', 'Redux', 'Socket.io', 'MongoDB', 'AWS EC2'],
    featured: true,
    caseStudy: {
      problem: 'Rentdigicare is a property management platform from Alberta, Canada. Landlords and leasing teams were tracking applications, maintenance and showings through calls, texts, email and spreadsheets. The platform moves all of it online: rental applications with credit checks, maintenance requests routed to vendors or in-house teams, appointment booking for showings, and SMS and email notices to tenants.',
      built: 'I worked on both the property management app and the public listings site. I built the dashboard APIs, the appointment flow for showings and tenant meetings, and maintenance task assignment and reassignment, plus the filters across both apps. I also fixed bugs, including re-renders that were firing endless API requests.',
    },
  },
  {
    slug: 'ayurvedalayam',
    name: 'Ayurvedalayam',
    url: 'https://www.ayurvedalayam.com/home',
    description:
      'Two connected apps for an Ayurvedic clinic: a clinic website with doctor appointment booking, and an online store for its herbal medicines with PayPal checkout.',
    stack: ['React', 'Vite', 'MUI', 'Express', 'MongoDB', 'PayPal'],
    featured: true,
    caseStudy: {
      problem: 'The clinic makes its own herbal medicines and wanted one online home for both sides of the business: patients booking appointments with its doctors, and customers buying its products.',
      built: 'I built two React apps on a shared Express and MongoDB backend. The clinic website covers services, doctors, facilities and appointment booking. The online store has category browsing, product pages, a cart, accounts and PayPal checkout.',
    },
  },
  {
    slug: 'cleverpush-landing',
    name: 'CleverPush Landing Page',
    url: 'https://landing.cleverpush.com/',
    live: false,
    description:
      'Rebuilt the CleverPush marketing site and documentation page from Figma, with Next.js, Sanity CMS, Tailwind CSS and Framer Motion animations, in German and English.',
    stack: ['Next.js', 'Sanity', 'Tailwind CSS', 'Framer Motion', 'i18n (German / English)', 'SEO'],
    featured: false,
    caseStudy: {
      problem: 'CleverPush’s design team produced a new Figma design for the marketing site. It had to be fast and responsive, run in German and English, and keep its content in a CMS rather than in code.',
      built: 'I rebuilt the landing page and a new documentation page in Next.js and Tailwind CSS, with Framer Motion animations and Sanity as the CMS. I also built a custom-coded page inside the existing WordPress site. CleverPush later shelved the new site, so it is no longer live.',
    },
  },
  {
    slug: 'xylothia',
    name: 'Xylothia',
    url: 'https://xylothia.vercel.app/',
    description: 'Marketing site for a hybrid neobank concept that bridges traditional banking and a crypto on-ramp, with Framer Motion animations.',
    stack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
    featured: false,
  },
  {
    slug: 'basekamp',
    name: 'BaseKamp',
    url: 'https://basekamp.co.uk/',
    description: 'Booking and e-commerce platform for a Manchester salon, with appointment scheduling, a shop and a café.',
    stack: ['Node.js', 'React', 'Express', 'MongoDB', 'Socket.io', 'Redis', 'EJS', 'AWS EC2'],
    featured: false,
  },
  {
    slug: 'virtual-solutions',
    name: 'Virtual Solutions',
    url: 'https://www.virtualksa.com/',
    description:
      'Freelance build of a bilingual English and Arabic website, with right-to-left layout, for a Saudi transport and logistics company: services, quote requests, careers and contact.',
    stack: ['Next.js', 'Framer Motion', 'Tailwind CSS', 'i18n (English / Arabic)', 'RTL', 'SEO'],
    featured: false,
  },
  {
    slug: 'ecommerce-ui-template',
    name: 'E-commerce UI Template',
    url: 'https://3legant-ecru.vercel.app',
    description:
      'A modern and responsive e-commerce UI template built with React, Vite, Tailwind CSS, Swiper, and TypeScript, designed to provide a scalable foundation for e-commerce applications.',
    stack: ['React', 'Vite', 'Tailwind CSS', 'Swiper', 'TypeScript', 'Responsive Design'],
    featured: false,
  },
  {
    slug: 'hawr-learn',
    name: 'Hawr Learn',
    url: 'https://www.hawrlearn.in/',
    description:
      'Website for Hawr Learn, a STEM education company running hands-on courses in robotics, coding, rocketry, drones and 3D printing for students and schools.',
    stack: ['Node.js', 'Express', 'React', 'MongoDB', 'Vercel'],
    featured: false,
  },
];
export const featuredProjects = projects.filter((p) => p.featured);
export const otherProjects = projects.filter((p) => !p.featured);
