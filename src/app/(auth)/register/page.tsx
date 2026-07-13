import { RegisterForm } from "@/features/auth/components";

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Get started with The Morningstar Solution
          </p>
        </div>
        <RegisterForm />
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-foreground font-medium hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
