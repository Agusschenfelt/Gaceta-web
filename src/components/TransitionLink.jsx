import { usePageTransition } from "./PageTransitionProvider"; // Ajusta ruta

export default function TransitionLink({ to, label, children, className, ...props }) {
  const { navigateWithTransition, isAnimating } = usePageTransition();

  const handleClick = (e) => {
    e.preventDefault();
    if (!isAnimating) {
      // Pasamos el "label" opcional a la función
      navigateWithTransition(to, label);
    }
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}