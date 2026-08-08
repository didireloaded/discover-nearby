import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Radio } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6 text-center bg-[#0B0A09] text-white">
      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5">
        <Radio size={36} className="text-[#FFB800]" />
      </div>

      <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">404</h1>
      <p className="text-sm font-semibold text-white/70 mt-1">Page or Room Not Found</p>
      <p className="text-xs text-white/40 max-w-[260px] mt-2 leading-relaxed">
        The link you followed might be broken or the voice room has ended.
      </p>

      <div className="flex items-center gap-3 mt-8">
        <Button
          variant="glass"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border border-white/15"
        >
          <ArrowLeft size={15} />
          <span>Go Back</span>
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-[#FFB800] text-black shadow-md hover:bg-[#FFB800]/90"
        >
          <Home size={15} />
          <span>Home Feed</span>
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
