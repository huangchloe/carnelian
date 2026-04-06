import './globals.css';

export const metadata = {
  title: 'Carnelian — The story behind everything you love',
  description: 'Discover the cultural lineage, meaning, and interpretation behind the art, fashion, music, and objects that shape the world.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
