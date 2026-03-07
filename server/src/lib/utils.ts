export function slugify(text: string): string {
   return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
}

export function escapeLikePattern(pattern: string): string {
   return pattern.replace(/[$%_]/g, '$$$&');
}
