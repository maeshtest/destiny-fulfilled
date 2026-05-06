import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield } from "lucide-react";
import maragaLogo from "@/assets/maraga-logo.png";

const AdminLogin = memo(() => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAdmin, isLoading, signIn } = useAuth();
  const navigate = useNavigate();

  // Single effect for redirect - runs only when auth state stabilizes
  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isLoading, user, isAdmin, navigate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      // Navigate immediately after successful sign in
      navigate("/admin/dashboard", { replace: true });
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, signIn, navigate]);

  // Early return with minimal rendering while loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(215,50%,12%)] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(215,50%,12%)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-elevated">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img src={maragaLogo} alt="Maraga '27" className="h-14" loading="eager" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl font-heading">Admin Portal</CardTitle>
          </div>
          <CardDescription>Sign in to access the campaign dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
              ) : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});

AdminLogin.displayName = "AdminLogin";

export default AdminLogin;
