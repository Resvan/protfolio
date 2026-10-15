export interface Project {
  slug: string;
  name: string;
  url: string;
  description: string;
  stack: string[];
  featured: boolean;
  /** false when the site has been taken down; hides the live link. */
  live?: boolean;
  /** Case-study copy; only used when featured. */
  caseStudy?: { problem: string; built: string };
}
export const projects: Project[] = [
  {
    slug: 'cleverpush-landing',
    name: 'CleverPush Landing Page',
    url: 'https://landing.cleverpush.com/',
    live: false,
    description:
      'Rebuilt the CleverPush marketing site and documentation page from Figma, with Next.js, Sanity CMS, Tailwind CSS and Framer Motion animations, in German and English.',
    stack: ['Next.js', 'Sanity.io', 'Tailwind CSS', 'Framer Motion', 'Responsive Design', 'SEO Optimization'],
    featured: true,
    caseStudy: {
      problem: 'CleverPush’s design team produced a new Figma design for the marketing site. It had to be fast and responsive, run in German and English, and keep its content in a CMS rather than in code.',
      built: 'I rebuilt the landing page and a new documentation page in Next.js and Tailwind CSS, with Framer Motion animations and Sanity as the CMS. I also built a custom-coded page inside the existing WordPress site. CleverPush later shelved the new site, so it is no longer live.',
    },
  },
  {
    slug: 'rentdigicare',
    name: 'Rentdigicare',
    url: 'https://rentdigicare.com/',
    description: 'A comprehensive real estate platform developed to streamline the rental property management process.',
    stack: ['Node JS', 'React JS', 'Express Js', 'Redux', 'Socket.io', 'Mongodb', 'Hosting - Aws Ec2'],
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
    stack: ['React', 'Vite', 'MUI', 'Express', 'MongoDB', 'PayPal Integration'],
    featured: true,
    caseStudy: {
      problem: 'The clinic makes its own herbal medicines and wanted one online home for both sides of the business: patients booking appointments with its doctors, and customers buying its products.',
      built: 'I built two React apps on a shared Express and MongoDB backend. The clinic website covers services, doctors, facilities and appointment booking. The online store has category browsing, product pages, a cart, accounts and PayPal checkout.',
    },
  },
  {
    slug: 'meetxo',
    name: 'MeetXO',
    url: 'https://meetxo-frontend-nextjs-res.vercel.app/',
    description:
      'Freelance build of an expert consultation platform: discovery, profiles, booking with calendar availability, events, OTP sign-in and Razorpay payments.',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'NextAuth', 'Razorpay', 'Node.js', 'MongoDB'],
    featured: false,
  },
  {
    slug: 'xylothia',
    name: 'Xylothia',
    url: 'https://xylothia.vercel.app/',
    description: 'Xylothia revolutionizes banking by seamlessly integrating traditional finance with the dynamic world of cryptocurrencies.',
    stack: ['Next Js', 'Tailwind Css', 'Css', 'Framer motion', 'Hosting - Vercel'],
    featured: false,
  },
  {
    slug: 'basekamp',
    name: 'BaseKamp',
    url: 'https://basekamp.co.uk/',
    description: 'A comprehensive saloon booking and e-commerce system.',
    stack: ['Node JS', 'React JS', 'Express JS', 'Mongodb', 'Socket.io', 'Redis', 'EJS', 'Hosting - Aws Ec2'],
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
    stack: ['Node JS', 'Express JS', 'React JS', 'Mongodb', 'Hosting - Vercel'],
    featured: false,
  },
];
export const featuredProjects = projects.filter((p) => p.featured);
export const otherProjects = projects.filter((p) => !p.featured);
