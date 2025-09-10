type Accent =  "amber" | "sky" | "emerald";

const ACCENT: Record<Accent, {dot: string; ring: string}> = {
    amber: {dot: "bg-amber-400", ring: "ring-amber-400"},
    sky: {dot: "bg-sky-400", ring: "ring-sky-400"},
    emerald: {dot: "bg-emerald-400", ring: "ring-emerald-400"},        
};

export default function TypingIndicator({
    name = "Assistant",
    avatarUrl,
    accent = "amber",
    labelOverride,
}: {
    name?: string;
    avatarUrl?: string;
    accent?: Accent;
    labelOverride?: string;
}) {
    const A = ACCENT[accent];
    const label = labelOverride || name || "Assistant";
    
    return (
        <div className="flex items-center gap-3 p1-1">
            <div className={`w-7 h-7 rounded-full overflow-hidden ring-2 ${A.ring}`}>
                <img src={avatarUrl} alt = {label} className="w-full h-full object-cover" loading = "lazy"/>

            </div>

            <div className="text-xs text-neutral-400">
                <span className="mr-2">{label} is thinking...</span>
                <span className="inline-flex items-center gap-1 align-middle">
                    <span className={`w-1.5 h-1.5 rounded-full ${A.dot} animate-bounce`}/>
                    <span className={`w-1.5 h-1.5 rounded-full ${A.dot} animate-bounce [animation-delay:120ms]`}/>
                    <span className={`w-1.5 h-1.5 rounded-full ${A.dot} animate-bounce [animation-delay:240ms]`}/>
                </span>
            </div>
        </div>
    );
}