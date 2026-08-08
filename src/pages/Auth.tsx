import { useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { User, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { routes } from "@/app/navigation";

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
        navigate(routes.home());
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
        if (error) throw error;
        toast.success("Welcome back to Matisa!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created! Check your email for verification.");
      }
      navigate(routes.home());
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    toast.info("Browsing as guest");
    navigate(routes.home());
  };

  return (
    <div className="min-h-screen bg-[#090807] flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#FFB800] text-black font-extrabold text-2xl shadow-xl font-display mb-2">
            M
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">Matisa</h1>
          <p className="text-white/60 text-xs font-medium max-w-[260px] mx-auto">
            The Namibian consumer social platform for Notes, Stories & Voice.
          </p>
        </div>

        {/* Auth Method Switcher (Phone vs Email) */}
        <div className="flex rounded-2xl bg-[#14110F] p-1 border border-white/10">
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

        <div className="p-6 rounded-[24px] bg-[#1C1714] border border-white/10 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-4">
            {authMethod === "phone" ? (
              <>
                {!otpSent ? (
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xs font-bold text-white/50">
                      +264
                    </span>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="81 123 4567"
                      required
                      className="h-12 pl-16 rounded-xl bg-[#14110F] border border-white/10 text-white text-xs font-bold focus:border-[#FFB800]"
                    />
                  </div>
                ) : (
                  <Input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit SMS OTP"
                    required
                    className="h-12 rounded-xl bg-[#14110F] border border-white/10 text-white text-xs font-bold text-center tracking-widest focus:border-[#FFB800]"
                  />
                )}
              </>
            ) : (
              <>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                  className="h-12 rounded-xl bg-[#14110F] border border-white/10 text-white text-xs font-medium focus:border-[#FFB800]"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="h-12 rounded-xl bg-[#14110F] border border-white/10 text-white text-xs font-medium focus:border-[#FFB800]"
                />
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#FFB800] text-black font-bold text-xs hover:bg-[#FFB800]/90 shadow-md transition active:scale-95"
            >
              {loading
                ? "Processing..."
                : authMethod === "phone"
                  ? otpSent
                    ? "Verify OTP & Sign In"
                    : "Send SMS OTP"
                  : isLogin
                    ? "Sign In"
                    : "Create Account"}
            </Button>
          </form>

          {authMethod === "email" && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-[#FFB800] hover:underline font-semibold"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          )}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={handleGuestLogin}
            className="text-xs text-white/50 hover:text-white transition font-medium"
          >
            Continue as Guest →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
