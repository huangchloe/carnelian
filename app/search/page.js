import Link from 'next/link';
import { searchArtifacts, getAllArtifacts } from '@/lib/artifacts';
import SearchInput from '@/components/SearchInput';
import DynamicArtifactLoader from '@/components/DynamicArtifactLoader';

export function generateMetadata({ searchParams }) {
  const q = searchParams?.q || '';
  return { title: q ? `"${q}" — Carnelian` : 'Search — Carnelian' };
}

function ArtifactCard({ artifact, badge }) {
  return (
    <Link href={`/artifact/${artifact.slug}`}
      style={{ display: 'flex', gap: 20, padding: '22px 26px', background: 'white', border: '1px solid #e0dcd6', borderRadius: 14, textDecoration: 'none', boxShadow: '0 1px 8px rgba(0,0,0,0.03)', transition: 'border-color 0.15s' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {badge && (
          <div style={{ display: 'inline-block', fontSize: 10, padding: '3px 10px', borderRadius: 20, marginBottom: 10, background: '#f5ece8', color: '#B94932', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {badge}
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: '#1a1816', marginBottom: 6, lineHeight: 1.15 }}>
          {artifact.title}
        </div>
        <div style={{ fontSize: 12, color: '#a0a8a0', marginBottom: 10, letterSpacing: '0.04em' }}>
          {artifact.type} · {artifact.medium} · {artifact.origin} · {artifact.year}
        </div>
        <p style={{ fontSize: 15, color: '#6b6860', lineHeight: 1.7, marginBottom: 8 }}>{artifact.hook}</p>
        <p style={{ fontSize: 14, color: '#B94932', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>{artifact.carnelianReads}</p>
      </div>
      <div style={{ fontSize: 16, color: '#d0cdc8', alignSelf: 'flex-start', paddingTop: 6 }}>↗</div>
    </Link>
  );
}

export default function SearchPage({ searchParams }) {
  const q = searchParams?.q?.trim() || '';
  const result = q ? searchArtifacts(q) : { exact: null, suggestions: [], noMatch: false };
  const all = getAllArtifacts();
  const hasQuery = q.length > 1;

  // Show catalog matches
  const exactMatch = result.exact;
  const bestMatch = result.primarySuggestion;
  const dym = result.didYouMean;
  const others = result.suggestions || [];
  const hasCatalogResults = exactMatch || bestMatch || dym || others.length > 0;

  // Always offer dynamic generation when there's a query and no exact match
  const showGenerate = hasQuery && !exactMatch && !bestMatch;

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f1' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid #e8e4de', background: 'rgba(247,245,241,0.95)', backdropFilter: 'blur(8px)' }}>
        <Link href="/" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: '#B94932', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
          Carnelian
        </Link>
        <Link href="/" style={{ fontSize: 13, color: '#888480', textDecoration: 'none' }}>← Back</Link>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>
        <SearchInput initialValue={q} />

        <div style={{ marginTop: 36 }}>
          {!hasQuery && (
            <>
              <div style={{ fontSize: 11, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>
                In Carnelian · {all.length} entries
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {all.map(a => <ArtifactCard key={a.slug} artifact={a} />)}
              </div>
            </>
          )}

          {hasQuery && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {exactMatch && <ArtifactCard artifact={exactMatch} badge="Exact match" />}
              {bestMatch && !exactMatch && <ArtifactCard artifact={bestMatch} badge="Best match" />}
              {dym && !exactMatch && !bestMatch && (
                <>
                  <p style={{ fontSize: 13, color: '#a0a8a0', marginBottom: 2 }}>Did you mean:</p>
                  <ArtifactCard artifact={dym} />
                </>
              )}
              {others.map(a => <ArtifactCard key={a.slug} artifact={a} />)}

              {showGenerate && (
                <div style={{ marginTop: hasCatalogResults ? 24 : 0 }}>
                  {hasCatalogResults && (
                    <div style={{ fontSize: 11, color: '#a0a8a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                      Also generating
                    </div>
                  )}
                  <DynamicArtifactLoader query={q} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
