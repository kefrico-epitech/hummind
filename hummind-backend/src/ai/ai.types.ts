/**
 * Contrat IA agnostique du fournisseur.
 *
 * Tout le code métier dépend de CES types, jamais d'OpenAI/Claude directement.
 * Ajouter un fournisseur = implémenter `LlmProvider`, sans toucher au reste.
 */

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  /** Surcharge ponctuelle du modèle (sinon défaut du fournisseur selon la tâche). */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Force une sortie JSON valide. */
  json?: boolean;
}

export interface ChatResult {
  content: string;
  tokensUsed: number;
}

/** Abstraction d'un fournisseur de LLM. */
export interface LlmProvider {
  readonly name: string;

  /** Réponse complète (non streamée). */
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;

  /** Réponse streamée, token par token. */
  stream(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<string>;

  /** Vecteurs d'embedding (RAG). */
  embed(texts: string[], model?: string): Promise<number[][]>;
}
