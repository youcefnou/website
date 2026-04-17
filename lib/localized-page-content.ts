export type LocalizedPageContent = {
  fr?: string;
  en?: string;
  ar?: string;
};

export function parseLocalizedPageContent(rawContent: string): LocalizedPageContent {
  const trimmed = rawContent?.trim();
  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as LocalizedPageContent;
      if (parsed && typeof parsed === 'object') {
        return {
          fr: typeof parsed.fr === 'string' ? parsed.fr : '',
          en: typeof parsed.en === 'string' ? parsed.en : '',
          ar: typeof parsed.ar === 'string' ? parsed.ar : '',
        };
      }
    } catch {
      // Legacy plain text content; handled below.
    }
  }

  return { fr: rawContent };
}

export function serializeLocalizedPageContent(content: LocalizedPageContent): string {
  return JSON.stringify(
    {
      fr: content.fr?.trim() || '',
      en: content.en?.trim() || '',
      ar: content.ar?.trim() || '',
    },
    null,
    2
  );
}

export function getLocalizedPageContent(
  rawContent: string,
  locale: string
): string {
  const parsed = parseLocalizedPageContent(rawContent);

  if (locale === 'ar' && parsed.ar?.trim()) return parsed.ar;
  if (locale === 'en' && parsed.en?.trim()) return parsed.en;
  if (parsed.fr?.trim()) return parsed.fr;

  return rawContent;
}
