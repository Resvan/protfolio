export interface Project {
  slug: string;
  name: string;
  url: string;
  description: string;
  stack: string[];
  featured: boolean;
  /** Case-study copy; only used when featured. */
  caseStudy?: { problem: string; built: string };
}
export const projects: Project[] = [
  {
    slug: 'cleverpush-landing',
    name: 'CleverPush Landing Page',
    url: 'https://landing.cleverpush.com/',
    description:
      'Designed and developed a responsive landing page for CleverPush using Next.js, Sanity.io, Tailwind CSS, and Framer Motion to enhance user experience and performance.',
    stack: ['Next.js', 'Sanity.io', 'Tailwind CSS', 'Framer Motion', 'Responsive Design', 'SEO Optimization'],
    featured: true,
    caseStudy: {
      problem: 'TODO: what the old CleverPush landing page was missing (speed, editing workflow, conversions?).',
      built: 'TODO: what you built and how (Sanity content model, Next.js pages, animation approach, SEO setup).',
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
      problem: 'TODO: the rental management pain this solved for landlords/tenants.',
      built: 'TODO: modules you built (listings, applications, realtime chat via Socket.io, deployment on EC2).',
    },
  },
  {
    slug: 'ayurvedalayam',
    name: 'Ayurvedalayam',
    url: 'https://www.ayurvedalayam.com/home',
    description:
      'A comprehensive platform for doctor appointments and e-commerce, offering seamless scheduling, product purchasing, and PayPal payment integration.',
    stack: ['React', 'Vite', 'MUI', 'Express', 'MongoDB', 'PayPal Integration'],
    featured: true,
    caseStudy: {
      problem: 'TODO: how the clinic handled appointments and orders before.',
      built: 'TODO: scheduling flow, product catalogue, PayPal checkout, admin tooling.',
    },
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
      'Designed and developed a modern, responsive website for Virtual Solutions, a logistics service provider, with a focus on delivering a dynamic and engaging user experience.',
    stack: ['Next.js', 'Framer Motion', 'Tailwind CSS', 'Responsive Design', 'SEO'],
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
    url: 'https://www.hawrlearn.com',
    description:
      'Hawr Learn embodies the pinnacle of modern education, seamlessly integrating innovation with the latest advancements in learning technology.',
    stack: ['Node JS', 'Express JS', 'React JS', 'Mongodb', 'Hosting - Vercel'],
    featured: false,
  },
];
export const featuredProjects = projects.filter((p) => p.featured);
export const otherProjects = projects.filter((p) => !p.featured);
