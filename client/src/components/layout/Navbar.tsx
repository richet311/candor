import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-paper-raised)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-[var(--color-navy)]">
          ClearFund
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/funds" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Browse funds
          </Link>

          {!user && (
            <>
              <Link to="/login" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                Log in
              </Link>
              <Link to="/register">
                <Button variant="secondary">Sign up</Button>
              </Link>
            </>
          )}

          {user?.role === "DONOR" && (
            <>
              <Link to="/dashboard" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                My giving
              </Link>
              <Button variant="ghost" onClick={handleLogout}>
                Log out
              </Button>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link to="/admin" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                Admin dashboard
              </Link>
              <Button variant="ghost" onClick={handleLogout}>
                Log out
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
