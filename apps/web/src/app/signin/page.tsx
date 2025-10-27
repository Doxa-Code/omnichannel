"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import pkg from "../../../package.json";
import { authenticate } from "../actions/users";

export default function SignInPage() {
  const { toast } = useToast();
  const authenticateActions = useServerActionMutation(authenticate, {
    onError(error) {
      if (error.message === "NEXT_REDIRECT") return;
      toast({
        title: "Erro ao autenticar",
        description: error.message,
        variant: "error",
        duration: 3000,
      });
    },
  });

  return (
    <main
      style={{
        background:
          "url(/background.svg) center bottom no-repeat, linear-gradient(135deg, #3f56a8 0%, #5a73c8 50%, #8b60d4 100%)",
      }}
      className="flex min-h-screen flex-1 flex-col justify-center px-4 lg:px-6"
    >
      <div
        className="sm:mx-auto px-5 py-8 rounded-md shadow !bg-white sm:w-full sm:max-w-md
       flex flex-col gap-4"
      >
        <div className="w-full max-w-[150px] mx-auto">
          <Image alt="Logo" width={1000} height={1000} src="/icon.png" />
        </div>
        <p className="text-center text-md text-gray-500">
          Insira suas credenciais para acessar sua conta.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const data = {
              email: form.get("email")?.toString() ?? "",
              password: form.get("password")?.toString() ?? "",
            };
            if (!data.email || !data.password) {
              toast({
                title: "Erro ao autenticar",
                description: "Preencha as credencias para continuar",
                variant: "error",
                duration: 3000,
              });
              return;
            }
            authenticateActions.mutate(data);
          }}
          className="mt-6 space-y-4"
        >
          <div>
            <Input
              type="email"
              id="email"
              name="email"
              title="Email"
              autoComplete="email"
              className="!border-none shadow-none"
            />
          </div>
          <div>
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="password"
              className="mt-2"
              title="Senha"
            />
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90 flex items-center gap-2"
            isLoading={authenticateActions.isPending}
          >
            Acessar
          </Button>
        </form>
        <div className="flex items-center justify-center w-full">
          <span className="text-xs text-muted-foreground">v{pkg.version}</span>
        </div>
      </div>
    </main>
  );
}
