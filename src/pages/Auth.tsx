import { useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { User, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";

export function Auth() {
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fullPhone = phone.startsWith("+") ? phone : `+264${phone.replace(/^0/, "")}`;

    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
        });
        if (error) throw error;
        setOtpSent(true);
        toast.success(`OTP code sent to ${fullPhone}`);
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: otp,
          type: "sms",
        });
        if (error) throw error;
        toast.success("Phone verified! Welcome to Matisa.");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send SMS OTP code");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === "phone") return handlePhoneAuth(e);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message === "Invalid login credentials") {
            throw new Error("Invalid login credentials. Have you confirmed your email address?");
          }
          throw error;
        }
        toast.success("Welcome back!");
        navigate("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user && !data.session) {
          toast.success("Account created! Please check your email to confirm your account.");
        } else {
          toast.success("Account created! Welcome to Matisa.");
          navigate("/");
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    localStorage.setItem("guestMode", "true");
    toast.info("Browsing as Guest");
    navigate("/");
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[var(--color-background)] text-white overflow-y-auto no-scrollbar flex flex-col font-sans py-6">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-10">
        <div className="w-10 h-10 bg-[var(--color-surface-2)] rounded-xl flex items-center justify-center transform rotate-45 shadow-lg border border-[var(--color-border)]">
          <div className="w-4 h-4 bg-white rounded-sm transform -rotate-45" />
        </div>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-muted)] hover:text-white transition-colors"
        >
          <User className="w-4 h-4" />
          {isLogin ? "Sign Up" : "Sign In"}
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 -mt-6">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm font-medium">
            Join the Namibian social network for audio & stories.
          </p>
        </div>

        {/* Auth Method Switcher (Phone vs Email) */}
        <div className="flex rounded-2xl bg-white/5 p-1 mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("phone");
              setOtpSent(false);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
              authMethod === "phone"
                ? "bg-[#FFB800] text-black shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Phone size={14} />
            <span>Phone OTP</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("email")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
              authMethod === "email"
                ? "bg-[#FFB800] text-black shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Mail size={14} />
            <span>Email & Pass</span>
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {authMethod === "phone" ? (
            <>
              {!otpSent ? (
                <div className="relative">
                  <span className="absolute left-4 top-4 text-sm font-bold text-white/50">
                    +264
                  </span>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="81 123 4567"
                    required
                    className="h-14 pl-16 rounded-2xl bg-[#181513] border-transparent text-white font-bold"
                  />
                </div>
              ) : (
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit SMS OTP"
                  required
                  maxLength={6}
                  className="h-14 rounded-2xl bg-[#181513] border-transparent text-center text-lg tracking-widest font-bold text-white"
                />
              )}
            </>
          ) : (
            <>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="h-14 rounded-2xl bg-[#181513] border-transparent"
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="h-14 rounded-2xl bg-[#181513] border-transparent"
              />
            </>
          )}

          <Button
            variant="primary"
            disabled={loading}
            className="w-full h-14 rounded-2xl font-bold text-base mt-4 bg-[#FFB800] text-black hover:bg-[#FFB800]/90 shadow-md"
          >
            {loading
              ? "Please wait..."
              : authMethod === "phone"
                ? otpSent
                  ? "Verify & Sign In"
                  : "Send SMS Code"
                : isLogin
                  ? "Sign In"
                  : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px bg-[var(--color-border)] flex-1" />
          <span className="text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-wider">
            Or
          </span>
          <div className="h-px bg-[var(--color-border)] flex-1" />
        </div>

        <Button
          variant="glass"
          onClick={handleGuest}
          className="w-full h-14 rounded-2xl font-bold mt-6 border border-white/20"
        >
          Continue as Guest
        </Button>
      </div>
    </div>
  );
}

export default Auth;
