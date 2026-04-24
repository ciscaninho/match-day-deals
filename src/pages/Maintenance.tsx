import logo from "@/assets/logo.png";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 gradient-pitch opacity-10" aria-hidden="true" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

      <main className="relative z-10 max-w-md w-full text-center flex flex-col items-center gap-6">
        <img
          src={logo}
          alt="Foot Ticket Finder logo"
          width={160}
          height={160}
          className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-xl"
        />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-semibold text-accent-foreground/90">Maintenance en cours</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
          Foot Ticket Finder arrive bientôt&nbsp;!
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed">
          Nous préparons le meilleur de la billetterie officielle pour vous.
          <br />
          Revenez très vite.
        </p>

        <p className="text-xs text-muted-foreground/70 mt-4">
          © {new Date().getFullYear()} Foot Ticket Finder
        </p>
      </main>
    </div>
  );
};

export default Maintenance;
