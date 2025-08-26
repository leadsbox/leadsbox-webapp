// Dashboard Index - redirect to inbox
const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
          Welcome to LeadsBox
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your powerful lead management dashboard
        </p>
        <a 
          href="/dashboard" 
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
};

export default Index;
