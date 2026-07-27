"use client";

import React from "react";

export function ErrorState({ message }: { message?: string }) {
  return <div className="text-red-500 p-4">{message || "Erro ao processar dados."}</div>;
}
