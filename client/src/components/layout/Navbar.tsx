import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { UserAvatar } from "../UserAvatar";
import { Logo } from "../Logo";

const NAV_LINK = "font-medium text-white/70 hover:text-white transition-colors";
const NAV_LINK_MOBILE = "font-medium text-white/80 hover:text-white transition-colors py-2.5";
const NAV_GHOST = "border-white/25 text-white hover:bg-white/10";

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
    <header className="bg-[var(--color-navy-dark)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl text-white" onClick={closeMenu}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-5 text-sm sm:flex">
          <Link to="/funds" className={NAV_LINK}>
            Browse funds
          </Link>
          <Link to="/organizations" className={NAV_LINK}>
            Nonprofits
          </Link>
          <Link to="/impact" className={NAV_LINK}>
            Impact
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
              <Button variant="ghost" onClick={() => setIsConfirmingLogout(true)} className={NAV_GHOST}>
                Log out
              </Button>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link to="/admin" className={NAV_LINK}>
                Nonprofit dashboard
              </Link>
              <Button variant="ghost" onClick={() => setIsConfirmingLogout(true)} className={NAV_GHOST}>
                Log out
              </Button>
            </>
          )}

          {user?.role === "OWNER" && (
            <>
              <Link to="/owner" className={NAV_LINK}>
                Owner dashboard
              </Link>
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
          <Link to="/funds" className={NAV_LINK_MOBILE} onClick={closeMenu}>
            Browse funds
          </Link>
          <Link to="/organizations" className={NAV_LINK_MOBILE} onClick={closeMenu}>
            Nonprofits
          </Link>
          <Link to="/impact" className={NAV_LINK_MOBILE} onClick={closeMenu}>
            Impact
          </Link>

          {!user && (
            <>
              <Link to="/login" className={NAV_LINK_MOBILE} onClick={closeMenu}>
                Log in
              </Link>
              <Link to="/register" onClick={closeMenu} className="mt-2">
                <Button variant="secondary" className="w-full">
                  Sign up
                </Button>
              </Link>
            </>
          )}

          {user?.role === "DONOR" && (
            <>
              <Link to="/dashboard" className={`flex items-center gap-2 ${NAV_LINK_MOBILE}`} onClick={closeMenu}>
                <UserAvatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
                My donations
              </Link>
              <Button variant="ghost" onClick={() => setIsConfirmingLogout(true)} className={`mt-2 w-full ${NAV_GHOST}`}>
                Log out
              </Button>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link to="/admin" className={NAV_LINK_MOBILE} onClick={closeMenu}>
                Nonprofit dashboard
              </Link>
              <Button variant="ghost" onClick={() => setIsConfirmingLogout(true)} className={`mt-2 w-full ${NAV_GHOST}`}>
                Log out
              </Button>
            </>
          )}

          {user?.role === "OWNER" && (
            <>
              <Link to="/owner" className={NAV_LINK_MOBILE} onClick={closeMenu}>
                Owner dashboard
              </Link>
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
