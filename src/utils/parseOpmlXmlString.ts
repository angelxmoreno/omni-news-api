import { ZodError, z } from 'zod';
import { noPrefixParser, xml2json } from './xml2json';

// Zod schemas - made more permissive for real-world OPML files
const OutlineEntrySchema = z.object({
    text: z.string().optional(),
    title: z.string().optional(),
    xmlUrl: z.string().optional(), // Will validate URL later
    type: z.string().optional(),
    language: z.string().optional(),
    htmlUrl: z.string().optional(),
    outline: z.array(z.any()).optional(), // For nested categories
});

const OpmlHead = z.object({
    title: z.string().optional(),
    dateCreated: z.string().optional(),
});

// Types
export interface OpmlEntry {
    title: string;
    xmlUrl: string;
    text?: string;
    type?: string;
    language?: string;
    htmlUrl?: string;
}

export interface Opml {
    head: {
        title?: string;
        dateCreated?: string;
    };
    entries: OpmlEntry[];
}

const RawOpmlSchema = z.object({
    opml: z.object({
        head: OpmlHead,
        body: z.object({
            outline: z.union([z.array(OutlineEntrySchema), OutlineEntrySchema]),
        }),
    }),
});

// Helper function to extract valid RSS entries from outline structure
const extractRssEntries = (outlines: z.infer<typeof OutlineEntrySchema>[]): OpmlEntry[] => {
    const entries: OpmlEntry[] = [];

    for (const outline of outlines) {
        // If this outline has nested outlines, process them recursively
        if (outline.outline && Array.isArray(outline.outline)) {
            entries.push(...extractRssEntries(outline.outline));
        }

        // If this outline has an xmlUrl, it's a feed entry
        if (outline.xmlUrl && isValidUrl(outline.xmlUrl)) {
            const title = outline.title || outline.text || 'Untitled Feed';
            entries.push({
                title,
                xmlUrl: outline.xmlUrl,
                text: outline.text,
                type: outline.type,
                language: outline.language,
                htmlUrl: outline.htmlUrl,
            });
        }
    }

    return entries;
};

// Simple URL validation helper
const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
};

const normalizeRawOpml = (data: z.infer<typeof RawOpmlSchema>): Opml => {
    const outlines = Array.isArray(data.opml.body.outline) ? data.opml.body.outline : [data.opml.body.outline];

    return {
        head: data.opml.head,
        entries: extractRssEntries(outlines),
    };
};

// Parser
export const parseOpmlXmlString = (xmlString: string): Opml => {
    try {
        const parsed = xml2json<Record<string, unknown>>(xmlString, noPrefixParser);
        const rawOpml = RawOpmlSchema.parse(parsed);
        return normalizeRawOpml(rawOpml);
    } catch (err: unknown) {
        // Let Zod errors bubble up to be properly classified by BaseAdapter
        if (err instanceof ZodError) {
            throw err;
        }

        // For other errors, wrap them with context
        const errorMessage = err instanceof Error ? `OPML parse error: ${err.message}` : 'Unknown OPML parse error';
        throw new Error(errorMessage, { cause: err });
    }
};
