const P = {
  bone: '#F5F3EF',
  ink: '#111111',
  muted: '#6F6A63',
  brand: '#B31B1B',
  rule: '#d8d4ce',
};

const movements = [
  `We are surrounded by beauty,
And slowly losing our ability to recognize it.
Not because it has disappeared —
But because its meaning has flattened into something
Immediate,
Repeatable,
Endless.

The algorithm does not understand why something matters.
Only that it does.
So it delivers more,
& more,
& more.

We collect references without ever touching their origins.
And perform "taste" without ever forming it.

This is how culture flattens.
Not through absence,
But through overexposure.

And somewhere in that
We stop recognizing what we love,
And then ourselves.`,

  `Yet, meaning never stopped being made.

In the way a new song samples something your parents once loved.
In the way a single frame makes you homesick for somewhere you've never been.
In the way a stitch meant for survival became a silhouette.
In the way a painting holds light that no longer exists anywhere else.

Meaning has not disappeared.
It has only become opaque.`,

  `Carnelian is an attempt to see again.
A way of returning wonder to the things we love,
To trace the invisible threads
Between people, movements, places, and ideas.

Because to understand something
Is to fall in love with it differently.

This is for anyone who has ever felt something without knowing why.`,
];

export const metadata = {
  title: 'Manifesto — Carnelian',
  description: 'Carnelian is an attempt to see again.',
};

export default function ManifestoPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: P.bone,
      color: P.ink,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        padding: '28px clamp(24px, 4vw, 48px)',
      }}>
        <a href="/" style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.24em',
          color: P.brand,
          textTransform: 'uppercase',
          fontFamily: 'var(--font-body)',
          textDecoration: 'none',
        }}>
          Carnelian
        </a>
      </header>

      <main style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        padding: 'clamp(48px, 8vw, 112px) clamp(24px, 5vw, 48px) clamp(64px, 8vw, 128px)',
      }}>
        <article style={{
          maxWidth: 620,
          width: '100%',
          fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
          fontSize: 'clamp(19px, 2.2vw, 23px)',
          lineHeight: 1.7,
          fontWeight: 400,
          letterSpacing: '-0.005em',
        }}>
          {movements.map((text, i) => (
            <div key={i}>
              <div style={{ whiteSpace: 'pre-line' }}>{text}</div>
              {i < movements.length - 1 && (
                <div aria-hidden style={{
                  margin: 'clamp(40px, 6vw, 64px) 0',
                  height: 1,
                  width: 80,
                  background: P.rule,
                }} />
              )}
            </div>
          ))}

          <div style={{
            marginTop: 'clamp(56px, 8vw, 96px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            fontFamily: 'var(--font-body)',
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.24em',
              color: P.brand,
              textTransform: 'uppercase',
            }}>
              Carnelian
            </span>
            <a href="/" style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              color: P.muted,
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              [ Enter Here ]
            </a>
          </div>
        </article>
      </main>
    </div>
  );
}
