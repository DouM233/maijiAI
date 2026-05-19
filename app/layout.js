import "../styles.css";

export const metadata = {
  title: "麦吉AI - AI工具中心",
  description: "麦吉AI 电商图片、动效和内容工具入口"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
