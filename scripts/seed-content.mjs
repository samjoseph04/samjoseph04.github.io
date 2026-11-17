import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
const target = new URL('../content/portfolio.json', import.meta.url);
try {
  await access(target);
  console.log('Content exists; refusing to overwrite.');
  process.exit(0);
} catch {}
const audit = JSON.parse(
  await readFile(new URL('../docs/audit/games.json', import.meta.url), 'utf8'),
);
const content = {
  schemaVersion: 1,
  personal: {
    name: 'Sam Joseph',
    role: 'MCA student & full-stack developer',
    introduction:
      'Computer science enthusiast building practical web applications, exploring how systems work, and turning ideas into functional software.',
    about:
      'I started my journey in computer science with a curiosity about how software systems work. During my MCA program, I have been learning through hands-on projects, academic coursework, and self-practice.\n\nI focus on full-stack web development and problem-solving. Each project is an opportunity to improve my code, understand system design, and build something useful.',
    portrait: '/assets/sam-joseph-portrait.webp',
    portraitAlt: 'Sam Joseph smiling beside foliage, in the supplied black-and-white portrait.',
    email: '',
    github: 'https://github.com/samjoseph04',
    linkedin: 'https://www.linkedin.com/in/sam-joseph-103b16317/',
  },
  projects: [
    {
      id: 'part-time-work-portal',
      title: 'Part-Time Work Portal',
      category: 'Full-stack web application',
      description:
        'Connecting students with part-time opportunities based on locality and experience, while giving employers a place to post jobs and manage applications.',
      technologies: ['React.js', 'Node.js', 'Express', 'MySQL'],
      problem:
        'Students need a centralized, simple portal to find part-time opportunities. Employers need an easy way to post jobs and manage applications.',
      approach:
        'A React frontend and MySQL database support three user types: Admin, Employer, and Student. Employers can post openings with experience, pay, and location details. Students can browse and filter jobs by locality, type, and requirements.',
      learning: [
        'Building a full-stack system using React and MySQL.',
        'Designing relational databases.',
        'Structuring separate modules for Admin, Employer, and Student.',
      ],
      repository: 'https://github.com/samjoseph04/part-time-work-portal.git',
      demo: '',
      image: '',
    },
    {
      id: 'carpooling-management-system',
      title: 'Carpooling Management System',
      category: 'Web application / Transportation',
      description:
        'A ride-sharing application connecting drivers and riders, with map-based search, ride bookings, and separate workflows for each user.',
      technologies: ['PHP', 'MySQL', 'JavaScript', 'Google Maps API'],
      problem:
        'Daily commuters can struggle to find convenient, affordable transport, while people driving alone have empty seats.',
      approach:
        'A PHP and MySQL application with Google Maps API for location-based search. Drivers register, submit license details for admin approval, and create rides with routes, dates, seats, and prices. Riders search using a map interface and book available seats.',
      learning: [
        'Implementing map search and geolocation with Google Maps API.',
        'Working with PHP sessions and user authentication.',
        'Implementing CRUD operations for rides, bookings, and users.',
      ],
      repository: '',
      demo: '',
      image: '',
    },
  ],
  games: audit.games.map(({ id, name, description, category, tags, destination }) => ({
    id,
    name,
    description:
      {
        'bus-game':
          'Count once each second, choosing BUS instead of COUNT whenever the next number is a multiple of five.',
        'clean-city':
          'Collect garbage on a city grid, avoid moving cars, and refuel before your truck runs out of fuel.',
        'color-maze': 'Find the glowing exit through a changing maze before the timer runs out.',
        drop: 'Move your paddle to catch falling circles and avoid the squares, using mouse, touch, or keyboard.',
        echo: 'Watch the four-pad sequence, then repeat the pattern as each round grows longer.',
        glow: 'Turn every light off by toggling a cell and its neighbours in a series of grid puzzles.',
        slidensolve:
          'Slide numbered tiles into order, leaving the blank at the end, and try to beat your best time.',
      }[id] || description,
    category,
    tags,
    destination,
    featured: ['archery', 'memory-grid', 'rally'].includes(id),
  })),
  skills: [
    ...['C', 'C++', 'Python', 'JavaScript', 'SQL'].map((name) => ({
      id: name === 'C++' ? 'cpp' : name.toLowerCase(),
      name,
      category: 'Languages',
    })),
    ...['Git & GitHub', 'Linux / Bash', 'VS Code', 'GDB', 'React.js'].map((name, index) => ({
      id: `tool-${index + 1}`,
      name,
      category: 'Tools & platforms',
    })),
  ],
  experience: [],
  education: [
    {
      id: 'mca',
      title: 'Master of Computer Applications',
      organization: '',
      period: 'Started 2025 · completion date to be added',
      description:
        'Learning through academic coursework, hands-on projects, and self-practice. Institution details to be added.',
      coursework: {
        subjects: [],
        programmingLanguages: [],
        technologies: [],
        concepts: [],
        note: '',
      },
    },
    {
      id: 'computer-science-degree',
      title: "Bachelor's degree (Computer Science)",
      organization: '',
      period: 'Started 2022 · completion date to be added',
      description: 'Degree details and institution to be added.',
      coursework: {
        subjects: [],
        programmingLanguages: [],
        technologies: [],
        concepts: [],
        note: '',
      },
    },
  ],
  achievements: [],
  resume: { file: '', label: 'Download resume' },
};
await mkdir(new URL('../content/', import.meta.url), { recursive: true });
await writeFile(target, JSON.stringify(content, null, 2) + '\n');
console.log('Created source-derived portfolio content with explicit missing fields.');
