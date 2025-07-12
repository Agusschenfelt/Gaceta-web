export default function BotonGaceta({ children, size = "md" }) {

  const sizeClass = {
    sm: "px-8 text-sm",
    md: "px-7 text-base",
    lg: "px-14 text-lg",
  }[size];

  return (
    <button className={`rounded-full font-medium flex items-center gap-2 transition py-1 ${sizeClass} bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-500 hover:border-orange-500`}>
      {children}
    </button>
  );
}