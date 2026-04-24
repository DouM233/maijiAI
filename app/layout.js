import "../styles.css";

export const metadata = {
  title: "麦吉AI - 企业智能工作台",
  description: "麦吉AI 企业智能工作台前端原型 Next.js 骨架"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
