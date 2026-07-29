"use client";

import React from "react";
import { HelpCircle, Check, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const columnRules = [
  {
    label: "Data",
    required: true,
    examples: "data, date, dia, timestamp...",
    example: "2026-03-15",
  },
  {
    label: "Valor",
    required: true,
    examples: "valor, price, total, amount...",
    example: "1.250,00 ou 150.50",
  },
  {
    label: "Categoria",
    required: false,
    examples: "categoria, produto, tipo, sku...",
    example: "Eletrônicos, Moda...",
  },
];

export function HowToUseDialog() {
  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "text-zinc-400 hover:text-zinc-200 gap-1.5"
        )}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Como Usar</span>
      </DialogTrigger>

      <DialogContent
        className={cn(
          "w-[calc(100vw-2rem)] sm:w-full sm:max-w-2xl",
          "max-h-[85vh] overflow-y-auto",
          "text-left"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-zinc-100">O que seu CSV precisa ter</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-zinc-400 leading-relaxed">
            3 colunas, em qualquer ordem, nomes flexíveis:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {columnRules.map((rule) => (
              <div
                key={rule.label}
                className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-zinc-200">{rule.label}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full ml-auto",
                      rule.required
                        ? "bg-red-500/10 text-red-400"
                        : "bg-zinc-700/40 text-zinc-400"
                    )}
                  >
                    {rule.required ? "obrigatória" : "opcional"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 break-words">{rule.examples}</p>
                <p className="text-[11px] text-emerald-400/80 font-mono mt-1.5">
                  ex: {rule.example}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Linhas sem <span className="text-zinc-300">Data</span> ou{" "}
              <span className="text-zinc-300">Valor</span> válidos são descartadas.
              Sem <span className="text-zinc-300">Categoria</span>, a linha vira "Geral".
              Nomes de coluna não reconhecidos? A gente pergunta antes de continuar.
            </p>
          </div>

          <pre className="text-[11px] text-zinc-500 font-mono bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 overflow-x-auto">
data,valor,categoria{"\n"}
2026-03-01,150.90,Eletrônicos{"\n"}
2026-03-02,89.50,Moda
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}