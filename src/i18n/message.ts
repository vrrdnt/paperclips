import type english from './locales/en.json';

export type MessageKey = keyof typeof english.messages;
export type NumberValue = { number: number; style: 'decimal' | 'compact'; decimals: number };
export type ListValue = { items: readonly MessageValue[]; separator: string };
export type MessageValue = string | number | Message | NumberValue | ListValue;
export type MessageValues = Readonly<Record<string, MessageValue>>;
export interface Message { key: MessageKey; values?: MessageValues; }
export type LocalizedText = string | Message;

/** Deferred display data: constructing a message never reads the player's locale. */
export function message(key: MessageKey, values?: MessageValues): Message {
  return values ? { key, values } : { key };
}

export function numberValue(number: number, decimals = 0): NumberValue {
  return { number, style: 'decimal', decimals };
}

export function compactValue(number: number): NumberValue {
  return { number, style: 'compact', decimals: 1 };
}

export function listValue(items: readonly MessageValue[], separator = ', '): ListValue {
  return { items, separator };
}
