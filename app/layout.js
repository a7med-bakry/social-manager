import "./globals.css";

export const metadata = {
  title: "Social Manager",
  description: "Central dashboard for managing social accounts"
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
