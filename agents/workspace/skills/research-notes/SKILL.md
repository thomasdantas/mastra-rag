---
name: research-notes
description: Padroniza o formato de uma nota de pesquisa sobre fontes indexadas (papers, blogs, wiki, docs). Ative ao gravar um arquivo em notes/.
version: 1.0.0
tags:
  - research
  - notes
  - rag
---

# Research Notes

Você está produzindo uma **nota de estudo** sobre fontes indexadas via RAG. Use esta skill
sempre que o aluno pedir para salvar/anotar um resumo em `notes/`.

## Como gerar

1. Chame `search-sources` **antes** de escrever. Baseie a nota apenas nos trechos recuperados.
2. Gere o conteúdo seguindo o template em `references/template.md`.
3. O nome do arquivo deve ser um slug curto em kebab-case terminado em `.md`
   (ex.: `notes/self-attention.md`).
4. Grave com `write_file`. Se a pasta `notes/` não existir, use `mkdir` com `recursive: true`.

## O que toda nota precisa ter

- **Título** claro na primeira linha (`#` markdown).
- **Frontmatter YAML** com `created` (data ISO) e `sources` (lista de sourceIds consultados).
- **Resumo** em 3–5 frases, em português, sem jargão desnecessário.
- **Pontos-chave** em 3–6 bullets curtos.
- **Citações** — cada afirmação factual deve ter o token exato retornado pela tool,
  no formato `[sourceId#N]`.
- **Fontes** no final listando título + URL de cada fonte citada.

## O que evitar

- Inventar trechos que não vieram do `search-sources`.
- Omitir citações em afirmações factuais.
- Escrever blocos longos — mantenha a nota densa e útil pra revisão.
