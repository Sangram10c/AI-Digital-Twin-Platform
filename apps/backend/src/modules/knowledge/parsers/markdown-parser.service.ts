import { Injectable } from '@nestjs/common';

export interface MarkdownSection {
  heading?: string;
  level?: number;
  content: string;
}

@Injectable()
export class MarkdownParserService {
  splitByHeadings(content: string): MarkdownSection[] {
    const lines = content.split('\n');
    const sections: MarkdownSection[] = [];
    let current: MarkdownSection = { content: '' };

    for (const line of lines) {
      const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
      if (headingMatch) {
        if (current.content.trim() || current.heading) {
          sections.push(current);
        }
        current = {
          heading: headingMatch[2].trim(),
          level: headingMatch[1].length,
          content: '',
        };
        continue;
      }
      current.content += `${line}\n`;
    }

    if (current.content.trim() || current.heading) {
      sections.push(current);
    }

    return sections.length > 0 ? sections : [{ content }];
  }

  splitByParagraphs(content: string): string[] {
    return content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  extractLinks(content: string): string[] {
    const links: string[] = [];
    const markdownLink = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = markdownLink.exec(content)) !== null) {
      links.push(match[2]);
    }
    return links;
  }

  extractImages(content: string): string[] {
    const images: string[] = [];
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = imagePattern.exec(content)) !== null) {
      images.push(match[2]);
    }
    return images;
  }
}
