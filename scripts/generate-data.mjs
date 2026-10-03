import { mkdirSync, writeFileSync } from 'node:fs';

// Entirely invented profiles, publications and affiliations. No scraped sources.
const clusters = [
  ['Digital Humanities', 'Language & archives', 'Methods for interpreting cultural records at scale.', ['Natural language processing', 'Historical archives', 'Machine learning'], ['correspondence', 'text mining', 'digital archives'], 'investigates how computational methods reveal patterns in historical correspondence and digitised collections', ['Computational Analysis of Nineteenth-Century Correspondence', 'Recovering Voices from Fragmented Archives']],
  ['History', 'Language & archives', 'Methods for interpreting cultural records at scale.', ['Oral history', 'Archival analysis', 'Public history'], ['memory', 'migration', 'historical documents'], 'studies migration and collective memory through oral testimony, community records and historical documents', ['Community Memory and the Moving Archive', 'Reading Migration through Local Records']],
  ['Linguistics', 'Language & archives', 'Methods for interpreting cultural records at scale.', ['Corpus linguistics', 'Natural language processing', 'Sociolinguistics'], ['multilingualism', 'speech', 'language change'], 'examines language change across multilingual communities using annotated text corpora and spoken narratives', ['Language Change in Multilingual Neighbourhoods', 'Building Inclusive Speech Corpora']],
  ['Archaeology', 'Culture & heritage', 'Understanding and preserving material and intangible culture.', ['Remote sensing', 'Landscape archaeology', 'Spatial analysis'], ['excavation', 'landscapes', 'geospatial data'], 'combines satellite imagery and field surveys to reconstruct settlement patterns and archaeological landscapes', ['Tracing Settlement Networks with Satellite Imagery', 'A Reproducible Survey of Coastal Landscapes']],
  ['Cultural Heritage', 'Culture & heritage', 'Understanding and preserving material and intangible culture.', ['Digital preservation', '3D reconstruction', 'Museum studies'], ['collections', 'conservation', 'cultural heritage'], 'develops participatory approaches to preserving museum collections through three-dimensional reconstruction and community interpretation', ['Participatory Reconstruction of Material Heritage', 'Digital Conservation Beyond the Museum']],
  ['Computer Science', 'Responsible computation', 'Transparent, inclusive computational methods for research.', ['Machine learning', 'Explainable AI', 'Research software'], ['algorithms', 'reproducibility', 'model evaluation'], 'designs interpretable learning algorithms and reproducible software to examine uncertainty and bias in scientific datasets', ['Interpretable Models for Small Research Datasets', 'Evaluating Uncertainty in Scientific Machine Learning']],
  ['Design & Informatics', 'Responsible computation', 'Transparent, inclusive computational methods for research.', ['Data visualisation', 'Human-computer interaction', 'Accessible design'], ['interaction', 'accessibility', 'visual analytics'], 'creates accessible visual interfaces that help diverse audiences explore complex data and understand uncertainty', ['Accessible Visual Analytics for Public Research', 'Communicating Uncertainty through Interactive Design']],
  ['Sociology', 'Society & communities', 'Social change, participation and equitable institutions.', ['Computational social science', 'Social network analysis', 'Qualitative methods'], ['inequality', 'communities', 'social networks'], 'examines social inequality and community participation through network analysis, interviews and longitudinal surveys', ['Mapping Participation in Community Networks', 'Mixed Methods for Studying Social Inequality']],
  ['Literature', 'Language & archives', 'Methods for interpreting cultural records at scale.', ['Literary analysis', 'Text mining', 'Book history'], ['narrative', 'publishing', 'distant reading'], 'explores narrative form and publishing history using close reading alongside computational analysis of digitised novels', ['Narrative Patterns across Digitised Fiction', 'The Changing Networks of Independent Publishing']],
  ['Geography', 'Environment & place', 'Relationships between communities, landscapes and environmental change.', ['Geographic information systems', 'Climate adaptation', 'Spatial analysis'], ['climate', 'cities', 'environmental justice'], 'maps how urban communities experience environmental change and develop equitable approaches to climate adaptation', ['Urban Heat and Unequal Exposure', 'Community Mapping for Climate Adaptation']],
  ['Information Studies', 'Open knowledge', 'Reproducible, discoverable and accessible research infrastructure.', ['Digital archives', 'Metadata standards', 'Open science'], ['FAIR data', 'repositories', 'data stewardship'], 'builds sustainable research data practices using interoperable metadata, open repositories and community-led stewardship', ['Interoperable Metadata for Community Collections', 'Sustainable Stewardship of Open Research Data']],
  ['Social Policy', 'Society & communities', 'Social change, participation and equitable institutions.', ['Policy evaluation', 'Computational social science', 'Participatory research'], ['public services', 'inclusion', 'evidence'], 'evaluates public services with participatory methods and linked administrative data to understand barriers to inclusion', ['Participatory Evidence for Inclusive Public Services', 'Evaluating Local Policy with Linked Data']],
];
const first = ['Maya', 'Elias', 'Leila', 'Theo', 'Amara', 'Felix', 'Nadia', 'Rowan', 'Sana', 'Hugo', 'Iris', 'Kiran', 'Ada', 'Jonah', 'Esme', 'Luca', 'Zara', 'Otis', 'Mina', 'Arlo', 'Nora', 'Idris', 'Cleo', 'Rafi', 'Anya', 'Leon', 'Talia', 'Finn', 'Noor', 'Jasper', 'Elin', 'Samir', 'Alma', 'Tobin', 'Yara', 'Evan', 'Ines', 'Milo', 'Dara', 'Remy', 'Lina', 'Owen', 'Zola', 'Asa', 'Nila', 'Soren', 'Thea', 'Emil'];
const last = ['Bennett', 'Vale', 'Hartwell', 'Ashford', 'Fenwick', 'Mercer', 'Elwood', 'Bellamy', 'Wrenford', 'Calder', 'Hollis', 'Whitcombe', 'Briar', 'Northwood', 'Alden', 'Fairbourne', 'Marlow', 'Greystone', 'Larkin', 'Westbrook', 'Dunley', 'Pember', 'Roswell', 'Fielding', 'Cresswell', 'Hawthorne', 'Ellery', 'Winslow', 'Redfern', 'Langford', 'Everett', 'Brookmere', 'Kingswell', 'Hartley', 'Greenfell', 'Woodmere', 'Ainsley', 'Rivers', 'Farnell', 'Kestrel', 'Oakley', 'Linden', 'Moreland', 'Perrin', 'Somerton', 'Waverley', 'Claybourne', 'Finch'];
const angles = [
  ['Community-led inquiry', 'works with community groups to identify research questions and interpret findings', 'A Community-Led Study'],
  ['Reproducible methods', 'publishes reproducible workflows and compares methodological choices across independent datasets', 'Methods and Reproducibility'],
  ['Ethical data practice', 'examines whose perspectives are missing from datasets and how research practices can address exclusion', 'Representation and Missing Perspectives'],
  ['Comparative analysis', 'compares regional case studies to understand how local context changes the interpretation of evidence', 'A Comparative Regional Analysis'],
];
const catalog = { departments: [], themes: [], expertise: [], keywords: [] };
function named(collection, name, description) {
  let item = catalog[collection].find(x => x.name === name);
  if (!item) { item = { id: catalog[collection].length + 1, name, ...(description ? { description } : {}) }; catalog[collection].push(item); }
  return item;
}
const researchers = Array.from({ length: 48 }, (_, i) => {
  const [dept, theme, description, expertise, keywords, bio, titles] = clusters[i % clusters.length];
  const angle = angles[Math.floor(i / clusters.length)];
  return {
    id: i + 1, name: `Dr ${first[i]} ${last[i]}`, department: named('departments', dept),
    biography: `${first[i]} ${bio}. Their work ${angle[1]}. Current projects connect ${keywords[0]} with ${expertise[1].toLowerCase()} in carefully documented demonstration studies.`,
    expertise: [...expertise, angle[0]].map(x => named('expertise', x)),
    keywords: keywords.map(x => named('keywords', x)),
    themes: [named('themes', theme, description), ...(i >= 12 && i % 3 === 0 ? [named('themes', 'Open knowledge', 'Reproducible, discoverable and accessible research infrastructure.')] : [])],
    publications: Array.from({ length: 2 + (i % 3) }, (_, p) => ({ id: i * 4 + p + 1, title: `${titles[p % 2]}${p >= 2 ? ': Follow-up Evidence' : ''}${i >= 12 ? ` — ${angle[2]}` : ''}`, abstract: `This fictional study investigates ${keywords[p % 3]} through ${expertise[p % 3].toLowerCase()}. It uses ${angle[0].toLowerCase()} to examine ${keywords[(p + 1) % 3]}, describes methodological limitations and provides a reproducible framework for interpretation.`, publication_year: 2020 + ((i + p) % 6) })),
    updated_at: '2026-01-15T12:00:00Z',
  };
});
mkdirSync('data', { recursive: true });
writeFileSync('data/researchers.json', JSON.stringify({ provenance: 'Synthetic demonstration data. All profiles and publications are fictional; any resemblance is coincidental.', version: '1.0.0', ...catalog, researchers }, null, 2) + '\n');
console.log(`Generated ${researchers.length} fictional researchers.`);
