import "../styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {children}
        {/* This is where the modal will "teleport" to */}
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
