export default function BlinkingCaret() {

    return (
        <span
            aria-hidden="true"
            className="inline-block ml-0.5 align-[-0.2em] w-[2px] h-[1em] bg-current animate-pulse rounded-sm "
            />
    
    );
}