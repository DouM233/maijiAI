export function RawMarkup({ as: Tag = "div", html, ...props }) {
  return <Tag {...props} dangerouslySetInnerHTML={{ __html: html }} />;
}
