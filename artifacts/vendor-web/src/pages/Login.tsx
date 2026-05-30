import { useState } from "react";
import { useRequestOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Fish } from "lucide-react";

export default function Login() {
  const { setAuth } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestOtp = useRequestOtp({
    mutation: {
      onSuccess: (data) => {
        setDevOtp((data as { devOtp?: string }).devOtp ?? null);
        setStep("otp");
        setError(null);
      },
      onError: () => setError("Could not send OTP. Check phone number."),
    },
  });

  const verifyOtp = useVerifyOtp({
    mutation: {
      onSuccess: (data) => {
        setAuth({
          token: data.token ?? null,
          userId: data.userId ?? null,
          role: data.role ?? null,
        });
      },
      onError: () => setError("Invalid OTP. Please try again."),
    },
  });

  function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    requestOtp.mutate({ data: { phone } });
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    verifyOtp.mutate({ data: { phone, otp } });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-md mb-4">
            <Fish className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Meat n Sea</h1>
          <p className="text-sm text-muted-foreground mt-1">Vendor Portal</p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
          {step === "phone" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={requestOtp.isPending}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {requestOtp.isPending ? "Sending…" : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Enter OTP
                </label>
                <p className="text-xs text-muted-foreground mb-3">Sent to {phone}</p>
                {devOtp && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-accent/20 border border-accent/40 text-xs text-accent-foreground font-mono">
                    Dev OTP: <span className="font-bold">{devOtp}</span>
                  </div>
                )}
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring tracking-widest text-center text-lg"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={verifyOtp.isPending}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {verifyOtp.isPending ? "Verifying…" : "Verify & Sign In"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("phone"); setError(null); setDevOtp(null); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Change number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
