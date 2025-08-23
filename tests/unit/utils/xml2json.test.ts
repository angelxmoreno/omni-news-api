// tests/xml2json.test.ts
import { describe, expect, it } from 'bun:test';
import { xml2json } from '../../../src/utils/xml2json';

describe('xml2json util', () => {
    it('parses a simple XML string into an object', () => {
        const xml = `
      <note>
        <to>Alice</to>
        <from>Bob</from>
        <message>Hello!</message>
      </note>
    `;

        const result = xml2json(xml);

        expect(result).toEqual({
            note: {
                to: 'Alice',
                from: 'Bob',
                message: 'Hello!',
            },
        });
    });

    it('parses nested XML elements correctly', () => {
        const xml = `
      <root>
        <parent>
          <child id="1">One</child>
          <child id="2">Two</child>
        </parent>
      </root>
    `;

        const result = xml2json(xml);

        expect(result).toEqual({
            root: {
                parent: {
                    child: [
                        { '@_id': '1', '#text': 'One' },
                        { '@_id': '2', '#text': 'Two' },
                    ],
                },
            },
        });
    });

    it('throws an error for invalid XML', () => {
        const invalidXml = `<root><unclosed></root>`;
        expect(() => xml2json(invalidXml)).toThrow('XML parse error');
    });
});
