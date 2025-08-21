import { XMLParser, XMLValidator } from 'fast-xml-parser';

const defaultParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
});

export const xml2json = <T = unknown>(xmlString: string, parser = defaultParser): T => {
    try {
        if (XMLValidator.validate(xmlString) !== true) {
            throw new Error('Invalid XML');
        }
        return parser.parse(xmlString) as T;
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? `XML parse error: ${err.message}` : 'Unknown XML parse error';
        throw new Error(errorMessage, { cause: err });
    }
};
