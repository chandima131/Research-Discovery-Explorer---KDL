import { Link } from "react-router-dom";

const content = {
  methodology: {
    eyebrow: "TRANSPARENT BY DESIGN",
    title: "How discovery works",
    intro:
      "Two complementary ways to explore a structured, fictional research landscape.",
    sections: [
      [
        "A connected data model",
        "Each researcher belongs to a department and links to expertise areas, keywords, themes and publications. Many-to-many relationships preserve shared concepts without duplicating records. The dataset contains 48 fictional researchers and 144 fictional publications.",
      ],
      [
        "Keyword search: matching language",
        "PostgreSQL English full-text search indexes names, biographies, departments, themes, expertise, keywords and publication text. It normalises words and supports quoted phrases, OR and excluded terms. Multiple ordinary words must all occur. It is useful for specific terminology and identifiable titles.",
      ],
      [
        "Semantic search: matching meaning",
        "The Python service uses sentence-transformers/all-MiniLM-L6-v2 to encode profile text as a 384-dimensional vector. Long profiles are split into 220-token chunks; the normalised mean of chunk embeddings represents the profile. Query vectors are compared with stored profile vectors in PostgreSQL using pgvector.",
      ],
      [
        "Interpreting similarity",
        "Cosine similarity measures the angle between two vectors: dot(a, b) / (length(a) × length(b)). Higher scores indicate closer model representations, not guaranteed relevance. Scores range from −1 to 1 and are not probabilities. This small dataset uses an exact cosine scan so all eligible profiles are considered. Department and concept filters restrict the candidate set.",
      ],
      [
        "About this match",
        "The profile page shows the nearest expertise, keyword and theme labels by their separate cosine similarity to the query. These are related concepts, not proof of why a model ranked the entire profile. Publications are ordered separately by their similarity to the query for semantic results.",
      ],
      [
        "Compare the methods",
        "Run the same query with each search method. Keyword search can miss synonyms and conceptual connections; semantic search can return unexpected associations and less precise terminology. Neither method should replace reading the evidence or consulting domain experts. All semantic candidates are returned in ranked pages; there is no unvalidated relevance threshold.",
      ],
      [
        "Reproducibility and limitations",
        "The model revision c9745ed1d9f207416be6d2e6f8de32d1f16199bf, content hash and indexing timestamp are stored with each embedding. Profiles are not re-encoded on every query. English-language training, incomplete descriptions, profile length and historical biases all influence retrieval. Changes to the model or chunking policy require reindexing and evaluation.",
      ],
    ],
  },
  accessibility: {
    eyebrow: "DESIGNED FOR PARTICIPATION",
    title: "Accessibility",
    intro:
      "Research discovery should be usable by people with different access needs, devices and ways of working.",
    sections: [
      [
        "Structure and navigation",
        "Pages use semantic headings and landmarks, a skip-to-content link and clearly named navigation. Route changes move focus to the main content. Forms have explicit labels and search-method choices use native radio buttons. Interactive elements work with a keyboard and show visible focus outlines.",
      ],
      [
        "Readable, adaptable content",
        "The interface uses high-contrast text, responsive layouts and relative text sizes. Links and status indicators do not rely on colour alone. There are no required animations; reduced-motion preferences are respected. Browser zoom and text resizing remain available.",
      ],
      [
        "Search feedback",
        "Search results expose loading and update announcements to assistive technology. Empty results and service failures include plain-language explanations and recovery actions. The interface preserves query and filter state in the URL.",
      ],
      [
        "Equivalent visualisation content",
        "Every statistical chart has a labelled data table. The network provides a complete researcher-to-expertise table for the selected theme; node position is not required to interpret a relationship. Charts are supplementary to textual content.",
      ],
      [
        "Testing and known limits",
        "The repository includes axe-core browser checks, keyboard-oriented component tests and end-to-end discovery tests. These checks do not certify WCAG conformance. Manual testing with screen readers, magnification and people with disabilities is still needed before a public launch. The target is WCAG 2.2 AA principles where practical.",
      ],
      [
        "When JavaScript is unavailable",
        "A generated HTML directory contains all synthetic profiles, expertise and publications. Interactive search and graphs require JavaScript, but the underlying research content remains readable through the Text directory link in the footer.",
      ],
    ],
  },
  ethics: {
    eyebrow: "RESEARCH INTEGRITY",
    title: "Ethics & privacy",
    intro:
      "A transparent demonstration of discovery methods, with people and research judgement at the centre.",
    sections: [
      [
        "Entirely fictional data",
        "All researcher names, biographies, affiliations and publications are invented for this demonstration. Any resemblance to real people is coincidental. No private university code, records, branding, internal systems or researcher information is used. This project is independent of any institution.",
      ],
      [
        "No researcher quality ranking",
        "Semantic similarity describes closeness between text representations. It cannot measure a person’s ability, impact, credibility, suitability for employment or the quality of their research. Automated systems should support, rather than replace, research judgement.",
      ],
      [
        "Model bias and unexpected associations",
        "Embeddings reflect patterns and biases in their training data. They may underrepresent languages, disciplines, communities and emerging terminology. Synthetic profiles cannot establish fairness or real-world retrieval quality. Results may contain errors or unexpected associations.",
      ],
      [
        "Privacy and queries",
        "The application has no accounts, analytics, cookies or contact forms. Search terms are processed by the local backend and embedding model; they are not sent to an external AI API. Query text appears in the browser URL and may remain in browser history. Avoid entering personal or confidential information. Application access logging is disabled; operators must also review any external proxy logs.",
      ],
      [
        "Reproducibility and stewardship",
        "Each stored embedding records its model name, immutable model revision, content hash and generation time. Model downloads contact the public model repository during installation or first indexing. Changing models, datasets or preprocessing requires an explicit reindexing and evaluation step.",
      ],
      [
        "Before real-world use",
        "A real service would need lawful data sourcing, clear consent and correction processes, retention policies, stakeholder evaluation, bias assessment and an operational security review. This demo is not a validated decision-support system.",
      ],
    ],
  },
};

export default function InformationPage({
  kind,
}: {
  kind: keyof typeof content;
}) {
  const page = content[kind];
  return (
    <div className="page information-page">
      <div className="page-intro">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
      </div>
      <div className="information-layout">
        <nav aria-label="On this page">
          <span className="eyebrow">ON THIS PAGE</span>
          {page.sections.map(([title], i) => (
            <a key={title} href={`#section-${i}`}>
              {title}
            </a>
          ))}
        </nav>
        <div className="prose">
          {page.sections.map(([title, text], i) => (
            <section key={title} id={`section-${i}`}>
              <span className="section-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
          <Link className="button secondary" to="/researchers">
            Explore researchers →
          </Link>
        </div>
      </div>
    </div>
  );
}
