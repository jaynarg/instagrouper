export const metadata = {
  title: "Instagrouper",
  description: "Your saved Instagram posts, finally searchable.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
