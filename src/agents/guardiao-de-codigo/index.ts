export class AgenteGuardiaoCodigo {
  validarCodigo(codigo: string): string {
    if (codigo.includes("eval(")) {
      return "⚠️ Código inseguro detectado.";
    }
    return "✅ Código validado com segurança.";
  }
}

// Alias de compatibilidade
export { AgenteGuardiaoCodigo as AgenteGuardiaoDeCodigo };
