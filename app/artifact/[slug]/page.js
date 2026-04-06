import { getArtifact, getRelatedArtifacts } from '@/lib/artifacts';
import ArtifactPageClient from '@/components/ArtifactPageClient';

export async function generateMetadata({ params }) {
  const artifact = getArtifact(params.slug);
  if (!artifact) return { title: 'Carnelian' };
  return { title: `${artifact.title} — Carnelian`, description: artifact.hook };
}

export default function ArtifactPage({ params }) {
  const artifact = getArtifact(params.slug);
  const related = artifact ? getRelatedArtifacts(params.slug, 3) : [];

  // Pass catalog artifact if found, otherwise ArtifactPageClient
  // will read the generated one from sessionStorage
  return (
    <ArtifactPageClient
      slug={params.slug}
      catalogArtifact={artifact}
      related={related}
    />
  );
}
