import data from '../../../content/portfolio.json';
import { portfolioSchema } from '@portfolio/content';
import Portfolio from '../components/Portfolio';

export default function Page() {
  return <Portfolio content={portfolioSchema.parse(data)} />;
}
