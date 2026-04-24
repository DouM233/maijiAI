import { RawMarkup } from "./RawMarkup";

export function ChatWorkspace({ topbar, chatView, heroArea, toolSections }) {
  return (
    <>
      <RawMarkup html={topbar} />
      <RawMarkup html={chatView} />
      <RawMarkup html={heroArea} />
      <RawMarkup html={toolSections} />
    </>
  );
}
