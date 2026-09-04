export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-800 bg-background py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 text-sm text-gray-400">
        <p className="text-foreground">
          The Proper Painter — Women-Owned &amp; Operated, Fully Insured Licensed Contractor
        </p>
        <p>&copy; {year} The Proper Painter. All rights reserved.</p>
      </div>
    </footer>
  )
}
