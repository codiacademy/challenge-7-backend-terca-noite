import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Diretório onde os arquivos de teste serão procurados
    dir: "./src/tests",

    // Configurações para garantir o ambiente Node.js (se necessário)
    environment: "node",

    // Desativa o auto-discovery para rodar apenas os arquivos especificados
    // Recomendado se você tiver outros arquivos no src que não são testes.
    // include: ['**/*.spec.ts', '**/*.test.ts'],

    // Garante que o Vitest lide corretamente com caminhos de importação
    resolve: {
      // Se você usa caminhos como @/lib, adicione o alias aqui
      // alias: { '@/': new URL('./src/', import.meta.url).pathname }
    },
  },
});
