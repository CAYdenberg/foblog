export default function Navbar() {
  return (
    <nav className=" bg-dark text-white">
      <div class="container max-w-3xl mx-auto flex flex-row justify-between">
        <ul className="flex flex-row items-center h-16 gap-4">
          <li>
            <a href="/" className="font-bold text-primary">
              OptOut.social
            </a>
          </li>
        </ul>

        <ul className="flex flex-row items-center h-16 gap-4">
          <li>
            <a href="/about">About</a>
          </li>
          <li>
            <a href="/wf">Tech</a>
          </li>
          <li>
            <a href="/blog">Blog</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
