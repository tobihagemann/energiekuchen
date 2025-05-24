import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Energiekuchen",
  description: "TODO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={``}>
        {children}
      </body>
    </html>
  );
}
