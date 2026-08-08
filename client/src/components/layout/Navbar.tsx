import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { UserAvatar } from "../UserAvatar";
import { Logo } from "../Logo";

const NAV_GHOST = "border-white/25 text-white hover:bg-white/10";

// Mirrors the hand-drawn accent underline on the logo, so the current page is marked the same
// way the brand already marks itself, rather than introducing a separate active-state pattern.
function NavLink({ to, mobile, onClick, children }: { to: string; mobile?: boolean; onClick?: () => void; children: ReactNode }) {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative font-medium transition-colors ${mobile ? "py-2.5" : ""} ${isActive ? "text-white" : "text-white/70 hover:text-white"}`}
    >
      <span className="flex items-center gap-2">{children}</span>
      <span
        className={`absolute -bottom-1 left-0 h-0.5 rounded-full bg-[var(--color-accent)] transition-all duration-200 ${
          isActive ? "w-full opacity-100" : "w-0 opacity-0"
        }`}
        aria-hidden="true"
      />
    </Link>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setIsConfirmingLogout(false);
    setIsMenuOpen(false);
    navigate("/");
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="border-b border-white/15 bg-[var(--color-navy-dark)] shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl text-white" onClick={closeMenu}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-5 text-sm sm:flex">
          <NavLink to="/funds">Browse funds</NavLink>
          <NavLink to="/organizations">Nonprofits</NavLink>
          <NavLink to="/impact">Impact</NavLink>

          {!user && (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/register">
                <Button variant="secondary">Sign up</Button>
              </Link>
            </>
          )}

          {user?.role === "DONOR" && (
            <>
              <NavLink to="/dashboard">
                <UserAvatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
                My donations
              </NavLink>
              <Button variant="ghost" onClick={() => setIsConfirmingLogout(true)} className={NAV_GHOST}>
                Log out
              </Button>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <NavLink to="/admin">Nonprofit dashboard</NavLink>
              <Button variant="ghost" onClick={() => setIsConfirmingLogout(true)} className={NAV_GHOST}>
                Log out
              </Button>
            </>
          )}

          {user?.role === "OWNER" && (
            <>
              <NavLink to="/owner">Owner dashboard</NavLink>
              <Button variant="ghost" onClick={() => setIsConfirmingLogout(true)} className={NAV_GHOST}>
                Log out
              </Button>
            </>
          )}
        </nav>

        <button
          type="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 sm:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
            {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 pb-5 pt-2 text-sm sm:hidden">
          <NavLink to="/funds" mobile onClick={closeMenu}>
            Browse funds
          </NavLink>
          <NavLink to="/organizations" mobile onClick={closeMenu}>
            Nonprofits
          </NavLink>
          <NavLink to="/impact" mobile onClick={closeMenu}>
            Impact
          </NavLink>

          {!user && (
            <>
              <NavLink to="/login" mobile onClick={closeMenu}>
                Log in
              </NavLink>
              <Link to="/register" onClick={closeMenu} className="mt-2">
                <Button variant="secondary" className="w-full">
                  Sign up
                </Button>
              </Link>
            </>
          )}

          {user?.role === "DONOR" && (
            <>
              <NavLink to="/dashboard" mobile onClick={closeMenu}>
                <UserAvatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
                My donations
              </NavLink>
              <Button variant="ghost" onClick={() => setIsConfirmingLogout(true)} className={`mt-2 w-full ${NAV_GHOST}`}>
                Log out
              </Button>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <NavLink to="/admin" mobile onClick={closeMenu}>
                Nonprofit dashboard
              </NavLink>
              <Button variant="ghost" onClick={() => setIsConfirmingLogout(true)} className={`mt-2 w-full ${NAV_GHOST}`}>
                Log out
              </Button>
            </>
          )}

          {user?.role === "OWNER" && (
            <>
              <NavLink to="/owner" mobile onClick={closeMenu}>
                Owner dashboard
              </NavLink>
              <Button variant="ghost" onClick={() => setIsConfirmingLogout(true)} className={`mt-2 w-full ${NAV_GHOST}`}>
                Log out
              </Button>
            </>
          )}
        </nav>
      )}

      {isConfirmingLogout && (
        <ConfirmModal
          title="Log out?"
          message="You'll need to log back in to access your account."
          confirmLabel="Log out"
          confirmVariant="primary"
          onConfirm={handleLogout}
          onCancel={() => setIsConfirmingLogout(false)}
        />
      )}
    </header>
  );
}
