import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { UserAvatar } from "../UserAvatar";
import { Logo } from "../Logo";

const NAV_LINK = "font-medium text-white/70 hover:text-white transition-colors";
const NAV_GHOST = "border-white/25 text-white hover:bg-white/10";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-navy-dark)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl text-white">
          <Logo />
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link to="/funds" className={NAV_LINK}>
            Browse funds
          </Link>

          {!user && (
            <>
              <Link to="/login" className={NAV_LINK}>
                Log in
              </Link>
              <Link to="/register">
                <Button variant="secondary">Sign up</Button>
              </Link>
            </>
          )}

          {user?.role === "DONOR" && (
            <>
              <Link to="/dashboard" className={`flex items-center gap-2 ${NAV_LINK}`}>
                <UserAvatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
                My donations
              </Link>
              <Button variant="ghost" onClick={handleLogout} className={NAV_GHOST}>
                Log out
              </Button>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link to="/admin" className={NAV_LINK}>
                Admin dashboard
              </Link>
              <Button variant="ghost" onClick={handleLogout} className={NAV_GHOST}>
                Log out
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
