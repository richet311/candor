import { useState, type FormEvent } from "react";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

export function PickDetailsStep({
  initialFirstName = "",
  initialLastName = "",
  initialUsername = "",
  onSubmit,
}: {
  initialFirstName?: string;
  initialLastName?: string;
  initialUsername?: string;
  onSubmit: (details: { firstName: string; lastName: string; username: string }) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [username, setUsername] = useState(initialUsername);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ firstName, lastName, username });
    } catch {
      // toast already shown by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
        <Input label="Last name" required value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
      </div>
      <Input
        label="Username"
        required
        minLength={3}
        maxLength={24}
        pattern="[a-zA-Z0-9_]+"
        title="Letters, numbers, and underscores only"
        hint="Shown on your public donations instead of your real name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
      />
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Continue
      </Button>
    </form>
  );
}
