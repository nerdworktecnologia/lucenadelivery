import React from "react";

const Footer = ({ className = "" }: { className?: string }) => {
  return (
    <footer className={`py-8 px-6 text-center text-sm text-muted-foreground ${className}`}>
      <div className="max-w-6xl mx-auto border-t border-border pt-8">
        © 2026 LucenaDelivery. Comanda, gerencia, entrega. Desenvolvido por{" "}
        <a 
          href="https://carolinebrandstudio.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors font-medium"
        >
          Caroline Brand Studio
        </a>
      </div>
    </footer>
  );
};

export default Footer;
