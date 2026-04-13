// Utility function to convert markdown-style content to React elements
export function formatMarkdownContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let keyCounter = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${keyCounter++}`} className="ml-6 mb-4 space-y-2">
          {currentList.map((item, i) => (
            <li key={i} className="text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line) => {
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={keyCounter++} className="text-2xl font-bold mt-8 mb-4 first:mt-0">
          {line.substring(3)}
        </h2>
      );
    } else if (line.startsWith('- ')) {
      currentList.push(line.substring(2));
    } else if (line.trim() === '') {
      flushList();
      elements.push(<br key={keyCounter++} />);
    } else {
      flushList();
      elements.push(
        <p key={keyCounter++} className="text-muted-foreground mb-4">
          {line}
        </p>
      );
    }
  });

  flushList(); // Flush any remaining list items
  return elements;
}
