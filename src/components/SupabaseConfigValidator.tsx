import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const getProjectIdFromUrl = (url: string) => {
  const match = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match?.[1] ?? null;
};

export const SupabaseConfigValidator = ({ children }: { children: React.ReactNode }) => {
  const [isValid, setIsValid] = useState(true);
  const [errorType, setErrorType] = useState<"missing" | "mismatch" | null>(null);
  const [projectInfo, setProjectInfo] = useState<{ expected: string | null; current: string | null }>({
    expected: null,
    current: null,
  });

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const expectedProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || null;

    if (!url || !key) {
      setIsValid(false);
      setErrorType("missing");
      return;
    }

    const currentProjectId = getProjectIdFromUrl(url);
    setProjectInfo({ expected: expectedProjectId, current: currentProjectId });

    if (expectedProjectId && !url.includes(expectedProjectId)) {
      setIsValid(false);
      setErrorType("mismatch");
      return;
    }
  }, []);

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuração do Supabase Incorreta</AlertTitle>
          <AlertDescription>
            {errorType === "missing" 
              ? "As chaves do Supabase não foram encontradas nas variáveis de ambiente."
              : `O app está tentando se conectar a um projeto Supabase diferente do esperado (${projectInfo.expected ?? "não definido"}). Isso pode causar falhas na autenticação e no banco de dados.`}
            <div className="mt-4 text-sm opacity-90">
              Verifique <code className="bg-destructive-foreground/20 px-1 rounded">{".env"}</code> (ou as variáveis do ambiente do deploy) para <code className="bg-destructive-foreground/20 px-1 rounded">{"VITE_SUPABASE_URL"}</code>, <code className="bg-destructive-foreground/20 px-1 rounded">{"VITE_SUPABASE_PUBLISHABLE_KEY"}</code> e, se aplicável, <code className="bg-destructive-foreground/20 px-1 rounded">{"VITE_SUPABASE_PROJECT_ID"}</code>.
              {projectInfo.current ? (
                <div className="mt-2">
                  Projeto detectado na URL: <code className="bg-destructive-foreground/20 px-1 rounded">{projectInfo.current}</code>
                </div>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
