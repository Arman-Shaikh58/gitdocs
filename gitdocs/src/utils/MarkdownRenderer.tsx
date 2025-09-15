import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy } from "lucide-react";
import  { useState } from "react";

function MarkdownRenderer({ markdown_text }: { markdown_text: string }) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-3xl font-bold mt-3 mb-2 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-2xl font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-xl font-semibold mt-2 mb-1 text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              className="text-base leading-relaxed mb-2 text-gray-800 dark:text-gray-200"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc list-inside mb-2 ml-5 space-y-1 marker:text-gray-600 dark:marker:text-gray-300"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal list-inside mb-2 ml-5 space-y-1 font-medium text-gray-900 dark:text-gray-100"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              className="ml-1 text-base leading-snug font-normal text-gray-800 dark:text-gray-200"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 hover:underline dark:text-blue-400 font-medium transition-colors"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-blue-400 bg-blue-50 dark:bg-gray-800 pl-4 py-2 italic text-gray-700 dark:text-gray-300 my-3 rounded-md"
              {...props}
            />
          ),
          code: ({ node, ...props }) => {
            const isInline = (props as any).inline;
            const codeContent = String(props.children).replace(/\n$/, "");
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

            if (isInline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400"
                  {...props}
                />
              );
            } else {
              return (
                <div className="relative group">
                  <pre className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg overflow-x-auto my-3 shadow-sm text-sm font-mono leading-snug pr-12">
                    <code {...props} />
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeContent, codeId)}
                    className="absolute top-2 right-2 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                    title="Copy code"
                  >
                    {copiedStates[codeId] ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                </div>
              );
            }
          },
          table: ({ node, ...props }) => {
            const tableId = `table-${Math.random().toString(36).substr(2, 9)}`;
            const tableContent = node?.children
              ?.map((child: any) => {
                if (child.tagName === "thead" || child.tagName === "tbody") {
                  return child.children?.map((row: any) =>
                    row.children?.map((cell: any) => {
                      const cellContent = cell.children
                        ?.map((c: any) => c.value || c.children?.[0]?.value || "")
                        .join("");
                      return cellContent || "";
                    }).join("\t")
                  ).join("\n");
                }
                return "";
              })
              .filter(Boolean)
              .join("\n") || "";

            return (
              <div className="relative group my-3 w-full sm:w-fit">
                <div
                  className="overflow-x-auto sm:overflow-x-visible max-w-full pb-[5px] scrollbar-hide rounded-lg overflow-hidden shadow"
                >
                  <table className="text-sm sm:text-base table-auto border-collapse w-auto border border-gray-200 dark:border-gray-700 ">
                    {props.children}
                  </table>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); copyToClipboard(tableContent, tableId); }}
                  className="absolute  top-0.5 right-2  translate-x-full p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-md shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 border border-gray-200 dark:border-gray-600 z-20"
                  aria-label="Copy table"
                  title="Copy table"
                >
                  {copiedStates[tableId] ? (
                    <span className="text-2xl">✅</span>
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
              </div>
            );
          },
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
              {props.children}
            </thead>
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {props.children}
            </tbody>
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {props.children}
            </tr>
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-2 sm:px-4 py-3 text-left font-semibold border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 whitespace-nowrap min-w-0"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="px-2 sm:px-4 py-3 border-r border-gray-200 dark:border-gray-600 whitespace-nowrap min-w-0 text-gray-900 dark:text-gray-100"
              {...props}
            />
          ),
        }}
      >
        {markdown_text}
      </Markdown>
    </div>
  );
}

export default MarkdownRenderer;
